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
    private String mediaPath;
    private String mediaType;
    private String originalFileName;
    private String hashtags;
    private Platform platform;
    private Long restaurantId;
    private String restaurantName;
    private Long branchId;
    private String branchName;
    private PostStatus status;
    private LocalDateTime scheduledAt;
    private String timezone;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** Platform post ID returned after successful publishing (e.g., Facebook/YouTube post ID) */
    private String platformPostId;
    /** Direct URL to view post on the external social platform */
    private String externalUrl;
    /** Error message when status is FAILED */
    private String failureReason;
    /** Real performance metrics */
    private Long likes;
    private Long comments;
    private Long shares;
    private Long views;
    private Long impressions;
    private Long reach;
    private Double engagementRate;
    private String metricsStatus;
    private LocalDateTime metricsUpdatedAt;
}
