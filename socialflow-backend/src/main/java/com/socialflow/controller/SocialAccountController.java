package com.socialflow.controller;

import com.socialflow.dto.FacebookPageCandidateDto;
import com.socialflow.dto.SelectFacebookPageRequest;
import com.socialflow.dto.SocialAccountCallbackResult;
import com.socialflow.dto.SocialAccountResponse;
import com.socialflow.service.SocialAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/social-accounts")
@RequiredArgsConstructor
@Slf4j
public class SocialAccountController {

    private final SocialAccountService socialAccountService;

    /**
     * GET /api/social-accounts
     * Returns all connected social accounts for the authenticated user's restaurants.
     * Tokens are NEVER included in the response.
     */
    @GetMapping
    public ResponseEntity<List<SocialAccountResponse>> getAccounts(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
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
        String email = authentication != null ? authentication.getName() : "";
        Map<String, String> result = socialAccountService.initiateConnect(platform, restaurantId, email);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/social-accounts/{platform}/callback?code=...&state=...
     * OAuth callback handler. Exchanges authorization code for tokens and saves them.
     * If Facebook user manages multiple Pages, redirects to page selection flow.
     */
    @GetMapping("/{platform}/callback")
    public ResponseEntity<?> handleCallback(
            @PathVariable String platform,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            @RequestParam(required = false, name = "error_description") String errorDescription,
            @RequestHeader(value = HttpHeaders.ACCEPT, required = false) String acceptHeader) {

        // Handle user cancellation / OAuth provider error
        if (error != null) {
            log.warn("[Social] OAuth authorization returned error for {}: {} - {}", platform, error, errorDescription);
            if (acceptHeader != null && acceptHeader.contains(MediaType_APPLICATION_JSON)) {
                return ResponseEntity.badRequest().body(Map.of("error", error, "errorDescription", errorDescription != null ? errorDescription : ""));
            }
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create("http://localhost:5173/dashboard/settings?error=" + error))
                    .build();
        }

        SocialAccountCallbackResult result = socialAccountService.handleCallbackWithResult(platform, code, state);

        if (result.isRequiresPageSelection()) {
            if (acceptHeader != null && acceptHeader.contains(MediaType_APPLICATION_JSON)) {
                return ResponseEntity.ok(result);
            }
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create("http://localhost:5173/dashboard/settings?select_page=" + platform + "&selection_token=" + result.getSelectionToken()))
                    .build();
        }

        // If caller requested JSON (e.g. automated tests or API client)
        if (acceptHeader != null && acceptHeader.contains(MediaType_APPLICATION_JSON)) {
            return ResponseEntity.ok(result.getAccount());
        }

        // Standard browser flow: redirect back to SocialFlow settings
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create("http://localhost:5173/dashboard/settings?connected=" + platform))
                .build();
    }

    /**
     * GET /api/social-accounts/FACEBOOK/pages?selectionToken=...
     * Returns candidate Facebook Pages for selection (no access tokens).
     */
    @GetMapping("/FACEBOOK/pages")
    public ResponseEntity<List<FacebookPageCandidateDto>> getFacebookPages(@RequestParam String selectionToken) {
        return ResponseEntity.ok(socialAccountService.getFacebookCandidatePages(selectionToken));
    }

    /**
     * POST /api/social-accounts/FACEBOOK/select-page
     * Connects the selected Facebook Page for the authenticated user's restaurant.
     */
    @PostMapping("/FACEBOOK/select-page")
    public ResponseEntity<SocialAccountResponse> selectFacebookPage(
            @Valid @RequestBody SelectFacebookPageRequest request,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(socialAccountService.selectFacebookPage(request, email));
    }

    private static final String MediaType_APPLICATION_JSON = "application/json";

    /**
     * DELETE /api/social-accounts/{id}
     * Disconnects a social account. Only the account owner may do this.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> disconnect(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        socialAccountService.disconnect(id, email);
        return ResponseEntity.noContent().build();
    }
}
