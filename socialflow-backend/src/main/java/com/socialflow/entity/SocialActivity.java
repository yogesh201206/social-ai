package com.socialflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "social_activities", indexes = {
    @Index(name = "idx_activity_post_id", columnList = "post_id"),
    @Index(name = "idx_activity_platform_act_id", columnList = "post_id, platform, platform_activity_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Platform platform;

    /**
     * Activity type: COMMENT, REPLY, REACTION, LIKE
     */
    @Column(name = "activity_type", nullable = false, length = 50)
    private String activityType;

    /**
     * Platform's unique identifier for this activity/comment (used for deduplication)
     */
    @Column(name = "platform_activity_id", length = 200)
    private String platformActivityId;

    /**
     * Platform identifier of the actor (if exposed by platform API)
     */
    @Column(name = "actor_platform_id", length = 200)
    private String actorPlatformId;

    /**
     * Display name of commenter/actor (if exposed by platform API)
     */
    @Column(name = "actor_name", length = 200)
    private String actorName;

    /**
     * Avatar/profile picture URL of the actor (if exposed by platform API)
     */
    @Column(columnDefinition = "TEXT")
    private String actorProfileImageUrl;

    /**
     * Text of the comment or reply
     */
    @Column(name = "comment_text", length = 2000)
    private String commentText;

    /**
     * Real timestamp from the platform when the activity occurred
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * Local timestamp when this activity was fetched and stored
     */
    @Column(name = "fetched_at", nullable = false)
    private LocalDateTime fetchedAt;

    @PrePersist
    protected void onCreate() {
        if (fetchedAt == null) {
            fetchedAt = LocalDateTime.now();
        }
    }
}
