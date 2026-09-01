package com.socialflow.service.impl;

import com.socialflow.dto.PostRequest;
import com.socialflow.dto.PostResponse;
import com.socialflow.entity.*;
import com.socialflow.exception.BadRequestException;
import com.socialflow.exception.ResourceNotFoundException;
import com.socialflow.exception.UnauthorizedException;
import com.socialflow.repository.BranchRepository;
import com.socialflow.repository.PostRepository;
import com.socialflow.repository.RestaurantRepository;
import com.socialflow.repository.ScheduledPostRepository;
import com.socialflow.repository.SocialAccountRepository;
import com.socialflow.service.MediaStorageService;
import com.socialflow.service.PostService;
import com.socialflow.service.publisher.PublishResult;
import com.socialflow.service.publisher.SocialMediaPublisher;
import com.socialflow.service.publisher.SocialMediaPublisherFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final RestaurantRepository restaurantRepository;
    private final BranchRepository branchRepository;
    private final ScheduledPostRepository scheduledPostRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final SocialMediaPublisherFactory publisherFactory;
    private final MediaStorageService mediaStorageService;

    private LocalDateTime convertToUtc(LocalDateTime localDateTime, String timezone) {
        if (localDateTime == null) return null;
        String tz = (timezone != null && !timezone.isBlank()) ? timezone : "Asia/Kolkata";
        ZoneId zoneId;
        try {
            zoneId = ZoneId.of(tz);
        } catch (Exception e) {
            zoneId = ZoneId.of("Asia/Kolkata");
        }
        ZonedDateTime userZoned = localDateTime.atZone(zoneId);
        return userZoned.withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
    }

    @Override
    public List<PostResponse> getAllPosts(String currentUserEmail, boolean isAdmin) {
        List<Post> list;
        if (isAdmin) {
            list = postRepository.findAll();
        } else {
            list = postRepository.findByRestaurantOwnerEmail(currentUserEmail);
        }
        return list.stream().map(this::mapToPostResponse).collect(Collectors.toList());
    }

    @Override
    public PostResponse getPostById(Long id, String currentUserEmail, boolean isAdmin) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));

        if (!isAdmin && !post.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        return mapToPostResponse(post);
    }

    @Override
    @Transactional
    public PostResponse createPost(PostRequest request, String currentUserEmail, boolean isAdmin) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new BadRequestException("Title is required");
        }
        if (request.getPlatform() == null) {
            throw new BadRequestException("Platform is required");
        }
        if (request.getRestaurantId() == null) {
            throw new BadRequestException("Restaurant ID is required");
        }

        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + request.getRestaurantId()));

        if (!isAdmin && !restaurant.getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        Branch branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + request.getBranchId()));
            if (!branch.getRestaurant().getId().equals(restaurant.getId())) {
                throw new BadRequestException("Branch does not belong to the selected restaurant");
            }
        }

        PostStatus status = request.getStatus() != null ? request.getStatus() : PostStatus.DRAFT;
        LocalDateTime scheduledAt = request.getScheduledAt();
        String tzStr = (request.getTimezone() != null && !request.getTimezone().isBlank())
                ? request.getTimezone()
                : "Asia/Kolkata";
        LocalDateTime utcScheduledAt = null;

        if (status == PostStatus.SCHEDULED && scheduledAt != null) {
            utcScheduledAt = convertToUtc(scheduledAt, tzStr);
            if (utcScheduledAt.isBefore(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1))) {
                throw new BadRequestException("Scheduled date/time must be in the future");
            }
        } else if (scheduledAt != null) {
            utcScheduledAt = convertToUtc(scheduledAt, tzStr);
        }

        String storedMediaPath = request.getMediaPath();
        if (status == PostStatus.SCHEDULED && storedMediaPath != null) {
            storedMediaPath = mediaStorageService.promoteToScheduled(storedMediaPath);
        }

        Post post = Post.builder()
                .title(request.getTitle())
                .caption(request.getCaption())
                .imageUrl(request.getImageUrl())
                .mediaPath(storedMediaPath)
                .mediaType(request.getMediaType())
                .originalFileName(request.getOriginalFileName())
                .hashtags(request.getHashtags())
                .platform(request.getPlatform())
                .restaurant(restaurant)
                .branch(branch)
                .status(status)
                .scheduledAt(utcScheduledAt)
                .timezone(tzStr)
                .build();

        Post savedPost = postRepository.save(post);

        // Sync with scheduled_posts if scheduled
        if (status == PostStatus.SCHEDULED && utcScheduledAt != null) {
            ScheduledPost scheduledPost = ScheduledPost.builder()
                    .post(savedPost)
                    .restaurant(restaurant)
                    .branch(branch)
                    .platform(savedPost.getPlatform())
                    .scheduledDateTime(utcScheduledAt)
                    .timezone(tzStr)
                    .status(ScheduleStatus.SCHEDULED)
                    .build();
            scheduledPostRepository.save(scheduledPost);
        }

        return mapToPostResponse(savedPost);
    }

    @Override
    @Transactional
    public PostResponse updatePost(Long id, PostRequest request, String currentUserEmail, boolean isAdmin) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));

        if (!isAdmin && !post.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        if (request.getTitle() != null) {
            if (request.getTitle().trim().isEmpty()) {
                throw new BadRequestException("Title cannot be empty");
            }
            post.setTitle(request.getTitle());
        }
        if (request.getCaption() != null) post.setCaption(request.getCaption());
        if (request.getImageUrl() != null) post.setImageUrl(request.getImageUrl());
        if (request.getMediaPath() != null) {
            String path = request.getMediaPath();
            if ((request.getStatus() == PostStatus.SCHEDULED || post.getStatus() == PostStatus.SCHEDULED)) {
                path = mediaStorageService.promoteToScheduled(path);
            }
            post.setMediaPath(path);
        }
        if (request.getMediaType() != null) post.setMediaType(request.getMediaType());
        if (request.getOriginalFileName() != null) post.setOriginalFileName(request.getOriginalFileName());
        if (request.getHashtags() != null) post.setHashtags(request.getHashtags());
        if (request.getPlatform() != null) post.setPlatform(request.getPlatform());

        if (request.getRestaurantId() != null) {
            Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + request.getRestaurantId()));
            if (!isAdmin && !restaurant.getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
                throw new UnauthorizedException("Not authorized");
            }
            post.setRestaurant(restaurant);
        }

        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + request.getBranchId()));
            if (!branch.getRestaurant().getId().equals(post.getRestaurant().getId())) {
                throw new BadRequestException("Branch does not belong to the selected restaurant");
            }
            post.setBranch(branch);
        }

        if (request.getStatus() != null) post.setStatus(request.getStatus());

        String tzStr = (request.getTimezone() != null && !request.getTimezone().isBlank())
                ? request.getTimezone()
                : (post.getTimezone() != null ? post.getTimezone() : "Asia/Kolkata");

        if (request.getTimezone() != null) {
            post.setTimezone(tzStr);
        }

        if (request.getScheduledAt() != null) {
            LocalDateTime utcScheduledAt = convertToUtc(request.getScheduledAt(), tzStr);
            if ((post.getStatus() == PostStatus.SCHEDULED || request.getStatus() == PostStatus.SCHEDULED)
                    && utcScheduledAt.isBefore(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1))) {
                throw new BadRequestException("Scheduled date/time must be in the future");
            }
            post.setScheduledAt(utcScheduledAt);
        }

        Post savedPost = postRepository.save(post);

        // Sync with scheduled_posts
        List<ScheduledPost> existingSchedules = scheduledPostRepository.findByPostId(id);
        if (savedPost.getStatus() == PostStatus.SCHEDULED && savedPost.getScheduledAt() != null) {
            if (!existingSchedules.isEmpty()) {
                ScheduledPost sp = existingSchedules.get(0);
                sp.setPlatform(savedPost.getPlatform());
                sp.setRestaurant(savedPost.getRestaurant());
                sp.setBranch(savedPost.getBranch());
                sp.setScheduledDateTime(savedPost.getScheduledAt());
                sp.setTimezone(savedPost.getTimezone() != null ? savedPost.getTimezone() : tzStr);
                sp.setStatus(ScheduleStatus.SCHEDULED);
                scheduledPostRepository.save(sp);
            } else {
                ScheduledPost sp = ScheduledPost.builder()
                        .post(savedPost)
                        .restaurant(savedPost.getRestaurant())
                        .branch(savedPost.getBranch())
                        .platform(savedPost.getPlatform())
                        .scheduledDateTime(savedPost.getScheduledAt())
                        .timezone(savedPost.getTimezone() != null ? savedPost.getTimezone() : tzStr)
                        .status(ScheduleStatus.SCHEDULED)
                        .build();
                scheduledPostRepository.save(sp);
            }
        } else if (savedPost.getStatus() == PostStatus.PUBLISHED) {
            for (ScheduledPost sp : existingSchedules) {
                sp.setStatus(ScheduleStatus.PUBLISHED);
                scheduledPostRepository.save(sp);
            }
        } else if (savedPost.getStatus() == PostStatus.CANCELLED) {
            for (ScheduledPost sp : existingSchedules) {
                sp.setStatus(ScheduleStatus.CANCELLED);
                scheduledPostRepository.save(sp);
            }
        } else if (savedPost.getStatus() == PostStatus.DRAFT) {
            scheduledPostRepository.deleteByPostId(id);
        }

        return mapToPostResponse(savedPost);
    }

    @Override
    @Transactional
    public void deletePost(Long id, String currentUserEmail, boolean isAdmin) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));

        if (!isAdmin && !post.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        // If post was published to a platform and has a platformPostId, sync deletion with external platform
        if (post.getStatus() == PostStatus.PUBLISHED && post.getPlatformPostId() != null && !post.getPlatformPostId().isBlank()) {
            Platform platform = post.getPlatform();
            if (platform != null) {
                var accountOpt = socialAccountRepository.findByRestaurantIdAndPlatform(post.getRestaurant().getId(), platform);
                if (accountOpt.isPresent() && Boolean.TRUE.equals(accountOpt.get().getIsConnected())) {
                    SocialAccount account = accountOpt.get();
                    SocialMediaPublisher publisher = publisherFactory.getPublisher(platform);
                    var deleteResult = publisher.delete(post, account);
                    if (!deleteResult.success()) {
                        log.warn("[Delete] External deletion failed on {} for post id={}: {}", platform, id, deleteResult.errorMessage());
                        throw new BadRequestException("Could not delete the post from " + platform.name() + ": " +
                                deleteResult.errorMessage() + ". The SocialFlow record was kept so you can retry.");
                    }
                }
            }
        }

        // Delete any temporary / scheduled local media file
        if (post.getMediaPath() != null && !post.getMediaPath().isBlank()) {
            mediaStorageService.deleteMediaFile(post.getMediaPath());
        }

        // Delete any related scheduled posts first to avoid foreign key constraints / orphan rows
        scheduledPostRepository.deleteByPostId(id);
        postRepository.delete(post);
    }

    @Override
    public List<PostResponse> getPostsByStatus(PostStatus status, String currentUserEmail, boolean isAdmin) {
        List<Post> list;
        if (isAdmin) {
            list = postRepository.findByStatus(status);
        } else {
            list = postRepository.findByRestaurantOwnerEmailAndStatus(currentUserEmail, status);
        }
        return list.stream().map(this::mapToPostResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PostResponse schedulePost(Long id, String scheduledAt, String timezone, String currentUserEmail, boolean isAdmin) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));

        if (!isAdmin && !post.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        if (post.getPlatform() == Platform.YOUTUBE) {
            if ((post.getImageUrl() == null || post.getImageUrl().isBlank()) &&
                (post.getMediaPath() == null || post.getMediaPath().isBlank())) {
                throw new BadRequestException("YouTube publishing requires a video.");
            }
        }

        String tzStr = (timezone != null && !timezone.isBlank())
                ? timezone
                : (post.getTimezone() != null ? post.getTimezone() : "Asia/Kolkata");

        LocalDateTime utcScheduledAt = null;
        if (scheduledAt != null) {
            LocalDateTime parsed = LocalDateTime.parse(scheduledAt);
            utcScheduledAt = convertToUtc(parsed, tzStr);
            if (utcScheduledAt.isBefore(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1))) {
                throw new BadRequestException("Scheduled date/time must be in the future");
            }
            post.setScheduledAt(utcScheduledAt);
            post.setTimezone(tzStr);
        } else if (post.getScheduledAt() != null) {
            utcScheduledAt = post.getScheduledAt();
            if (utcScheduledAt.isBefore(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1))) {
                throw new BadRequestException("Scheduled date/time must be in the future");
            }
        } else {
            throw new BadRequestException("Scheduled date/time is required");
        }

        // Promote media file to scheduled storage
        if (post.getMediaPath() != null && !post.getMediaPath().isBlank()) {
            String promoted = mediaStorageService.promoteToScheduled(post.getMediaPath());
            post.setMediaPath(promoted);
        }

        post.setStatus(PostStatus.SCHEDULED);
        Post saved = postRepository.save(post);

        List<ScheduledPost> existingSchedules = scheduledPostRepository.findByPostId(id);
        if (!existingSchedules.isEmpty()) {
            ScheduledPost sp = existingSchedules.get(0);
            sp.setScheduledDateTime(utcScheduledAt);
            sp.setTimezone(tzStr);
            sp.setPlatform(saved.getPlatform());
            sp.setRestaurant(saved.getRestaurant());
            sp.setBranch(saved.getBranch());
            sp.setStatus(ScheduleStatus.SCHEDULED);
            scheduledPostRepository.save(sp);
        } else {
            ScheduledPost sp = ScheduledPost.builder()
                    .post(saved)
                    .restaurant(saved.getRestaurant())
                    .branch(saved.getBranch())
                    .platform(saved.getPlatform())
                    .scheduledDateTime(utcScheduledAt)
                    .timezone(tzStr)
                    .status(ScheduleStatus.SCHEDULED)
                    .build();
            scheduledPostRepository.save(sp);
        }

        return mapToPostResponse(saved);
    }

    @Override
    @Transactional
    public PostResponse cancelPost(Long id, String currentUserEmail, boolean isAdmin) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));

        if (!isAdmin && !post.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        // Delete stored scheduled video file on cancellation
        if (post.getMediaPath() != null && !post.getMediaPath().isBlank()) {
            mediaStorageService.deleteMediaFile(post.getMediaPath());
            post.setMediaPath(null);
        }

        post.setStatus(PostStatus.CANCELLED);
        Post saved = postRepository.save(post);

        List<ScheduledPost> existingSchedules = scheduledPostRepository.findByPostId(id);
        for (ScheduledPost sp : existingSchedules) {
            sp.setStatus(ScheduleStatus.CANCELLED);
            scheduledPostRepository.save(sp);
        }

        return mapToPostResponse(saved);
    }

    @Override
    @Transactional
    public PostResponse publishPost(Long id, String currentUserEmail, boolean isAdmin) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));

        if (!isAdmin && !post.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized to publish this post");
        }

        if (post.getStatus() == PostStatus.PUBLISHED) {
            throw new BadRequestException("Post is already published");
        }
        if (post.getStatus() == PostStatus.PROCESSING) {
            throw new BadRequestException("Post is already being processed");
        }

        Platform platform = post.getPlatform();
        if (platform == null) {
            throw new BadRequestException("Post has no platform set. Cannot publish.");
        }

        // YouTube special validation
        if (platform == Platform.YOUTUBE) {
            if ((post.getImageUrl() == null || post.getImageUrl().isBlank()) &&
                (post.getMediaPath() == null || post.getMediaPath().isBlank())) {
                throw new BadRequestException("YouTube publishing requires a video.");
            }
        }

        SocialAccount account = socialAccountRepository
                .findByRestaurantIdAndPlatform(post.getRestaurant().getId(), platform)
                .orElseThrow(() -> new BadRequestException(
                        "No connected " + platform.name() + " account found for this restaurant. " +
                        "Please connect your " + platform.name() + " account before publishing."));

        if (!Boolean.TRUE.equals(account.getIsConnected())) {
            throw new BadRequestException(
                    platform.name() + " account is not connected. Please reconnect before publishing.");
        }

        if (!account.isTokenValid()) {
            throw new BadRequestException(
                    platform.name() + " access token has expired. Please reconnect your account.");
        }

        // Mark as PROCESSING to prevent double-publish
        post.setStatus(PostStatus.PROCESSING);
        postRepository.save(post);

        // Call the appropriate platform publisher
        SocialMediaPublisher publisher = publisherFactory.getPublisher(platform);
        PublishResult result = publisher.publish(post, account);

        if (result.success()) {
            post.setStatus(PostStatus.PUBLISHED);
            post.setPublishedAt(LocalDateTime.now(ZoneOffset.UTC));
            post.setPlatformPostId(result.platformPostId());
            post.setFailureReason(null);

            // Clean up temporary/scheduled local video file after successful publish
            if (post.getMediaPath() != null && !post.getMediaPath().isBlank()) {
                mediaStorageService.deleteMediaFile(post.getMediaPath());
                post.setMediaPath(null);
            }

            log.info("[Publish] Post id={} published to {} — platformPostId={}",
                    id, platform, result.platformPostId());
        } else {
            post.setStatus(PostStatus.FAILED);
            post.setFailureReason(result.errorMessage());
            log.warn("[Publish] Post id={} FAILED on {}: {}", id, platform, result.errorMessage());
        }

        Post saved = postRepository.save(post);

        // Sync scheduled posts status
        List<ScheduledPost> scheduledPosts = scheduledPostRepository.findByPostId(id);
        for (ScheduledPost sp : scheduledPosts) {
            sp.setStatus(result.success() ? ScheduleStatus.PUBLISHED : ScheduleStatus.FAILED);
            scheduledPostRepository.save(sp);
        }

        if (!result.success()) {
            throw new BadRequestException("Publishing failed: " + result.errorMessage());
        }

        return mapToPostResponse(saved);
    }

    @Override
    @Transactional
    public PostResponse refreshMetrics(Long id, String currentUserEmail, boolean isAdmin) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));

        if (!isAdmin && !post.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        if (post.getStatus() != PostStatus.PUBLISHED || post.getPlatformPostId() == null || post.getPlatformPostId().isBlank()) {
            post.setMetricsStatus("NOT_FETCHED");
            return mapToPostResponse(postRepository.save(post));
        }

        Platform platform = post.getPlatform();
        if (platform == null) {
            post.setMetricsStatus("NOT_SUPPORTED");
            return mapToPostResponse(postRepository.save(post));
        }

        var accountOpt = socialAccountRepository.findByRestaurantIdAndPlatform(post.getRestaurant().getId(), platform);
        if (accountOpt.isEmpty() || !Boolean.TRUE.equals(accountOpt.get().getIsConnected())) {
            post.setMetricsStatus("PERMISSION_REQUIRED");
            return mapToPostResponse(postRepository.save(post));
        }

        SocialAccount account = accountOpt.get();
        SocialMediaPublisher publisher = publisherFactory.getPublisher(platform);
        var metricsResult = publisher.fetchMetrics(post, account);

        if (metricsResult.success()) {
            post.setLikes(metricsResult.likes());
            post.setComments(metricsResult.comments());
            post.setShares(metricsResult.shares());
            post.setViews(metricsResult.views());
            post.setMetricsStatus(metricsResult.metricsStatus());
            post.setMetricsUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        } else {
            post.setMetricsStatus(metricsResult.metricsStatus() != null ? metricsResult.metricsStatus() : "API_ERROR");
        }

        return mapToPostResponse(postRepository.save(post));
    }

    private PostResponse mapToPostResponse(Post p) {
        return PostResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .caption(p.getCaption())
                .imageUrl(p.getImageUrl())
                .mediaPath(p.getMediaPath())
                .mediaType(p.getMediaType())
                .originalFileName(p.getOriginalFileName())
                .hashtags(p.getHashtags())
                .platform(p.getPlatform())
                .restaurantId(p.getRestaurant().getId())
                .restaurantName(p.getRestaurant().getName())
                .branchId(p.getBranch() != null ? p.getBranch().getId() : null)
                .branchName(p.getBranch() != null ? p.getBranch().getBranchName() : null)
                .status(p.getStatus())
                .scheduledAt(p.getScheduledAt())
                .timezone(p.getTimezone())
                .publishedAt(p.getPublishedAt())
                .platformPostId(p.getPlatformPostId())
                .failureReason(p.getFailureReason())
                .likes(p.getLikes())
                .comments(p.getComments())
                .shares(p.getShares())
                .views(p.getViews())
                .metricsStatus(p.getMetricsStatus())
                .metricsUpdatedAt(p.getMetricsUpdatedAt())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}

