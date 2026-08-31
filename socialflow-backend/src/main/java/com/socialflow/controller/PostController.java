package com.socialflow.controller;

import com.socialflow.dto.PostRequest;
import com.socialflow.dto.PostResponse;
import com.socialflow.entity.PostStatus;
import com.socialflow.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equalsIgnoreCase(a.getAuthority()) || "ADMIN".equalsIgnoreCase(a.getAuthority()));
    }

    @GetMapping
    public ResponseEntity<List<PostResponse>> getAllPosts(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(postService.getAllPosts(email, isAdmin(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPostById(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(postService.getPostById(id, email, isAdmin(authentication)));
    }

    @PostMapping
    public ResponseEntity<PostResponse> createPost(@Valid @RequestBody PostRequest request, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return new ResponseEntity<>(postService.createPost(request, email, isAdmin(authentication)), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> updatePost(@PathVariable Long id, @RequestBody PostRequest request, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(postService.updatePost(id, request, email, isAdmin(authentication)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        postService.deletePost(id, email, isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/drafts")
    public ResponseEntity<List<PostResponse>> getDrafts(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(postService.getPostsByStatus(PostStatus.DRAFT, email, isAdmin(authentication)));
    }

    @GetMapping("/scheduled")
    public ResponseEntity<List<PostResponse>> getScheduled(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(postService.getPostsByStatus(PostStatus.SCHEDULED, email, isAdmin(authentication)));
    }

    @GetMapping("/published")
    public ResponseEntity<List<PostResponse>> getPublished(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(postService.getPostsByStatus(PostStatus.PUBLISHED, email, isAdmin(authentication)));
    }

    @PostMapping("/{id}/schedule")
    public ResponseEntity<PostResponse> schedulePost(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        String scheduledAt = body != null ? body.get("scheduledAt") : null;
        return ResponseEntity.ok(postService.schedulePost(id, scheduledAt, email, isAdmin(authentication)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<PostResponse> cancelPost(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(postService.cancelPost(id, email, isAdmin(authentication)));
    }

    /**
     * POST /api/posts/{id}/publish
     * Publishes a post immediately to the connected social media platform.
     * Requires a connected social account for the post's platform and restaurant.
     */
    @PostMapping("/{id}/publish")
    public ResponseEntity<PostResponse> publishPost(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(postService.publishPost(id, email, isAdmin(authentication)));
    }
}
