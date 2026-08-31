package com.socialflow.service;

import com.socialflow.dto.PostRequest;
import com.socialflow.dto.PostResponse;
import com.socialflow.entity.PostStatus;

import java.util.List;

public interface PostService {
    List<PostResponse> getAllPosts(String currentUserEmail, boolean isAdmin);
    PostResponse getPostById(Long id, String currentUserEmail, boolean isAdmin);
    PostResponse createPost(PostRequest request, String currentUserEmail, boolean isAdmin);
    PostResponse updatePost(Long id, PostRequest request, String currentUserEmail, boolean isAdmin);
    void deletePost(Long id, String currentUserEmail, boolean isAdmin);

    List<PostResponse> getPostsByStatus(PostStatus status, String currentUserEmail, boolean isAdmin);
    PostResponse schedulePost(Long id, String scheduledAt, String currentUserEmail, boolean isAdmin);
    PostResponse cancelPost(Long id, String currentUserEmail, boolean isAdmin);
    PostResponse publishPost(Long id, String currentUserEmail, boolean isAdmin);
}
