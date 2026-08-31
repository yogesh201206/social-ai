package com.socialflow.dto;

import com.socialflow.entity.Platform;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Social account DTO for frontend display.
 * SECURITY: accessToken, refreshToken, oauthState are NEVER included here.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialAccountResponse {

    private Long id;

    private Platform platform;

    private String accountName;

    private String platformAccountId;

    private Boolean isConnected;

    private Long restaurantId;

    private String restaurantName;

    /**
     * Token expiry date for display only — no token value is returned.
     */
    private LocalDateTime tokenExpiresAt;

    private boolean tokenExpired;

    private LocalDateTime connectedAt;
}
