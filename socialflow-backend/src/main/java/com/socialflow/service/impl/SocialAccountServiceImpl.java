package com.socialflow.service.impl;

import com.socialflow.config.SocialPlatformConfig;
import com.socialflow.dto.FacebookPageCandidateDto;
import com.socialflow.dto.SelectFacebookPageRequest;
import com.socialflow.dto.SocialAccountCallbackResult;
import com.socialflow.dto.SocialAccountResponse;
import com.socialflow.entity.*;
import com.socialflow.exception.BadRequestException;
import com.socialflow.exception.ResourceNotFoundException;
import com.socialflow.exception.UnauthorizedException;
import com.socialflow.repository.RestaurantRepository;
import com.socialflow.repository.SocialAccountRepository;
import com.socialflow.repository.UserRepository;
import com.socialflow.service.SocialAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class SocialAccountServiceImpl implements SocialAccountService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final SocialAccountRepository socialAccountRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final SocialPlatformConfig.MetaConfig metaConfig;
    private final SocialPlatformConfig.XConfig xConfig;
    private final SocialPlatformConfig.GoogleConfig googleConfig;
    private final SocialPlatformConfig.LinkedInConfig linkedInConfig;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    // Temporary storage for multi-page Facebook OAuth candidate selection (10 min TTL)
    private record PendingCandidate(String id, String name, String category, String accessToken) {}
    private record PendingSelection(Long restaurantId, String userEmail, LocalDateTime expiresAt, List<PendingCandidate> candidates) {}
    private final Map<String, PendingSelection> pendingFacebookSelections = new ConcurrentHashMap<>();

    @Override
    public List<SocialAccountResponse> getAccountsForUser(String currentUserEmail) {
        return socialAccountRepository.findByRestaurantOwnerEmail(currentUserEmail)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public Map<String, String> initiateConnect(String platformStr, Long restaurantId, String currentUserEmail) {
        Platform platform = parsePlatform(platformStr);

        // Block Instagram — Coming Soon (Next in line)
        if (platform == Platform.INSTAGRAM) {
            throw new BadRequestException(
                    "Instagram integration is coming soon. " +
                    "Social account connection has not been enabled yet. " +
                    "Please check back after Meta Business verification is complete.");
        }

        // Validate restaurant ownership
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));

        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserEmail));

        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isAdmin && !restaurant.getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("You are not authorized to manage social accounts for this restaurant");
        }

        // Generate CSRF state token
        String state = UUID.randomUUID().toString();

        // Upsert social account record (or create pending entry to store state)
        SocialAccount account = socialAccountRepository
                .findByRestaurantIdAndPlatform(restaurantId, platform)
                .orElse(SocialAccount.builder()
                        .user(user)
                        .restaurant(restaurant)
                        .platform(platform)
                        .isConnected(false)
                        .build());
        account.setOauthState(state);

        // For X (Twitter), generate a cryptographically secure PKCE code_verifier
        String codeVerifier = null;
        if (platform == Platform.TWITTER) {
            codeVerifier = generatePkceVerifier();
            account.setPkceCodeVerifier(codeVerifier);
        } else {
            account.setPkceCodeVerifier(null);
        }

        socialAccountRepository.save(account);

        // Build OAuth redirect URL per platform
        String redirectUrl = buildOAuthUrl(platform, state, restaurantId, codeVerifier);
        return Map.of("redirectUrl", redirectUrl);
    }

    @Override
    @Transactional
    public SocialAccountResponse handleCallback(String platformStr, String code, String state) {
        SocialAccountCallbackResult result = handleCallbackWithResult(platformStr, code, state);
        if (result.isRequiresPageSelection()) {
            throw new BadRequestException("Multiple Facebook Pages found. Please select a page using the selection token: " + result.getSelectionToken());
        }
        return result.getAccount();
    }

    @Override
    @Transactional
    public SocialAccountCallbackResult handleCallbackWithResult(String platformStr, String code, String state) {
        if (isBlank(state)) {
            throw new BadRequestException("Missing OAuth state parameter in callback");
        }
        if (isBlank(code)) {
            throw new BadRequestException("Missing OAuth authorization code in callback");
        }

        // 1. Validate state (CSRF protection)
        SocialAccount account = socialAccountRepository.findByOauthState(state)
                .or(() -> {
                    if (state.contains(":")) {
                        String prefix = state.substring(0, state.indexOf(":"));
                        return socialAccountRepository.findByOauthState(prefix);
                    }
                    return Optional.empty();
                })
                .orElseThrow(() -> new BadRequestException("Invalid or expired OAuth state parameter"));

        Platform platform = parsePlatform(platformStr);
        if (account.getPlatform() != platform) {
            throw new BadRequestException("Platform mismatch in OAuth callback: expected " + account.getPlatform() + " but got " + platform);
        }

        // Special handling for Facebook (supports single-page auto-connect and multi-page selection)
        if (platform == Platform.FACEBOOK) {
            return processFacebookCallback(account, code);
        }

        // 2. Standard token exchange for other platforms
        String pkceVerifier = account.getPkceCodeVerifier();
        TokenResult tokens = exchangeCodeForTokens(platform, code, account.getRestaurant().getId(), pkceVerifier);

        // 3. Update account with tokens
        account.setAccessToken(tokens.accessToken());
        account.setRefreshToken(tokens.refreshToken());
        account.setTokenExpiresAt(tokens.expiresAt());
        account.setAccountName(tokens.accountName());
        account.setPlatformAccountId(tokens.platformAccountId());
        account.setIsConnected(true);
        account.setOauthState(null); // Clear state after use
        account.setPkceCodeVerifier(null); // Clear PKCE verifier after use

        SocialAccount saved = socialAccountRepository.save(account);
        log.info("[Social] Connected {} account for restaurant={}", platform, account.getRestaurant().getId());

        return SocialAccountCallbackResult.connected(mapToResponse(saved));
    }

    /**
     * Processes Meta OAuth callback for Facebook Pages.
     * Exchanges code for User Access Token, retrieves managed Pages, and either:
     * - Auto-connects if exactly 1 Page
     * - Stores pending candidates if multiple Pages
     */
    @SuppressWarnings("unchecked")
    private SocialAccountCallbackResult processFacebookCallback(SocialAccount account, String code) {
        if (isBlank(metaConfig.getAppId()) || isBlank(metaConfig.getAppSecret())) {
            throw new BadRequestException("CONFIGURATION REQUIRED: Meta credentials not configured.");
        }

        String redirectUri = metaConfig.getRedirectUri();
        validateMetaRedirectUri(redirectUri);

        log.info("[Social] Facebook OAuth redirect URI={}, isAbsolute={}", redirectUri, URI.create(redirectUri.trim()).isAbsolute());

        try {
            // Step 1: Exchange code for Meta User Access Token (retrieve as String and parse JSON to handle text/javascript Content-Type)
            String responseBody = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("graph.facebook.com")
                            .path("/v19.0/oauth/access_token")
                            .queryParam("client_id", metaConfig.getAppId())
                            .queryParam("client_secret", metaConfig.getAppSecret())
                            .queryParam("redirect_uri", redirectUri)
                            .queryParam("code", code)
                            .build())
                    .retrieve()
                    .body(String.class);

            Map<String, Object> tokenResponse = parseMetaTokenResponse(responseBody);

            if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
                throw new BadRequestException("Failed to obtain Meta access token.");
            }

            String userAccessToken = (String) tokenResponse.get("access_token");
            Integer expiresIn = tokenResponse.get("expires_in") instanceof Number n ? n.intValue() : null;
            LocalDateTime expiresAt = expiresIn != null ? LocalDateTime.now().plusSeconds(expiresIn) : null;

            // Step 2: Fetch Facebook Pages managed by user via /me/accounts
            ResponseEntity<String> accountsResponseEntity = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("graph.facebook.com")
                            .path("/v19.0/me/accounts")
                            .queryParam("fields", "id,name,access_token,category")
                            .queryParam("access_token", userAccessToken)
                            .build())
                    .retrieve()
                    .toEntity(String.class);

            int httpStatus = accountsResponseEntity.getStatusCode().value();
            String accountsJson = accountsResponseEntity.getBody();

            Map<String, Object> accountsResponse = objectMapper.readValue(
                    accountsJson,
                    new TypeReference<Map<String, Object>>() {}
            );

            List<Map<String, Object>> data = accountsResponse != null ? (List<Map<String, Object>>) accountsResponse.get("data") : null;
            int pageCount = data != null ? data.size() : 0;
            log.info("[Social] Facebook /me/accounts response status: {}, total pages returned: {}", httpStatus, pageCount);

            if (data != null) {
                for (Map<String, Object> page : data) {
                    log.info("[Social] Discovered Facebook Page - id: {}, name: {}, category: {}",
                            page.get("id"), page.get("name"), page.get("category"));
                }
            }

            if (data == null || data.isEmpty()) {
                throw new BadRequestException("No Facebook Pages found for this account. Ensure the logged-in Meta user has Facebook access/full control to at least one Page and that pages_show_list permission was granted.");
            }

            List<PendingCandidate> candidates = new ArrayList<>();
            for (Map<String, Object> page : data) {
                String pageId = (String) page.get("id");
                String pageName = (String) page.get("name");
                String pageAccessToken = (String) page.get("access_token");
                String category = (String) page.get("category");
                if (pageId != null && pageAccessToken != null) {
                    candidates.add(new PendingCandidate(pageId, pageName != null ? pageName : "Facebook Page", category != null ? category : "Page", pageAccessToken));
                }
            }

            if (candidates.isEmpty()) {
                throw new BadRequestException("No accessible Facebook Pages found with valid Page tokens.");
            }

            // Case A: Exactly ONE Page -> Auto-connect
            if (candidates.size() == 1) {
                PendingCandidate single = candidates.get(0);
                account.setPlatformAccountId(single.id());
                account.setAccountName(single.name());
                account.setAccessToken(single.accessToken());
                account.setRefreshToken(null);
                account.setTokenExpiresAt(expiresAt);
                account.setIsConnected(true);
                account.setOauthState(null);
                account.setPkceCodeVerifier(null);

                SocialAccount saved = socialAccountRepository.save(account);
                log.info("[Social] Auto-connected Facebook Page '{}' (id={}) for restaurant={}",
                        single.name(), single.id(), account.getRestaurant().getId());
                return SocialAccountCallbackResult.connected(mapToResponse(saved));
            }

            // Case B: MULTIPLE Pages -> Generate selectionToken & store candidates
            String selectionToken = UUID.randomUUID().toString();
            pendingFacebookSelections.put(selectionToken, new PendingSelection(
                    account.getRestaurant().getId(),
                    account.getUser().getEmail(),
                    LocalDateTime.now().plusMinutes(10),
                    candidates
            ));

            // Clean up oauth state on pending account
            account.setOauthState(null);
            socialAccountRepository.save(account);

            log.info("[Social] Meta OAuth returned {} Facebook Pages for restaurant={}. Awaiting user selection (token={})",
                    candidates.size(), account.getRestaurant().getId(), selectionToken);

            List<FacebookPageCandidateDto> candidateDtos = candidates.stream()
                    .map(c -> new FacebookPageCandidateDto(c.id(), c.name(), c.category()))
                    .toList();

            return SocialAccountCallbackResult.selectPage(selectionToken, candidateDtos);

        } catch (HttpClientErrorException e) {
            String body = e.getResponseBodyAsString();
            log.warn("[Social] Meta token exchange error (HTTP {}): {}", e.getStatusCode().value(), body);
            throw new BadRequestException("Meta OAuth error: " + body);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("[Social] Unexpected error during Facebook OAuth callback: {}", e.getMessage());
            throw new BadRequestException("Failed to exchange Meta authorization code: " + e.getMessage());
        }
    }

    @Override
    public List<FacebookPageCandidateDto> getFacebookCandidatePages(String selectionToken) {
        if (isBlank(selectionToken)) {
            throw new BadRequestException("Selection token is required.");
        }
        PendingSelection pending = pendingFacebookSelections.get(selectionToken);
        if (pending == null || pending.expiresAt().isBefore(LocalDateTime.now())) {
            pendingFacebookSelections.remove(selectionToken);
            throw new BadRequestException("Invalid or expired Facebook Page selection session. Please initiate connection again.");
        }
        return pending.candidates().stream()
                .map(c -> new FacebookPageCandidateDto(c.id(), c.name(), c.category()))
                .toList();
    }

    @Override
    @Transactional
    public SocialAccountResponse selectFacebookPage(SelectFacebookPageRequest request, String currentUserEmail) {
        if (request == null || isBlank(request.getSelectionToken()) || isBlank(request.getPageId())) {
            throw new BadRequestException("Selection token and Page ID are required.");
        }

        PendingSelection pending = pendingFacebookSelections.get(request.getSelectionToken());
        if (pending == null || pending.expiresAt().isBefore(LocalDateTime.now())) {
            pendingFacebookSelections.remove(request.getSelectionToken());
            throw new BadRequestException("Invalid or expired Facebook Page selection session. Please initiate connection again.");
        }

        // Verify current user ownership
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserEmail));
        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isAdmin && !pending.userEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("You are not authorized to complete this page selection.");
        }

        PendingCandidate selected = pending.candidates().stream()
                .filter(c -> c.id().equals(request.getPageId()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Selected Page ID was not found among authorized pages."));

        Restaurant restaurant = restaurantRepository.findById(pending.restaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));

        SocialAccount account = socialAccountRepository
                .findByRestaurantIdAndPlatform(pending.restaurantId(), Platform.FACEBOOK)
                .orElse(SocialAccount.builder()
                        .user(user)
                        .restaurant(restaurant)
                        .platform(Platform.FACEBOOK)
                        .build());

        account.setPlatformAccountId(selected.id());
        account.setAccountName(selected.name());
        account.setAccessToken(selected.accessToken());
        account.setRefreshToken(null);
        account.setIsConnected(true);
        account.setOauthState(null);
        account.setPkceCodeVerifier(null);

        SocialAccount saved = socialAccountRepository.save(account);
        pendingFacebookSelections.remove(request.getSelectionToken());

        log.info("[Social] Selected Facebook Page '{}' (id={}) for restaurant={}",
                selected.name(), selected.id(), pending.restaurantId());

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void disconnect(Long id, String currentUserEmail) {
        SocialAccount account = socialAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Social account not found with id: " + id));

        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserEmail));

        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isAdmin && !account.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("You are not authorized to disconnect this social account");
        }

        // Clear tokens securely before deletion
        account.setAccessToken(null);
        account.setRefreshToken(null);
        account.setPkceCodeVerifier(null);
        account.setIsConnected(false);
        socialAccountRepository.save(account);
        socialAccountRepository.delete(account);
        log.info("[Social] Disconnected {} account id={}", account.getPlatform(), id);
    }

    // ─── OAuth URL Builders ─────────────────────────────────────────────────────

    private String buildOAuthUrl(Platform platform, String state, Long restaurantId, String codeVerifier) {
        return switch (platform) {
            case INSTAGRAM, FACEBOOK -> buildMetaOAuthUrl(platform, state, restaurantId);
            case TWITTER  -> buildXOAuthUrl(state, codeVerifier);
            case YOUTUBE  -> buildGoogleOAuthUrl(state, restaurantId);
            case LINKEDIN -> buildLinkedInOAuthUrl(state, restaurantId);
        };
    }

    private String buildMetaOAuthUrl(Platform platform, String state, Long restaurantId) {
        if (isBlank(metaConfig.getAppId()) || isBlank(metaConfig.getAppSecret())) {
            throw new BadRequestException(
                    "CONFIGURATION REQUIRED: Meta (Facebook/Instagram) app credentials are not configured. " +
                    "Please set META_APP_ID and META_APP_SECRET environment variables. " +
                    "Register your app at https://developers.facebook.com/");
        }
        String scopes = platform == Platform.INSTAGRAM
                ? "instagram_basic,instagram_content_publish,pages_read_engagement"
                : "pages_show_list,pages_manage_posts,pages_read_engagement,read_insights,public_profile";

        String redirectUri = metaConfig.getRedirectUri();
        validateMetaRedirectUri(redirectUri);

        return "https://www.facebook.com/v19.0/dialog/oauth" +
               "?client_id=" + metaConfig.getAppId() +
               "&redirect_uri=" + encode(redirectUri) +
               "&scope=" + encode(scopes) +
               "&state=" + encode(state + ":" + restaurantId) +
               "&response_type=code";
    }

    /**
     * Builds X (Twitter) OAuth 2.0 PKCE Authorization URL with S256 challenge.
     */
    private String buildXOAuthUrl(String state, String codeVerifier) {
        if (isBlank(xConfig.getClientId())) {
            throw new BadRequestException(
                    "CONFIGURATION REQUIRED: X (Twitter) client credentials are not configured. " +
                    "Please set X_CLIENT_ID and X_CLIENT_SECRET environment variables. " +
                    "Register your app at https://developer.x.com/");
        }

        String verifier = codeVerifier != null ? codeVerifier : generatePkceVerifier();
        String codeChallenge = generatePkceChallenge(verifier);
        String endpoint = "https://x.com/i/oauth2/authorize";
        String scopes = "tweet.read tweet.write users.read offline.access";
        String encodedScopes = encode(scopes).replace("+", "%20");
        String encodedRedirectUri = encode(xConfig.getRedirectUri());
        String encodedClientId = encode(xConfig.getClientId());
        String encodedState = encode(state);

        return endpoint +
               "?response_type=code" +
               "&client_id=" + encodedClientId +
               "&redirect_uri=" + encodedRedirectUri +
               "&scope=" + encodedScopes +
               "&state=" + encodedState +
               "&code_challenge=" + codeChallenge +
               "&code_challenge_method=S256";
    }

    private String buildGoogleOAuthUrl(String state, Long restaurantId) {
        if (isBlank(googleConfig.getClientId()) || isBlank(googleConfig.getClientSecret())) {
            throw new BadRequestException(
                    "CONFIGURATION REQUIRED: Google (YouTube) client credentials are not configured. " +
                    "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables. " +
                    "Register your app at https://console.cloud.google.com/");
        }

        String endpoint = "https://accounts.google.com/o/oauth2/v2/auth";
        String scopes = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube";
        String redirectUri = googleConfig.getRedirectUri();

        String encodedScopes = encode(scopes);
        String encodedRedirectUri = encode(redirectUri);
        String encodedClientId = encode(googleConfig.getClientId());
        String encodedState = encode(state + ":" + restaurantId);

        return endpoint +
               "?client_id=" + encodedClientId +
               "&redirect_uri=" + encodedRedirectUri +
               "&response_type=code" +
               "&scope=" + encodedScopes +
               "&access_type=offline" +
               "&state=" + encodedState;
    }

    /**
     * Builds LinkedIn OAuth 2.0 authorization URL.
     */
    private String buildLinkedInOAuthUrl(String state, Long restaurantId) {
        if (isBlank(linkedInConfig.getClientId()) || isBlank(linkedInConfig.getClientSecret())) {
            throw new BadRequestException(
                    "CONFIGURATION REQUIRED: LinkedIn client credentials are not configured. " +
                    "Please set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET environment variables. " +
                    "Register your app at https://www.linkedin.com/developers/apps and add " +
                    "'Share on LinkedIn' product to get w_member_social scope.");
        }

        String endpoint = "https://www.linkedin.com/oauth/v2/authorization";
        String scopes = "openid profile w_member_social";
        String redirectUri = linkedInConfig.getRedirectUri();

        String encodedScopes = encode(scopes);
        String encodedRedirectUri = encode(redirectUri);
        String encodedClientId = encode(linkedInConfig.getClientId());
        String encodedState = encode(state + ":" + restaurantId);

        return endpoint +
               "?response_type=code" +
               "&client_id=" + encodedClientId +
               "&redirect_uri=" + encodedRedirectUri +
               "&scope=" + encodedScopes +
               "&state=" + encodedState;
    }

    // ─── Token Exchange ──────────────────────────────────────────────────────────

    private TokenResult exchangeCodeForTokens(Platform platform, String code, Long restaurantId, String pkceVerifier) {
        return switch (platform) {
            case INSTAGRAM, FACEBOOK -> exchangeMetaTokens(code);
            case TWITTER  -> exchangeXTokens(code, pkceVerifier);
            case YOUTUBE  -> exchangeGoogleTokens(code);
            case LINKEDIN -> exchangeLinkedInTokens(code);
        };
    }

    @SuppressWarnings("unchecked")
    private TokenResult exchangeMetaTokens(String code) {
        if (isBlank(metaConfig.getAppId())) {
            throw new BadRequestException("CONFIGURATION REQUIRED: Meta credentials not configured.");
        }
        String redirectUri = metaConfig.getRedirectUri();
        validateMetaRedirectUri(redirectUri);

        log.info("[Social] Facebook OAuth redirect URI={}, isAbsolute={}", redirectUri, URI.create(redirectUri.trim()).isAbsolute());

        try {
            String responseBody = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("graph.facebook.com")
                            .path("/v19.0/oauth/access_token")
                            .queryParam("client_id", metaConfig.getAppId())
                            .queryParam("client_secret", metaConfig.getAppSecret())
                            .queryParam("redirect_uri", redirectUri)
                            .queryParam("code", code)
                            .build())
                    .retrieve()
                    .body(String.class);

            Map<String, Object> response = parseMetaTokenResponse(responseBody);

            String accessToken = (String) response.get("access_token");
            Integer expiresIn = response.get("expires_in") instanceof Number n ? n.intValue() : null;

            // Fetch Facebook Pages managed by user via /me/accounts
            String accountsJson = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("graph.facebook.com")
                            .path("/v19.0/me/accounts")
                            .queryParam("fields", "id,name,access_token,category")
                            .queryParam("access_token", accessToken)
                            .build())
                    .retrieve()
                    .body(String.class);

            Map<String, Object> accountsResponse = objectMapper.readValue(
                    accountsJson,
                    new TypeReference<Map<String, Object>>() {}
            );

            List<Map<String, Object>> data = accountsResponse != null ? (List<Map<String, Object>>) accountsResponse.get("data") : null;
            if (data != null && !data.isEmpty()) {
                Map<String, Object> firstPage = data.get(0);
                String pageId = (String) firstPage.get("id");
                String pageName = (String) firstPage.get("name");
                String pageAccessToken = (String) firstPage.get("access_token");
                return new TokenResult(
                        pageAccessToken != null ? pageAccessToken : accessToken,
                        null,
                        expiresIn != null ? LocalDateTime.now().plusSeconds(expiresIn) : null,
                        pageName != null ? pageName : "Facebook Page",
                        pageId
                );
            }

            // Fallback to /me
            String meJson = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("graph.facebook.com")
                            .path("/v19.0/me")
                            .queryParam("fields", "id,name")
                            .queryParam("access_token", accessToken)
                            .build())
                    .retrieve()
                    .body(String.class);

            Map<String, Object> meResponse = objectMapper.readValue(
                    meJson,
                    new TypeReference<Map<String, Object>>() {}
            );

            return new TokenResult(
                    accessToken, null,
                    expiresIn != null ? LocalDateTime.now().plusSeconds(expiresIn) : null,
                    meResponse != null ? (String) meResponse.get("name") : null,
                    meResponse != null ? (String) meResponse.get("id") : null
            );
        } catch (Exception e) {
            log.warn("[Social] Meta token exchange failed: {}", e.getMessage());
            throw new BadRequestException("Failed to exchange Meta authorization code: " + e.getMessage());
        }
    }

    /**
     * Exchanges X (Twitter) OAuth 2.0 authorization code for tokens using PKCE verifier.
     */
    @SuppressWarnings("unchecked")
    private TokenResult exchangeXTokens(String code, String codeVerifier) {
        if (isBlank(xConfig.getClientId())) {
            throw new BadRequestException("CONFIGURATION REQUIRED: X credentials not configured.");
        }
        if (isBlank(codeVerifier)) {
            throw new BadRequestException("PKCE verification failure: missing code verifier for X OAuth callback.");
        }
        try {
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("code", code);
            body.add("grant_type", "authorization_code");
            body.add("client_id", xConfig.getClientId());
            body.add("redirect_uri", xConfig.getRedirectUri());
            body.add("code_verifier", codeVerifier);

            var requestSpec = restClient.post()
                    .uri("https://api.x.com/2/oauth2/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body);

            if (!isBlank(xConfig.getClientSecret())) {
                String credentials = Base64.getEncoder().encodeToString(
                        (xConfig.getClientId() + ":" + xConfig.getClientSecret()).getBytes(StandardCharsets.UTF_8));
                requestSpec.header("Authorization", "Basic " + credentials);
            }

            Map<String, Object> response = requestSpec.retrieve().body(Map.class);
            if (response == null) {
                throw new BadRequestException("X token endpoint returned empty response.");
            }

            String accessToken = (String) response.get("access_token");
            String refreshToken = (String) response.get("refresh_token");
            Integer expiresIn = response.get("expires_in") instanceof Number n ? n.intValue() : null;

            if (isBlank(accessToken)) {
                throw new BadRequestException("X token response did not contain an access token.");
            }

            LocalDateTime expiresAt = expiresIn != null ? LocalDateTime.now().plusSeconds(expiresIn) : null;

            String accountName = "X Account";
            String platformAccountId = null;
            try {
                Map<String, Object> userResponse = restClient.get()
                        .uri("https://api.x.com/2/users/me")
                        .header("Authorization", "Bearer " + accessToken)
                        .retrieve()
                        .body(Map.class);

                if (userResponse != null) {
                    Map<String, Object> data = (Map<String, Object>) userResponse.get("data");
                    if (data != null) {
                        String username = (String) data.get("username");
                        if (username != null && !username.isBlank()) {
                            accountName = "@" + username;
                        }
                        platformAccountId = (String) data.get("id");
                    }
                }
            } catch (Exception ex) {
                log.warn("[Social] Could not fetch X user profile: {}", ex.getMessage());
            }

            return new TokenResult(accessToken, refreshToken, expiresAt, accountName, platformAccountId);
        } catch (HttpClientErrorException e) {
            String responseBody = e.getResponseBodyAsString();
            log.warn("[Social] X token exchange failed: HTTP {} body={}", e.getStatusCode().value(), responseBody);
            throw new BadRequestException("X OAuth error: " + responseBody);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("[Social] Unexpected error during X token exchange: {}", e.getMessage());
            throw new BadRequestException("Failed to exchange X authorization code: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private TokenResult exchangeGoogleTokens(String code) {
        if (isBlank(googleConfig.getClientId())) {
            throw new BadRequestException("CONFIGURATION REQUIRED: Google credentials not configured.");
        }
        try {
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("code", code);
            body.add("client_id", googleConfig.getClientId());
            body.add("client_secret", googleConfig.getClientSecret());
            body.add("redirect_uri", googleConfig.getRedirectUri());
            body.add("grant_type", "authorization_code");

            Map<String, Object> response = restClient.post()
                    .uri("https://oauth2.googleapis.com/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String accessToken = (String) response.get("access_token");
            String refreshToken = (String) response.get("refresh_token");
            Integer expiresIn = response.get("expires_in") instanceof Number n ? n.intValue() : null;

            String channelName = "YouTube Channel";
            String channelId = null;
            try {
                Map<String, Object> channelResponse = restClient.get()
                        .uri("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true")
                        .header("Authorization", "Bearer " + accessToken)
                        .retrieve()
                        .body(Map.class);

                List<Map<String, Object>> items = (List<Map<String, Object>>) channelResponse.get("items");
                if (items != null && !items.isEmpty()) {
                    Map<String, Object> channel = items.get(0);
                    channelId = (String) channel.get("id");
                    Map<String, Object> snippet = (Map<String, Object>) channel.get("snippet");
                    if (snippet != null) {
                        channelName = (String) snippet.getOrDefault("title", "YouTube Channel");
                    }
                }
            } catch (Exception ex) {
                log.warn("[Social] Could not fetch YouTube channel info: {}", ex.getMessage());
            }

            return new TokenResult(
                    accessToken, refreshToken,
                    expiresIn != null ? LocalDateTime.now().plusSeconds(expiresIn) : null,
                    channelName, channelId
            );
        } catch (Exception e) {
            log.warn("[Social] Google token exchange failed: {}", e.getMessage());
            throw new BadRequestException("Failed to exchange Google authorization code: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private TokenResult exchangeLinkedInTokens(String code) {
        if (isBlank(linkedInConfig.getClientId())) {
            throw new BadRequestException("CONFIGURATION REQUIRED: LinkedIn credentials not configured.");
        }
        try {
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "authorization_code");
            body.add("code", code);
            body.add("client_id", linkedInConfig.getClientId());
            body.add("client_secret", linkedInConfig.getClientSecret());
            body.add("redirect_uri", linkedInConfig.getRedirectUri());

            Map<String, Object> response = restClient.post()
                    .uri("https://www.linkedin.com/oauth/v2/accessToken")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String accessToken = (String) response.get("access_token");
            Integer expiresIn = response.get("expires_in") instanceof Number n ? n.intValue() : null;

            if (accessToken == null || accessToken.isBlank()) {
                throw new BadRequestException("LinkedIn did not return an access token.");
            }

            String memberName = "LinkedIn Member";
            String memberUrn = null;
            try {
                Map<String, Object> profileResponse = restClient.get()
                        .uri("https://api.linkedin.com/v2/userinfo")
                        .header("Authorization", "Bearer " + accessToken)
                        .retrieve()
                        .body(Map.class);

                if (profileResponse != null) {
                    String sub = (String) profileResponse.get("sub");
                    String name = (String) profileResponse.get("name");
                    if (sub != null) {
                        memberUrn = "urn:li:person:" + sub;
                    }
                    if (name != null && !name.isBlank()) {
                        memberName = name;
                    }
                }
            } catch (Exception ex) {
                log.warn("[Social] Could not fetch LinkedIn profile: {}", ex.getMessage());
            }

            return new TokenResult(
                    accessToken, null,
                    expiresIn != null ? LocalDateTime.now().plusSeconds(expiresIn) : null,
                    memberName, memberUrn
            );
        } catch (Exception e) {
            log.warn("[Social] LinkedIn token exchange failed: {}", e.getMessage());
            throw new BadRequestException("Failed to exchange LinkedIn authorization code: " + e.getMessage());
        }
    }

    // ─── PKCE Cryptographic Helpers ─────────────────────────────────────────────

    private String generatePkceVerifier() {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private String generatePkceChallenge(String codeVerifier) {
        try {
            byte[] asciiBytes = codeVerifier.getBytes(StandardCharsets.US_ASCII);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(asciiBytes);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available for PKCE challenge generation", e);
        }
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private Platform parsePlatform(String platformStr) {
        try {
            return Platform.valueOf(platformStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unsupported platform: " + platformStr +
                    ". Supported: FACEBOOK, LINKEDIN, YOUTUBE, INSTAGRAM");
        }
    }

    private void validateMetaRedirectUri(String redirectUri) {
        if (isBlank(redirectUri)) {
            throw new BadRequestException(
                    "CONFIGURATION REQUIRED: Meta redirect URI is not configured. " +
                    "Please set the META_REDIRECT_URI environment variable to your full, absolute callback URL " +
                    "(e.g., https://<your-domain>/api/social-accounts/FACEBOOK/callback).");
        }
        try {
            URI uri = URI.create(redirectUri.trim());
            if (!uri.isAbsolute() || isBlank(uri.getHost())) {
                throw new BadRequestException(
                        "CONFIGURATION ERROR: Meta redirect URI '" + redirectUri + "' must be an absolute URL with a valid host " +
                        "(e.g., https://<your-domain>/api/social-accounts/FACEBOOK/callback).");
            }
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                    "CONFIGURATION ERROR: Meta redirect URI '" + redirectUri + "' is not a valid URI: " + e.getMessage());
        }
    }

    private Map<String, Object> parseMetaTokenResponse(String responseBody) {
        if (isBlank(responseBody)) {
            throw new BadRequestException("Empty response received from Meta OAuth service.");
        }
        try {
            Map<String, Object> map = objectMapper.readValue(responseBody, new TypeReference<Map<String, Object>>() {});
            if (map == null) {
                throw new BadRequestException("Invalid response received from Meta OAuth service.");
            }
            if (map.containsKey("error")) {
                Object errObj = map.get("error");
                if (errObj instanceof Map<?, ?> errMap) {
                    String msg = (String) errMap.get("message");
                    String type = (String) errMap.get("type");
                    Object code = errMap.get("code");
                    log.warn("[Social] Meta OAuth error response: code={}, type={}, message={}", code, type, msg);
                    throw new BadRequestException("Meta OAuth error (" + (code != null ? code : "unknown") + "): " + (msg != null ? msg : "Authorization failed"));
                }
                throw new BadRequestException("Meta OAuth error response received.");
            }
            return map;
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.warn("[Social] Failed to parse Meta token response JSON: {}", e.getMessage());
            throw new BadRequestException("Invalid response received from Meta OAuth service.");
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private String encode(String value) {
        try {
            return java.net.URLEncoder.encode(value, "UTF-8");
        } catch (Exception e) {
            return value;
        }
    }

    private SocialAccountResponse mapToResponse(SocialAccount a) {
        boolean expired = a.getTokenExpiresAt() != null && a.getTokenExpiresAt().isBefore(LocalDateTime.now());
        return SocialAccountResponse.builder()
                .id(a.getId())
                .platform(a.getPlatform())
                .accountName(a.getAccountName())
                .platformAccountId(a.getPlatformAccountId())
                .isConnected(Boolean.TRUE.equals(a.getIsConnected()))
                .restaurantId(a.getRestaurant().getId())
                .restaurantName(a.getRestaurant().getName())
                .tokenExpiresAt(a.getTokenExpiresAt())
                .tokenExpired(expired)
                .connectedAt(a.getCreatedAt())
                .build();
    }

    private record TokenResult(
            String accessToken,
            String refreshToken,
            LocalDateTime expiresAt,
            String accountName,
            String platformAccountId
    ) {}
}
