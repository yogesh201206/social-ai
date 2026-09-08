package com.socialflow.service.impl;

import com.socialflow.dto.PostActivitiesResponse;
import com.socialflow.dto.SocialActivityDto;
import com.socialflow.entity.*;
import com.socialflow.exception.ResourceNotFoundException;
import com.socialflow.exception.UnauthorizedException;
import com.socialflow.repository.PostRepository;
import com.socialflow.repository.SocialAccountRepository;
import com.socialflow.repository.SocialActivityRepository;
import com.socialflow.service.SocialActivityService;
import com.socialflow.service.publisher.ActivityResult;
import com.socialflow.service.publisher.SocialActivityItem;
import com.socialflow.service.publisher.SocialMediaPublisher;
import com.socialflow.service.publisher.SocialMediaPublisherFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SocialActivityServiceImpl implements SocialActivityService {

    private final PostRepository postRepository;
    private final SocialActivityRepository socialActivityRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final SocialMediaPublisherFactory publisherFactory;

    @Override
    @Transactional(readOnly = true)
    public PostActivitiesResponse getActivities(Long postId, String currentUserEmail, boolean isAdmin) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        verifyPostOwnership(post, currentUserEmail, isAdmin);

        List<SocialActivity> activities = socialActivityRepository.findByPostIdOrderByCreatedAtDesc(postId);
        List<SocialActivityDto> dtoList = activities.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        String status = "AVAILABLE";
        String message = null;

        if (post.getStatus() != PostStatus.PUBLISHED || post.getPlatformPostId() == null || post.getPlatformPostId().isBlank()) {
            status = "NOT_FETCHED";
            message = "Post is not published or has no platform post ID.";
        }

        return PostActivitiesResponse.builder()
                .postId(postId)
                .platform(post.getPlatform())
                .status(status)
                .message(message)
                .activities(dtoList)
                .totalActivities(dtoList.size())
                .fetchedAt(LocalDateTime.now())
                .build();
    }

    @Override
    @Transactional
    public PostActivitiesResponse refreshActivities(Long postId, String currentUserEmail, boolean isAdmin) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        verifyPostOwnership(post, currentUserEmail, isAdmin);

        Platform platform = post.getPlatform();

        // Validate post status and platform ID
        if (post.getStatus() != PostStatus.PUBLISHED || post.getPlatformPostId() == null || post.getPlatformPostId().isBlank()) {
            return PostActivitiesResponse.builder()
                    .postId(postId)
                    .platform(platform)
                    .status("NOT_FETCHED")
                    .message("Post is not published or does not have an external platform ID.")
                    .activities(getStoredActivitiesDto(postId))
                    .totalActivities(socialActivityRepository.findByPostIdOrderByCreatedAtDesc(postId).size())
                    .fetchedAt(LocalDateTime.now())
                    .build();
        }

        if (platform == null) {
            return PostActivitiesResponse.builder()
                    .postId(postId)
                    .platform(null)
                    .status("NOT_SUPPORTED")
                    .message("Platform is not specified for this post.")
                    .activities(Collections.emptyList())
                    .totalActivities(0)
                    .fetchedAt(LocalDateTime.now())
                    .build();
        }

        // Validate connected account for restaurant and platform
        Optional<SocialAccount> accountOpt = socialAccountRepository.findByRestaurantIdAndPlatform(post.getRestaurant().getId(), platform);
        if (accountOpt.isEmpty() || !Boolean.TRUE.equals(accountOpt.get().getIsConnected())) {
            return PostActivitiesResponse.builder()
                    .postId(postId)
                    .platform(platform)
                    .status("PERMISSION_REQUIRED")
                    .message("No connected social account found for " + platform.name() + " on this restaurant.")
                    .activities(getStoredActivitiesDto(postId))
                    .totalActivities(socialActivityRepository.findByPostIdOrderByCreatedAtDesc(postId).size())
                    .fetchedAt(LocalDateTime.now())
                    .build();
        }

        SocialAccount account = accountOpt.get();
        SocialMediaPublisher publisher = publisherFactory.getPublisher(platform);

        // Fetch real activities from platform API
        ActivityResult result = publisher.fetchActivities(post, account);
        log.info("[SocialActivity] Refreshed activities for post {} on {}: status={}, itemsCount={}",
                postId, platform, result.status(), result.activities() != null ? result.activities().size() : 0);

        if (result.success() && result.activities() != null) {
            for (SocialActivityItem item : result.activities()) {
                upsertActivity(post, platform, item);
            }
        }

        List<SocialActivityDto> updatedDtoList = getStoredActivitiesDto(postId);

        return PostActivitiesResponse.builder()
                .postId(postId)
                .platform(platform)
                .status(result.status())
                .message(result.message())
                .activities(updatedDtoList)
                .totalActivities(updatedDtoList.size())
                .fetchedAt(LocalDateTime.now())
                .build();
    }

    private void upsertActivity(Post post, Platform platform, SocialActivityItem item) {
        if (item.platformActivityId() != null && !item.platformActivityId().isBlank()) {
            Optional<SocialActivity> existingOpt = socialActivityRepository
                    .findByPostIdAndPlatformAndPlatformActivityId(post.getId(), platform, item.platformActivityId());

            if (existingOpt.isPresent()) {
                SocialActivity existing = existingOpt.get();
                // Update mutable fields only with latest values
                if (item.commentText() != null) {
                    existing.setCommentText(item.commentText());
                }
                if (item.actorName() != null) {
                    existing.setActorName(item.actorName());
                }
                if (item.actorProfileImageUrl() != null) {
                    existing.setActorProfileImageUrl(item.actorProfileImageUrl());
                }
                existing.setFetchedAt(LocalDateTime.now());
                socialActivityRepository.save(existing);
                return;
            }
        }

        // Insert new activity record
        SocialActivity newActivity = SocialActivity.builder()
                .post(post)
                .platform(platform)
                .activityType(item.activityType() != null ? item.activityType() : "COMMENT")
                .platformActivityId(item.platformActivityId())
                .actorPlatformId(item.actorPlatformId())
                .actorName(item.actorName())
                .actorProfileImageUrl(item.actorProfileImageUrl())
                .commentText(item.commentText())
                .createdAt(item.createdAt() != null ? item.createdAt() : LocalDateTime.now())
                .fetchedAt(LocalDateTime.now())
                .build();

        socialActivityRepository.save(newActivity);
    }

    private List<SocialActivityDto> getStoredActivitiesDto(Long postId) {
        return socialActivityRepository.findByPostIdOrderByCreatedAtDesc(postId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private SocialActivityDto mapToDto(SocialActivity a) {
        return SocialActivityDto.builder()
                .id(a.getId())
                .postId(a.getPost() != null ? a.getPost().getId() : null)
                .platform(a.getPlatform())
                .activityType(a.getActivityType())
                .platformActivityId(a.getPlatformActivityId())
                .actorPlatformId(a.getActorPlatformId())
                .actorName(a.getActorName())
                .actorProfileImageUrl(a.getActorProfileImageUrl())
                .commentText(a.getCommentText())
                .createdAt(a.getCreatedAt())
                .fetchedAt(a.getFetchedAt())
                .build();
    }

    private void verifyPostOwnership(Post post, String currentUserEmail, boolean isAdmin) {
        if (!isAdmin && (post.getRestaurant() == null
                || post.getRestaurant().getOwner() == null
                || !post.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail))) {
            throw new UnauthorizedException("Not authorized to access activities for this post.");
        }
    }
}
