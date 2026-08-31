package com.socialflow.service;

import com.socialflow.entity.*;
import com.socialflow.repository.PostRepository;
import com.socialflow.repository.ScheduledPostRepository;
import com.socialflow.repository.SocialAccountRepository;
import com.socialflow.service.publisher.PublishResult;
import com.socialflow.service.publisher.SocialMediaPublisher;
import com.socialflow.service.publisher.SocialMediaPublisherFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Background job that automatically publishes scheduled posts at their scheduled time.
 *
 * Runs every 60 seconds.
 *
 * DOUBLE-PUBLISH PREVENTION:
 * The job transitions posts to PROCESSING status (within a transaction) before publishing.
 * Only posts with status = SCHEDULED are considered. PROCESSING posts are skipped.
 * This prevents the same post from being published twice even if the scheduler runs concurrently.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledPostPublisherJob {

    private final ScheduledPostRepository scheduledPostRepository;
    private final PostRepository postRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final SocialMediaPublisherFactory publisherFactory;

    @Scheduled(fixedDelay = 60_000) // Run every 60 seconds
    public void publishDuePosts() {
        LocalDateTime now = LocalDateTime.now();
        List<ScheduledPost> duePosts = scheduledPostRepository
                .findByStatusAndScheduledDateTimeBefore(ScheduleStatus.SCHEDULED, now);

        if (duePosts.isEmpty()) return;

        log.info("[Scheduler] Found {} due scheduled post(s) to publish", duePosts.size());

        for (ScheduledPost scheduledPost : duePosts) {
            processScheduledPost(scheduledPost);
        }
    }

    @Transactional
    protected void processScheduledPost(ScheduledPost scheduledPost) {
        // Re-fetch with fresh transaction to detect concurrent modification
        Optional<ScheduledPost> freshOpt = scheduledPostRepository.findById(scheduledPost.getId());
        if (freshOpt.isEmpty()) return;

        ScheduledPost fresh = freshOpt.get();

        // Double-publish guard: skip if already processed by another thread
        if (fresh.getStatus() != ScheduleStatus.SCHEDULED) {
            log.debug("[Scheduler] Skipping scheduled post id={} — status is already {}",
                    fresh.getId(), fresh.getStatus());
            return;
        }

        // 1. Transition to PROCESSING (prevents duplicate publish)
        fresh.setStatus(ScheduleStatus.PROCESSING);
        scheduledPostRepository.save(fresh);

        Post post = fresh.getPost();
        if (post == null) {
            log.warn("[Scheduler] ScheduledPost id={} has no associated Post — marking FAILED", fresh.getId());
            fresh.setStatus(ScheduleStatus.FAILED);
            scheduledPostRepository.save(fresh);
            return;
        }

        // Mark linked post as PROCESSING too
        post.setStatus(PostStatus.PROCESSING);
        postRepository.save(post);

        Platform platform = fresh.getPlatform() != null ? fresh.getPlatform() : post.getPlatform();

        if (platform == null) {
            String error = "No platform set on scheduled post";
            log.warn("[Scheduler] Post id={}: {}", post.getId(), error);
            markFailed(fresh, post, error);
            return;
        }

        // 2. Find connected social account
        Optional<SocialAccount> accountOpt = socialAccountRepository
                .findByRestaurantIdAndPlatform(fresh.getRestaurant().getId(), platform);

        if (accountOpt.isEmpty()) {
            String error = "No connected " + platform.name() + " account found. Please connect your account.";
            log.warn("[Scheduler] Post id={}: {}", post.getId(), error);
            markFailed(fresh, post, error);
            return;
        }

        SocialAccount account = accountOpt.get();

        if (!Boolean.TRUE.equals(account.getIsConnected()) || !account.isTokenValid()) {
            String error = platform.name() + " access token is expired or disconnected. Please reconnect.";
            log.warn("[Scheduler] Post id={}: {}", post.getId(), error);
            markFailed(fresh, post, error);
            return;
        }

        // 3. Call the platform publisher
        try {
            SocialMediaPublisher publisher = publisherFactory.getPublisher(platform);
            PublishResult result = publisher.publish(post, account);

            if (result.success()) {
                // 4a. Success → PUBLISHED
                post.setStatus(PostStatus.PUBLISHED);
                post.setPublishedAt(LocalDateTime.now());
                post.setPlatformPostId(result.platformPostId());
                post.setFailureReason(null);
                postRepository.save(post);

                fresh.setStatus(ScheduleStatus.PUBLISHED);
                scheduledPostRepository.save(fresh);

                log.info("[Scheduler] Post id={} published to {} — platformPostId={}",
                        post.getId(), platform, result.platformPostId());
            } else {
                // 4b. Failure → FAILED
                markFailed(fresh, post, result.errorMessage());
            }
        } catch (Exception e) {
            log.error("[Scheduler] Unexpected error publishing post id={}: {}", post.getId(), e.getMessage());
            markFailed(fresh, post, "Unexpected error: " + e.getMessage());
        }
    }

    private void markFailed(ScheduledPost scheduledPost, Post post, String reason) {
        scheduledPost.setStatus(ScheduleStatus.FAILED);
        scheduledPostRepository.save(scheduledPost);

        if (post != null) {
            post.setStatus(PostStatus.FAILED);
            post.setFailureReason(reason);
            postRepository.save(post);
        }
    }
}
