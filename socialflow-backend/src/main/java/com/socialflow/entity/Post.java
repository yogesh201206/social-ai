package com.socialflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String caption;

    private String imageUrl;

    /** Safe relative local storage path (e.g. uploads/scheduled/youtube/uuid.mp4 or uploads/temp/youtube/uuid.mp4) */
    @Column(name = "media_path", length = 500)
    private String mediaPath;

    /** MIME type of media (e.g. video/mp4, image/jpeg) */
    @Column(name = "media_type", length = 50)
    private String mediaType;

    /** Original client file name (for display / reference) */
    @Column(name = "original_file_name", length = 255)
    private String originalFileName;

    private String hashtags;

    @Enumerated(EnumType.STRING)
    private Platform platform;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostStatus status = PostStatus.DRAFT;

    private LocalDateTime scheduledAt;

    private String timezone;

    private LocalDateTime publishedAt;

    /** Platform post ID returned by the social media API after successful publishing */
    @Column(name = "platform_post_id", length = 200)
    private String platformPostId;

    /** Safe error message when status is FAILED */
    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    /** Real performance metrics fetched from social APIs */
    private Long likes;

    private Long comments;

    private Long shares;

    private Long views;

    /** Metric status: AVAILABLE, NOT_FETCHED, NOT_SUPPORTED, PERMISSION_REQUIRED, API_ERROR */
    @Column(name = "metrics_status", length = 50)
    private String metricsStatus;

    private LocalDateTime metricsUpdatedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
