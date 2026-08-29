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
import com.socialflow.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final RestaurantRepository restaurantRepository;
    private final BranchRepository branchRepository;
    private final ScheduledPostRepository scheduledPostRepository;

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

        if (status == PostStatus.SCHEDULED && scheduledAt != null) {
            if (scheduledAt.isBefore(LocalDateTime.now().minusMinutes(1))) {
                throw new BadRequestException("Scheduled date/time must be in the future");
            }
        }

        Post post = Post.builder()
                .title(request.getTitle())
                .caption(request.getCaption())
                .imageUrl(request.getImageUrl())
                .hashtags(request.getHashtags())
                .platform(request.getPlatform())
                .restaurant(restaurant)
                .branch(branch)
                .status(status)
                .scheduledAt(scheduledAt)
                .build();

        Post savedPost = postRepository.save(post);

        // Sync with scheduled_posts if scheduled
        if (status == PostStatus.SCHEDULED && scheduledAt != null) {
            ScheduledPost scheduledPost = ScheduledPost.builder()
                    .post(savedPost)
                    .restaurant(restaurant)
                    .branch(branch)
                    .platform(savedPost.getPlatform())
                    .scheduledDateTime(scheduledAt)
                    .timezone("UTC")
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

        if (request.getScheduledAt() != null) {
            if ((post.getStatus() == PostStatus.SCHEDULED || request.getStatus() == PostStatus.SCHEDULED)
                    && request.getScheduledAt().isBefore(LocalDateTime.now().minusMinutes(1))) {
                throw new BadRequestException("Scheduled date/time must be in the future");
            }
            post.setScheduledAt(request.getScheduledAt());
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
                sp.setStatus(ScheduleStatus.SCHEDULED);
                scheduledPostRepository.save(sp);
            } else {
                ScheduledPost sp = ScheduledPost.builder()
                        .post(savedPost)
                        .restaurant(savedPost.getRestaurant())
                        .branch(savedPost.getBranch())
                        .platform(savedPost.getPlatform())
                        .scheduledDateTime(savedPost.getScheduledAt())
                        .timezone("UTC")
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
    public PostResponse schedulePost(Long id, String scheduledAt, String currentUserEmail, boolean isAdmin) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));

        if (!isAdmin && !post.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        LocalDateTime parsed = null;
        if (scheduledAt != null) {
            parsed = LocalDateTime.parse(scheduledAt);
            if (parsed.isBefore(LocalDateTime.now().minusMinutes(1))) {
                throw new BadRequestException("Scheduled date/time must be in the future");
            }
            post.setScheduledAt(parsed);
        } else if (post.getScheduledAt() != null) {
            parsed = post.getScheduledAt();
            if (parsed.isBefore(LocalDateTime.now().minusMinutes(1))) {
                throw new BadRequestException("Scheduled date/time must be in the future");
            }
        } else {
            throw new BadRequestException("Scheduled date/time is required");
        }

        post.setStatus(PostStatus.SCHEDULED);
        Post saved = postRepository.save(post);

        List<ScheduledPost> existingSchedules = scheduledPostRepository.findByPostId(id);
        if (!existingSchedules.isEmpty()) {
            ScheduledPost sp = existingSchedules.get(0);
            sp.setScheduledDateTime(parsed);
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
                    .scheduledDateTime(parsed)
                    .timezone("UTC")
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

        post.setStatus(PostStatus.CANCELLED);
        Post saved = postRepository.save(post);

        List<ScheduledPost> existingSchedules = scheduledPostRepository.findByPostId(id);
        for (ScheduledPost sp : existingSchedules) {
            sp.setStatus(ScheduleStatus.CANCELLED);
            scheduledPostRepository.save(sp);
        }

        return mapToPostResponse(saved);
    }

    private PostResponse mapToPostResponse(Post p) {
        return PostResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .caption(p.getCaption())
                .imageUrl(p.getImageUrl())
                .hashtags(p.getHashtags())
                .platform(p.getPlatform())
                .restaurantId(p.getRestaurant().getId())
                .restaurantName(p.getRestaurant().getName())
                .branchId(p.getBranch() != null ? p.getBranch().getId() : null)
                .branchName(p.getBranch() != null ? p.getBranch().getBranchName() : null)
                .status(p.getStatus())
                .scheduledAt(p.getScheduledAt())
                .publishedAt(p.getPublishedAt())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
