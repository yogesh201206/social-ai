package com.socialflow.service.impl;

import com.socialflow.config.SocialPlatformConfig;
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
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

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

        // Block Instagram / Facebook — Coming Soon
        if (platform == Platform.INSTAGRAM || platform == Platform.FACEBOOK) {
            throw new BadRequestException(
                    platform.name() + " integration is coming soon. " +
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

        // 2. Exchange code for tokens (using stored PKCE verifier for X)
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
                    "CONFIGURATION REQUIRED: Meta (Instagram/Facebook) app credentials are not configured. " +
                    "Please set META_APP_ID and META_APP_SECRET environment variables. " +
                    "Register your app at https://developers.facebook.com/");
        }
        String scopes = platform == Platform.INSTAGRAM
                ? "instagram_basic,instagram_content_publish,pages_read_engagement"
                : "pages_manage_posts,pages_read_engagement";

        return "https://www.facebook.com/v19.0/dialog/oauth" +
               "?client_id=" + metaConfig.getAppId() +
               "&redirect_uri=" + encode(metaConfig.getRedirectUri()) +
               "&scope=" + encode(scopes) +
               "&state=" + encode(state + ":" + restaurantId) +
               "&response_type=code";
    }

    /**
     * Builds X (Twitter) OAuth 2.0 PKCE Authorization URL with S256 challenge.
     * Required scopes: tweet.read, tweet.write, users.read, offline.access
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

        // TEMPORARY Sanitized Debug Logging (zero secrets logged)
        log.info("[X-OAUTH] endpoint={}", endpoint);
        log.info("[X-OAUTH] redirectUri={}", xConfig.getRedirectUri());
        log.info("[X-OAUTH] scopes={}", scopes);
        log.info("[X-OAUTH] pkce=S256");
        log.info("[X-OAUTH] challengeLength={}", codeChallenge.length());
        log.info("[X-OAUTH] clientIdLength={}", xConfig.getClientId().length());
        log.info("[X-OAUTH] statePresent={}", !isBlank(state));

        String sanitizedUrl = endpoint +
               "?response_type=code" +
               "&client_id=[REDACTED_LEN_" + xConfig.getClientId().length() + "]" +
               "&redirect_uri=" + encodedRedirectUri +
               "&scope=" + encodedScopes +
               "&state=[REDACTED_STATE]" +
               "&code_challenge=" + codeChallenge +
               "&code_challenge_method=S256";
        log.info("[X-OAUTH] sanitizedAuthUrl={}", sanitizedUrl);

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
        int clientIdLength = googleConfig.getClientId().length();

        // Sanitized Debug Logging (zero secrets logged)
        log.info("[YOUTUBE-OAUTH] endpoint={}", endpoint);
        log.info("[YOUTUBE-OAUTH] redirectUri={}", redirectUri);
        log.info("[YOUTUBE-OAUTH] scopes={}", scopes);
        log.info("[YOUTUBE-OAUTH] clientIdLength={}", clientIdLength);

        String encodedScopes = encode(scopes);
        String encodedRedirectUri = encode(redirectUri);
        String encodedClientId = encode(googleConfig.getClientId());
        String encodedState = encode(state + ":" + restaurantId);

        String sanitizedUrl = endpoint +
                "?client_id=[REDACTED_LEN_" + clientIdLength + "]" +
                "&redirect_uri=" + encodedRedirectUri +
                "&response_type=code" +
                "&scope=" + encodedScopes +
                "&access_type=offline" +
                "&state=[REDACTED_STATE]";
        log.info("[YOUTUBE-OAUTH] sanitizedAuthUrl={}", sanitizedUrl);

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
     * Required scopes: openid, profile, w_member_social
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
        int clientIdLength = linkedInConfig.getClientId().length();

        // Sanitized Debug Logging (zero secrets logged)
        log.info("[LINKEDIN-OAUTH] endpoint={}", endpoint);
        log.info("[LINKEDIN-OAUTH] redirectUri={}", redirectUri);
        log.info("[LINKEDIN-OAUTH] scopes={}", scopes);
        log.info("[LINKEDIN-OAUTH] clientIdLength={}", clientIdLength);

        String encodedScopes = encode(scopes);
        String encodedRedirectUri = encode(redirectUri);
        String encodedClientId = encode(linkedInConfig.getClientId());
        String encodedState = encode(state + ":" + restaurantId);

        String sanitizedUrl = endpoint +
                "?response_type=code" +
                "&client_id=[REDACTED_LEN_" + clientIdLength + "]" +
                "&redirect_uri=" + encodedRedirectUri +
                "&scope=" + encodedScopes +
                "&state=[REDACTED_STATE]";
        log.info("[LINKEDIN-OAUTH] sanitizedAuthUrl={}", sanitizedUrl);

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
        try {
            Map<String, Object> response = restClient.get()
                    .uri("https://graph.facebook.com/v19.0/oauth/access_token" +
                         "?client_id=" + metaConfig.getAppId() +
                         "&client_secret=" + metaConfig.getAppSecret() +
                         "&redirect_uri=" + encode(metaConfig.getRedirectUri()) +
                         "&code=" + encode(code))
                    .retrieve()
                    .body(Map.class);

            String accessToken = (String) response.get("access_token");
            Integer expiresIn = response.get("expires_in") instanceof Number n ? n.intValue() : null;

            // Fetch account info
            Map<String, Object> meResponse = restClient.get()
                    .uri("https://graph.facebook.com/me?fields=id,name&access_token=" + accessToken)
                    .retrieve()
                    .body(Map.class);

            return new TokenResult(
                    accessToken, null,
                    expiresIn != null ? LocalDateTime.now().plusSeconds(expiresIn) : null,
                    (String) meResponse.get("name"),
                    (String) meResponse.get("id")
            );
        } catch (Exception e) {
            log.warn("[Social] Meta token exchange failed: {}", e.getMessage());
            throw new BadRequestException("Failed to exchange Meta authorization code: " + e.getMessage());
        }
    }

    /**
     * Exchanges X (Twitter) OAuth 2.0 authorization code for tokens using PKCE verifier.
     * Supports both confidential clients (HTTP Basic auth) and public clients.
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
            log.debug("[X OAuth] Exchanging token: redirect_uri={}, hasCodeVerifier={}, isConfidentialClient={}",
                    xConfig.getRedirectUri(),
                    !isBlank(codeVerifier),
                    !isBlank(xConfig.getClientSecret()));

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

            // If confidential client (secret present), add Basic Auth header
            if (!isBlank(xConfig.getClientSecret())) {
                String credentials = Base64.getEncoder().encodeToString(
                        (xConfig.getClientId() + ":" + xConfig.getClientSecret()).getBytes(StandardCharsets.UTF_8));
                requestSpec.header("Authorization", "Basic " + credentials);
            }

            Map<String, Object> response = requestSpec
                    .retrieve()
                    .body(Map.class);

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

            // Fetch X user profile: GET /2/users/me
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
            String safeMsg = parseOAuthError(responseBody, e.getStatusCode().value());
            throw new BadRequestException("X OAuth error: " + safeMsg);
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

            // Fetch YouTube channel name
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
        } catch (HttpClientErrorException e) {
            log.warn("[Social] Google token exchange failed: HTTP {} body={}", e.getStatusCode().value(), e.getResponseBodyAsString());
            throw new BadRequestException("Failed to exchange Google authorization code: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            log.warn("[Social] Google token exchange failed: {}", e.getMessage());
            throw new BadRequestException("Failed to exchange Google authorization code: " + e.getMessage());
        }
    }

    /**
     * Exchanges LinkedIn authorization code for access token.
     */
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

            // Fetch member profile using LinkedIn userinfo endpoint (OpenID Connect)
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
                try {
                    Map<String, Object> meResponse = restClient.get()
                            .uri("https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName)")
                            .header("Authorization", "Bearer " + accessToken)
                            .retrieve()
                            .body(Map.class);

                    if (meResponse != null) {
                        String id = (String) meResponse.get("id");
                        if (id != null) {
                            memberUrn = "urn:li:person:" + id;
                            String firstName = (String) meResponse.getOrDefault("localizedFirstName", "");
                            String lastName = (String) meResponse.getOrDefault("localizedLastName", "");
                            memberName = (firstName + " " + lastName).trim();
                            if (memberName.isBlank()) memberName = "LinkedIn Member";
                        }
                    }
                } catch (Exception ex2) {
                    log.warn("[Social] LinkedIn /v2/me fallback also failed: {}", ex2.getMessage());
                }
            }

            return new TokenResult(
                    accessToken, null,
                    expiresIn != null ? LocalDateTime.now().plusSeconds(expiresIn) : null,
                    memberName, memberUrn
            );
        } catch (HttpClientErrorException e) {
            log.warn("[Social] LinkedIn token exchange failed: HTTP {} body={}", e.getStatusCode().value(), e.getResponseBodyAsString());
            throw new BadRequestException("Failed to exchange LinkedIn authorization code: " + e.getResponseBodyAsString());
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.warn("[Social] LinkedIn token exchange failed: {}", e.getMessage());
            throw new BadRequestException("Failed to exchange LinkedIn authorization code: " + e.getMessage());
        }
    }

    // ─── PKCE Cryptographic Helpers ─────────────────────────────────────────────

    /**
     * Generates a high-entropy cryptographically random PKCE code_verifier string (RFC 7636).
     * 32 random bytes encoded as unpadded URL-safe Base64 -> 43 characters.
     */
    private String generatePkceVerifier() {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    /**
     * Generates an S256 code_challenge from a code_verifier (RFC 7636 Section 4.2).
     * code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier))) without padding.
     */
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

    /**
     * Parses OAuth error bodies and returns sanitized user-friendly explanations.
     */
    private String parseOAuthError(String responseBody, int statusCode) {
        if (responseBody != null && !responseBody.isBlank()) {
            if (responseBody.contains("invalid_client")) {
                return "Invalid client credentials. Please verify your X_CLIENT_ID and X_CLIENT_SECRET in .env and X Developer Portal.";
            } else if (responseBody.contains("invalid_grant")) {
                return "Authorization code or PKCE verifier is invalid/expired. Please initiate connection again.";
            } else if (responseBody.contains("redirect_uri_mismatch") || responseBody.contains("redirect_uri")) {
                return "Redirect URI mismatch. Ensure X_REDIRECT_URI exactly matches the Callback URL configured in X Developer Portal.";
            } else if (responseBody.contains("unauthorized_client")) {
                return "Unauthorized client. Ensure your app in X Developer Portal has OAuth 2.0 enabled with Read and Write permissions.";
            } else if (responseBody.contains("error_description")) {
                int start = responseBody.indexOf("\"error_description\":\"") + 21;
                int end = responseBody.indexOf("\"", start);
                if (start > 20 && end > start) {
                    return responseBody.substring(start, end);
                }
            }
        }
        return "HTTP " + statusCode + " error during token exchange";
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private Platform parsePlatform(String platformStr) {
        try {
            return Platform.valueOf(platformStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unsupported platform: " + platformStr +
                    ". Supported: INSTAGRAM, FACEBOOK, TWITTER, YOUTUBE, LINKEDIN");
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

    // Internal record for token exchange results — NEVER exposed to frontend
    private record TokenResult(
            String accessToken,
            String refreshToken,
            LocalDateTime expiresAt,
            String accountName,
            String platformAccountId
    ) {}
}
