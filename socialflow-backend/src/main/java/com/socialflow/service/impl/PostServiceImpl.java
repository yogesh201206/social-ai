package com.socialflow.service.impl;

import com.socialflow.dto.PostMetricsDto;
import com.socialflow.dto.PostRequest;
import com.socialflow.dto.PostResponse;
import com.socialflow.entity.*;
import com.socialflow.exception.BadRequestException;
import com.socialflow.exception.ResourceNotFoundException;
import com.socialflow.exception.UnauthorizedException;
import com.socialflow.repository.AnalyticsRepository;
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

import java.time.LocalDate;
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
    private final AnalyticsRepository analyticsRepository;
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
            if (result.platformPostUrl() != null && !result.platformPostUrl().isBlank()) {
                post.setPlatformPostUrl(result.platformPostUrl());
            }
            post.setFailureReason(null);

            // Move media file to permanent published storage so imageUrl keeps resolving.
            // The file is NOT deleted — it is relocated from temp/scheduled → uploads/published/.
            if (post.getMediaPath() != null && !post.getMediaPath().isBlank()) {
                String publishedPath = mediaStorageService.promoteToPublished(post.getMediaPath());
                post.setMediaPath(publishedPath);
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
    public List<com.socialflow.dto.PlatformPublishResultDto> createMultiPlatformPosts(
            com.socialflow.dto.MultiPostRequest request, String currentUserEmail, boolean isAdmin) {

        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new BadRequestException("Title is required");
        }
        if (request.getPlatforms() == null || request.getPlatforms().isEmpty()) {
            throw new BadRequestException("At least one platform must be selected");
        }
        if (request.getRestaurantId() == null) {
            throw new BadRequestException("Restaurant ID is required");
        }

        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + request.getRestaurantId()));

        if (!isAdmin && !restaurant.getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized to create posts for this restaurant");
        }

        Branch branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + request.getBranchId()));
            if (!branch.getRestaurant().getId().equals(restaurant.getId())) {
                throw new BadRequestException("Branch does not belong to the selected restaurant");
            }
        }

        PostStatus targetStatus = request.getStatus() != null ? request.getStatus() : PostStatus.DRAFT;
        boolean isPublishNow = Boolean.TRUE.equals(request.getPublishNow()) || targetStatus == PostStatus.PUBLISHED;
        if (isPublishNow) {
            targetStatus = PostStatus.DRAFT;
        }

        String tzStr = (request.getTimezone() != null && !request.getTimezone().isBlank())
                ? request.getTimezone()
                : "Asia/Kolkata";
        LocalDateTime utcScheduledAt = null;

        if (targetStatus == PostStatus.SCHEDULED && request.getScheduledAt() != null) {
            utcScheduledAt = convertToUtc(request.getScheduledAt(), tzStr);
            if (utcScheduledAt.isBefore(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1))) {
                throw new BadRequestException("Scheduled date/time must be in the future");
            }
        } else if (request.getScheduledAt() != null) {
            utcScheduledAt = convertToUtc(request.getScheduledAt(), tzStr);
        }

        String storedMediaPath = request.getMediaPath();
        if (targetStatus == PostStatus.SCHEDULED && storedMediaPath != null && !storedMediaPath.isBlank()) {
            storedMediaPath = mediaStorageService.promoteToScheduled(storedMediaPath);
        }

        // Filter and deduplicate platforms (only active supported: FACEBOOK, INSTAGRAM, LINKEDIN, YOUTUBE)
        List<Platform> activePlatforms = request.getPlatforms().stream()
                .filter(java.util.Objects::nonNull)
                .filter(p -> p == Platform.FACEBOOK || p == Platform.INSTAGRAM || p == Platform.LINKEDIN || p == Platform.YOUTUBE)
                .distinct()
                .collect(Collectors.toList());

        if (activePlatforms.isEmpty()) {
            throw new BadRequestException("No valid supported platforms selected (supported: Facebook, Instagram, LinkedIn, YouTube)");
        }

        List<com.socialflow.dto.PlatformPublishResultDto> results = new java.util.ArrayList<>();

        for (Platform platform : activePlatforms) {
            Post post = Post.builder()
                    .title(request.getTitle())
                    .caption(request.getCaption())
                    .imageUrl(request.getImageUrl())
                    .mediaPath(storedMediaPath)
                    .mediaType(request.getMediaType())
                    .originalFileName(request.getOriginalFileName())
                    .hashtags(request.getHashtags())
                    .platform(platform)
                    .restaurant(restaurant)
                    .branch(branch)
                    .status(targetStatus)
                    .scheduledAt(utcScheduledAt)
                    .timezone(tzStr)
                    .build();

            Post savedPost = postRepository.save(post);

            if (targetStatus == PostStatus.SCHEDULED && !isPublishNow) {
                if (utcScheduledAt != null) {
                    ScheduledPost scheduledPost = ScheduledPost.builder()
                            .post(savedPost)
                            .restaurant(restaurant)
                            .branch(branch)
                            .platform(platform)
                            .scheduledDateTime(utcScheduledAt)
                            .timezone(tzStr)
                            .status(ScheduleStatus.SCHEDULED)
                            .build();
                    scheduledPostRepository.save(scheduledPost);
                }
                results.add(com.socialflow.dto.PlatformPublishResultDto.builder()
                        .platform(platform)
                        .status(PostStatus.SCHEDULED)
                        .postId(savedPost.getId())
                        .message("Scheduled successfully for " + platform.name())
                        .build());
            } else if (!isPublishNow) {
                results.add(com.socialflow.dto.PlatformPublishResultDto.builder()
                        .platform(platform)
                        .status(PostStatus.DRAFT)
                        .postId(savedPost.getId())
                        .message("Draft saved for " + platform.name())
                        .build());
            } else {
                // Publish immediately per platform
                // 1. Validate platform media compatibility
                boolean hasMedia = (savedPost.getImageUrl() != null && !savedPost.getImageUrl().isBlank())
                        || (savedPost.getMediaPath() != null && !savedPost.getMediaPath().isBlank());
                boolean isVideo = (savedPost.getMediaType() != null && savedPost.getMediaType().toLowerCase().startsWith("video"))
                        || (savedPost.getOriginalFileName() != null && (savedPost.getOriginalFileName().toLowerCase().endsWith(".mp4")
                        || savedPost.getOriginalFileName().toLowerCase().endsWith(".mov")
                        || savedPost.getOriginalFileName().toLowerCase().endsWith(".webm")))
                        || (savedPost.getMediaPath() != null && (savedPost.getMediaPath().toLowerCase().endsWith(".mp4")
                        || savedPost.getMediaPath().toLowerCase().endsWith(".mov")
                        || savedPost.getMediaPath().toLowerCase().endsWith(".webm")));

                if (platform == Platform.YOUTUBE && !isVideo) {
                    savedPost.setStatus(PostStatus.FAILED);
                    String errorMsg = "YouTube publishing requires a video file.";
                    savedPost.setFailureReason(errorMsg);
                    postRepository.save(savedPost);
                    results.add(com.socialflow.dto.PlatformPublishResultDto.builder()
                            .platform(platform)
                            .status(PostStatus.FAILED)
                            .postId(savedPost.getId())
                            .error(errorMsg)
                            .build());
                    continue;
                }

                if (platform == Platform.INSTAGRAM && !hasMedia) {
                    savedPost.setStatus(PostStatus.FAILED);
                    String errorMsg = "Instagram publishing requires an image or video.";
                    savedPost.setFailureReason(errorMsg);
                    postRepository.save(savedPost);
                    results.add(com.socialflow.dto.PlatformPublishResultDto.builder()
                            .platform(platform)
                            .status(PostStatus.FAILED)
                            .postId(savedPost.getId())
                            .error(errorMsg)
                            .build());
                    continue;
                }

                // 2. Validate connected social account
                java.util.Optional<SocialAccount> accountOpt = socialAccountRepository
                        .findByRestaurantIdAndPlatform(restaurant.getId(), platform);

                if (accountOpt.isEmpty() || !Boolean.TRUE.equals(accountOpt.get().getIsConnected())) {
                    savedPost.setStatus(PostStatus.FAILED);
                    String errorMsg = "No connected " + platform.name() + " account found for this restaurant.";
                    savedPost.setFailureReason(errorMsg);
                    postRepository.save(savedPost);
                    results.add(com.socialflow.dto.PlatformPublishResultDto.builder()
                            .platform(platform)
                            .status(PostStatus.FAILED)
                            .postId(savedPost.getId())
                            .error(errorMsg)
                            .build());
                    continue;
                }

                SocialAccount account = accountOpt.get();
                if (!account.isTokenValid()) {
                    savedPost.setStatus(PostStatus.FAILED);
                    String errorMsg = platform.name() + " account token has expired. Please reconnect.";
                    savedPost.setFailureReason(errorMsg);
                    postRepository.save(savedPost);
                    results.add(com.socialflow.dto.PlatformPublishResultDto.builder()
                            .platform(platform)
                            .status(PostStatus.FAILED)
                            .postId(savedPost.getId())
                            .error(errorMsg)
                            .build());
                    continue;
                }

                // 3. Mark as PROCESSING and publish
                savedPost.setStatus(PostStatus.PROCESSING);
                postRepository.save(savedPost);

                try {
                    SocialMediaPublisher publisher = publisherFactory.getPublisher(platform);
                    com.socialflow.service.publisher.PublishResult pubResult = publisher.publish(savedPost, account);

                    if (pubResult.success()) {
                        savedPost.setStatus(PostStatus.PUBLISHED);
                        savedPost.setPublishedAt(LocalDateTime.now(ZoneOffset.UTC));
                        savedPost.setPlatformPostId(pubResult.platformPostId());
                        if (pubResult.platformPostUrl() != null && !pubResult.platformPostUrl().isBlank()) {
                            savedPost.setPlatformPostUrl(pubResult.platformPostUrl());
                        }
                        savedPost.setFailureReason(null);

                        if (savedPost.getMediaPath() != null && !savedPost.getMediaPath().isBlank()) {
                            String publishedPath = mediaStorageService.promoteToPublished(savedPost.getMediaPath());
                            savedPost.setMediaPath(publishedPath);
                        }
                        postRepository.save(savedPost);

                        results.add(com.socialflow.dto.PlatformPublishResultDto.builder()
                                .platform(platform)
                                .status(PostStatus.PUBLISHED)
                                .postId(savedPost.getId())
                                .platformPostId(pubResult.platformPostId())
                                .externalUrl(pubResult.platformPostUrl())
                                .message("Published successfully to " + platform.name())
                                .build());

                        log.info("[MultiPublish] Post id={} published to {} — platformPostId={}",
                                savedPost.getId(), platform, pubResult.platformPostId());
                    } else {
                        savedPost.setStatus(PostStatus.FAILED);
                        savedPost.setFailureReason(pubResult.errorMessage());
                        postRepository.save(savedPost);

                        results.add(com.socialflow.dto.PlatformPublishResultDto.builder()
                                .platform(platform)
                                .status(PostStatus.FAILED)
                                .postId(savedPost.getId())
                                .error(pubResult.errorMessage())
                                .build());

                        log.warn("[MultiPublish] Post id={} FAILED on {}: {}",
                                savedPost.getId(), platform, pubResult.errorMessage());
                    }
                } catch (Exception ex) {
                    log.error("[MultiPublish] Exception publishing post id={} to {}: {}",
                            savedPost.getId(), platform, ex.getMessage());
                    savedPost.setStatus(PostStatus.FAILED);
                    savedPost.setFailureReason("Publishing exception: " + ex.getMessage());
                    postRepository.save(savedPost);

                    results.add(com.socialflow.dto.PlatformPublishResultDto.builder()
                            .platform(platform)
                            .status(PostStatus.FAILED)
                            .postId(savedPost.getId())
                            .error("Publishing exception: " + ex.getMessage())
                            .build());
                }
            }
        }

        return results;
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

            // Sync with Analytics table for the restaurant and platform
            updateAnalyticsTable(post);
        } else {
            post.setMetricsStatus(metricsResult.metricsStatus() != null ? metricsResult.metricsStatus() : "API_ERROR");
        }

        return mapToPostResponse(postRepository.save(post));
    }

    @Override
    @Transactional(readOnly = true)
    public PostMetricsDto getMetricsDto(Long id, String currentUserEmail, boolean isAdmin) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));

        if (!isAdmin && !post.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        String extUrl = buildExternalUrl(post.getPlatform(), post.getPlatformPostId());
        Double engRate = null;
        if (post.getViews() != null && post.getViews() > 0) {
            long eng = (post.getLikes() != null ? post.getLikes() : 0)
                    + (post.getComments() != null ? post.getComments() : 0)
                    + (post.getShares() != null ? post.getShares() : 0);
            engRate = Math.round(((double) eng / post.getViews() * 100.0) * 10.0) / 10.0;
        }

        return PostMetricsDto.builder()
                .postId(post.getId())
                .platform(post.getPlatform())
                .platformPostId(post.getPlatformPostId())
                .likes(post.getLikes())
                .comments(post.getComments())
                .shares(post.getShares())
                .views(post.getViews())
                .impressions(post.getViews())
                .reach(post.getViews())
                .engagement(engRate)
                .metricsStatus(post.getMetricsStatus())
                .errorMessage(post.getFailureReason())
                .lastUpdated(post.getMetricsUpdatedAt())
                .externalUrl(extUrl)
                .build();
    }

    private void updateAnalyticsTable(Post post) {
        try {
            Long restaurantId = post.getRestaurant().getId();
            Platform platform = post.getPlatform();
            LocalDate today = LocalDate.now(ZoneOffset.UTC);

            var analyticsOpt = analyticsRepository.findByRestaurantIdAndPlatformAndDate(restaurantId, platform, today);
            Analytics analytics = analyticsOpt.orElseGet(() -> Analytics.builder()
                    .restaurant(post.getRestaurant())
                    .branch(post.getBranch())
                    .platform(platform)
                    .date(today)
                    .followers(0)
                    .build());

            // Aggregate real values from published posts for this restaurant & platform
            List<Post> publishedPosts = postRepository.findByRestaurantId(restaurantId).stream()
                    .filter(p -> p.getStatus() == PostStatus.PUBLISHED && p.getPlatform() == platform)
                    .toList();

            int totalLikes = publishedPosts.stream().mapToInt(p -> p.getLikes() != null ? p.getLikes().intValue() : 0).sum();
            int totalComments = publishedPosts.stream().mapToInt(p -> p.getComments() != null ? p.getComments().intValue() : 0).sum();
            int totalShares = publishedPosts.stream().mapToInt(p -> p.getShares() != null ? p.getShares().intValue() : 0).sum();
            int totalViews = publishedPosts.stream().mapToInt(p -> p.getViews() != null ? p.getViews().intValue() : 0).sum();

            analytics.setLikes(totalLikes);
            analytics.setComments(totalComments);
            analytics.setShares(totalShares);
            analytics.setImpressions(totalViews);
            analytics.setReach(totalViews);

            int totalEng = totalLikes + totalComments + totalShares;
            double rate = totalViews > 0 ? ((double) totalEng / totalViews) * 100.0 : 0.0;
            analytics.setEngagementRate(Math.round(rate * 10.0) / 10.0);

            analyticsRepository.save(analytics);
        } catch (Exception e) {
            log.warn("[PostService] Could not update analytics table: {}", e.getMessage());
        }
    }

    private String buildExternalUrl(Platform platform, String platformPostId) {
        if (platformPostId == null || platformPostId.isBlank()) return null;
        if (platform == null) return null;
        return switch (platform) {
            case FACEBOOK -> "https://www.facebook.com/" + platformPostId;
            case YOUTUBE -> "https://www.youtube.com/watch?v=" + platformPostId;
            case LINKEDIN -> platformPostId.startsWith("urn:")
                    ? "https://www.linkedin.com/feed/update/" + platformPostId
                    : "https://www.linkedin.com/feed/update/urn:li:share:" + platformPostId;
            case TWITTER -> "https://x.com/i/status/" + platformPostId;
            case INSTAGRAM -> "https://www.instagram.com/p/" + platformPostId;
            default -> null;
        };
    }

    private PostResponse mapToPostResponse(Post p) {
        String externalUrl = p.getPlatformPostUrl() != null && !p.getPlatformPostUrl().isBlank()
                ? p.getPlatformPostUrl()
                : buildExternalUrl(p.getPlatform(), p.getPlatformPostId());
        Double engRate = null;
        if (p.getViews() != null && p.getViews() > 0) {
            long eng = (p.getLikes() != null ? p.getLikes() : 0)
                    + (p.getComments() != null ? p.getComments() : 0)
                    + (p.getShares() != null ? p.getShares() : 0);
            engRate = Math.round(((double) eng / p.getViews() * 100.0) * 10.0) / 10.0;
        }

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
                .externalUrl(externalUrl)
                .failureReason(p.getFailureReason())
                .likes(p.getLikes())
                .comments(p.getComments())
                .shares(p.getShares())
                .views(p.getViews())
                .impressions(p.getViews())
                .reach(p.getViews())
                .engagementRate(engRate)
                .metricsStatus(p.getMetricsStatus())
                .metricsUpdatedAt(p.getMetricsUpdatedAt())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}

