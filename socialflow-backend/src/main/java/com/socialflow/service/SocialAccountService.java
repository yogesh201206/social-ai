package com.socialflow.service;

import com.socialflow.dto.SocialAccountResponse;

import java.util.List;
import java.util.Map;

public interface SocialAccountService {

    /**
     * Returns all connected social accounts for the authenticated user.
     */
    List<SocialAccountResponse> getAccountsForUser(String currentUserEmail);

    /**
     * Returns the OAuth redirect URL for the given platform and restaurant.
     * If platform credentials are not configured, throws BadRequestException with CONFIGURATION REQUIRED.
     *
     * @param platform      the social media platform name (INSTAGRAM, FACEBOOK, TWITTER, TIKTOK, YOUTUBE)
     * @param restaurantId  the restaurant to associate the account with
     * @param currentUserEmail authenticated user email from JWT
     * @return map with "redirectUrl" key
     */
    Map<String, String> initiateConnect(String platform, Long restaurantId, String currentUserEmail);

    /**
     * Handles the OAuth callback from the platform.
     * Exchanges authorization code for tokens and saves to social_accounts table.
     *
     * @param platform   the platform name
     * @param code       the authorization code from OAuth callback
     * @param state      the state parameter for CSRF validation
     * @return updated SocialAccountResponse (without tokens)
     */
    SocialAccountResponse handleCallback(String platform, String code, String state);

    /**
     * Disconnects a social account. Only the account owner may disconnect.
     *
     * @param id               the social account ID
     * @param currentUserEmail authenticated user email from JWT
     */
    void disconnect(Long id, String currentUserEmail);
}
