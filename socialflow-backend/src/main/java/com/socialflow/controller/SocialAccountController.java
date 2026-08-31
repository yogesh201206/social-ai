package com.socialflow.controller;

import com.socialflow.dto.SocialAccountResponse;
import com.socialflow.service.SocialAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/social-accounts")
@RequiredArgsConstructor
public class SocialAccountController {

    private final SocialAccountService socialAccountService;

    /**
     * GET /api/social-accounts
     * Returns all connected social accounts for the authenticated user's restaurants.
     * Tokens are NEVER included in the response.
     */
    @GetMapping
    public ResponseEntity<List<SocialAccountResponse>> getAccounts(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(socialAccountService.getAccountsForUser(email));
    }

    /**
     * GET /api/social-accounts/{platform}/connect?restaurantId=2
     * Returns the OAuth redirect URL for the specified platform.
     * If platform credentials are not configured, returns a clear CONFIGURATION REQUIRED error.
     */
    @GetMapping("/{platform}/connect")
    public ResponseEntity<Map<String, String>> initiateConnect(
            @PathVariable String platform,
            @RequestParam Long restaurantId,
            Authentication authentication) {
        String email = authentication.getName();
        Map<String, String> result = socialAccountService.initiateConnect(platform, restaurantId, email);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/social-accounts/{platform}/callback?code=...&state=...
     * OAuth callback handler. Exchanges authorization code for tokens and saves them.
     * Called by the OAuth provider — never directly by the frontend.
     */
    @GetMapping("/{platform}/callback")
    public ResponseEntity<SocialAccountResponse> handleCallback(
            @PathVariable String platform,
            @RequestParam String code,
            @RequestParam String state) {
        SocialAccountResponse response = socialAccountService.handleCallback(platform, code, state);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/social-accounts/{id}
     * Disconnects a social account. Only the account owner may do this.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> disconnect(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        socialAccountService.disconnect(id, email);
        return ResponseEntity.noContent().build();
    }
}
