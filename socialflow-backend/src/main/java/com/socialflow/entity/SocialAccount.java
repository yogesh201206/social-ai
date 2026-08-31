package com.socialflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "social_accounts",
       uniqueConstraints = @UniqueConstraint(columnNames = {"restaurant_id", "platform"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Platform platform;

    /**
     * The platform's unique identifier for this account
     * (e.g., Instagram user ID, Facebook page ID, X user ID).
     */
    @Column(name = "platform_account_id", length = 200)
    private String platformAccountId;

    /**
     * Human-readable account name (e.g., "@myrestaurant", "My Restaurant Page").
     */
    @Column(name = "account_name", length = 200)
    private String accountName;

    /**
     * SECURITY: Access token stored backend-only.
     * NEVER send this field to the frontend.
     * NEVER log this field.
     */
    @Column(name = "access_token", length = 2000)
    private String accessToken;

    /**
     * SECURITY: Refresh token stored backend-only.
     * NEVER send this field to the frontend.
     * NEVER log this field.
     */
    @Column(name = "refresh_token", length = 2000)
    private String refreshToken;

    @Column(name = "token_expires_at")
    private LocalDateTime tokenExpiresAt;

    @Column(name = "is_connected", nullable = false)
    private Boolean isConnected = false;

    /**
     * OAuth state parameter for CSRF protection during OAuth flow.
     * Cleared after OAuth callback completes.
     */
    @Column(name = "oauth_state", length = 200)
    private String oauthState;

    /**
     * Optional: platformPostId of the most recently published post (for reference).
     */
    @Column(name = "last_platform_post_id", length = 200)
    private String lastPlatformPostId;

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

    /**
     * Checks if the access token is valid (not expired).
     */
    public boolean isTokenValid() {
        if (accessToken == null || accessToken.isBlank()) return false;
        if (tokenExpiresAt == null) return true; // some tokens don't expire
        return tokenExpiresAt.isAfter(LocalDateTime.now());
    }
}
