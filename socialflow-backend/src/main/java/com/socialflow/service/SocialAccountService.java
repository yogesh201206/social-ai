package com.socialflow.service;

import com.socialflow.dto.FacebookPageCandidateDto;
import com.socialflow.dto.SelectFacebookPageRequest;
import com.socialflow.dto.SocialAccountCallbackResult;
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
     * @param platform      the social media platform name (TWITTER, YOUTUBE, LINKEDIN, INSTAGRAM, FACEBOOK)
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
     * Handles the OAuth callback from the platform with multi-page support.
     * If multiple Facebook pages are managed, returns requiresPageSelection=true and candidate pages.
     */
    SocialAccountCallbackResult handleCallbackWithResult(String platform, String code, String state);

    /**
     * Retrieves safe candidate Facebook Pages for a pending selection token.
     */
    List<FacebookPageCandidateDto> getFacebookCandidatePages(String selectionToken);

    /**
     * Finalizes connecting the chosen Facebook Page from candidate list.
     */
    SocialAccountResponse selectFacebookPage(SelectFacebookPageRequest request, String currentUserEmail);

    /**
     * Disconnects a social account. Only the account owner may disconnect.
     *
     * @param id               the social account ID
     * @param currentUserEmail authenticated user email from JWT
     */
    void disconnect(Long id, String currentUserEmail);
}

