package com.socialflow.dto;

import com.socialflow.entity.Platform;
import com.socialflow.entity.PostStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostResponse {
    private Long id;
    private String title;
    private String caption;
    private String imageUrl;
    private String hashtags;
    private Platform platform;
    private Long restaurantId;
    private String restaurantName;
    private Long branchId;
    private String branchName;
    private PostStatus status;
    private LocalDateTime scheduledAt;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** Platform post ID returned after successful publishing (e.g., Instagram post ID) */
    private String platformPostId;
    /** Error message when status is FAILED */
    private String failureReason;
}
