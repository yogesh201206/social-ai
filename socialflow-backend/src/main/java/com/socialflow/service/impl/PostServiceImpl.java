package com.socialflow.service.impl;

import com.socialflow.dto.PostRequest;
import com.socialflow.dto.PostResponse;
import com.socialflow.entity.Branch;
import com.socialflow.entity.Post;
import com.socialflow.entity.PostStatus;
import com.socialflow.entity.Restaurant;
import com.socialflow.exception.ResourceNotFoundException;
import com.socialflow.exception.UnauthorizedException;
import com.socialflow.repository.BranchRepository;
import com.socialflow.repository.PostRepository;
import com.socialflow.repository.RestaurantRepository;
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
        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + request.getRestaurantId()));

        if (!isAdmin && !restaurant.getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        Branch branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + request.getBranchId()));
        }

        Post post = Post.builder()
                .title(request.getTitle())
                .caption(request.getCaption())
                .imageUrl(request.getImageUrl())
                .hashtags(request.getHashtags())
                .platform(request.getPlatform())
                .restaurant(restaurant)
                .branch(branch)
                .status(request.getStatus() != null ? request.getStatus() : PostStatus.DRAFT)
                .scheduledAt(request.getScheduledAt())
                .build();

        return mapToPostResponse(postRepository.save(post));
    }

    @Override
    @Transactional
    public PostResponse updatePost(Long id, PostRequest request, String currentUserEmail, boolean isAdmin) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));

        if (!isAdmin && !post.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        if (request.getTitle() != null) post.setTitle(request.getTitle());
        if (request.getCaption() != null) post.setCaption(request.getCaption());
        if (request.getImageUrl() != null) post.setImageUrl(request.getImageUrl());
        if (request.getHashtags() != null) post.setHashtags(request.getHashtags());
        if (request.getPlatform() != null) post.setPlatform(request.getPlatform());
        if (request.getStatus() != null) post.setStatus(request.getStatus());
        if (request.getScheduledAt() != null) post.setScheduledAt(request.getScheduledAt());

        return mapToPostResponse(postRepository.save(post));
    }

    @Override
    @Transactional
    public void deletePost(Long id, String currentUserEmail, boolean isAdmin) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));

        if (!isAdmin && !post.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

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

        post.setStatus(PostStatus.SCHEDULED);
        if (scheduledAt != null) {
            post.setScheduledAt(LocalDateTime.parse(scheduledAt));
        }
        return mapToPostResponse(postRepository.save(post));
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
        return mapToPostResponse(postRepository.save(post));
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
