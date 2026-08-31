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
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SocialAccountServiceImpl implements SocialAccountService {

    private final SocialAccountRepository socialAccountRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final SocialPlatformConfig.MetaConfig metaConfig;
    private final SocialPlatformConfig.XConfig xConfig;
    private final SocialPlatformConfig.TikTokConfig tikTokConfig;
    private final SocialPlatformConfig.GoogleConfig googleConfig;
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
        socialAccountRepository.save(account);

        // Build OAuth redirect URL per platform
        String redirectUrl = buildOAuthUrl(platform, state, restaurantId);
        return Map.of("redirectUrl", redirectUrl);
    }

    @Override
    @Transactional
    public SocialAccountResponse handleCallback(String platformStr, String code, String state) {
        // 1. Validate state (CSRF protection)
        SocialAccount account = socialAccountRepository.findByOauthState(state)
                .orElseThrow(() -> new BadRequestException("Invalid or expired OAuth state parameter"));

        Platform platform = parsePlatform(platformStr);
        if (account.getPlatform() != platform) {
            throw new BadRequestException("Platform mismatch in OAuth callback");
        }

        // 2. Exchange code for tokens
        TokenResult tokens = exchangeCodeForTokens(platform, code, account.getRestaurant().getId());

        // 3. Update account with tokens
        account.setAccessToken(tokens.accessToken());
        account.setRefreshToken(tokens.refreshToken());
        account.setTokenExpiresAt(tokens.expiresAt());
        account.setAccountName(tokens.accountName());
        account.setPlatformAccountId(tokens.platformAccountId());
        account.setIsConnected(true);
        account.setOauthState(null); // Clear state after use

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
        account.setIsConnected(false);
        socialAccountRepository.save(account);
        socialAccountRepository.delete(account);
        log.info("[Social] Disconnected {} account id={}", account.getPlatform(), id);
    }

    // ─── OAuth URL Builders ─────────────────────────────────────────────────────

    private String buildOAuthUrl(Platform platform, String state, Long restaurantId) {
        return switch (platform) {
            case INSTAGRAM, FACEBOOK -> buildMetaOAuthUrl(platform, state, restaurantId);
            case TWITTER -> buildXOAuthUrl(state, restaurantId);
            case TIKTOK -> buildTikTokOAuthUrl(state, restaurantId);
            case YOUTUBE -> buildGoogleOAuthUrl(state, restaurantId);
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

    private String buildXOAuthUrl(String state, Long restaurantId) {
        if (isBlank(xConfig.getClientId()) || isBlank(xConfig.getClientSecret())) {
            throw new BadRequestException(
                    "CONFIGURATION REQUIRED: X (Twitter) client credentials are not configured. " +
                    "Please set X_CLIENT_ID and X_CLIENT_SECRET environment variables. " +
                    "Register your app at https://developer.twitter.com/");
        }
        return "https://twitter.com/i/oauth2/authorize" +
               "?response_type=code" +
               "&client_id=" + encode(xConfig.getClientId()) +
               "&redirect_uri=" + encode(xConfig.getRedirectUri()) +
               "&scope=" + encode("tweet.read tweet.write users.read offline.access") +
               "&state=" + encode(state + ":" + restaurantId) +
               "&code_challenge=challenge" +
               "&code_challenge_method=plain";
    }

    private String buildTikTokOAuthUrl(String state, Long restaurantId) {
        if (isBlank(tikTokConfig.getClientKey()) || isBlank(tikTokConfig.getClientSecret())) {
            throw new BadRequestException(
                    "CONFIGURATION REQUIRED: TikTok client credentials are not configured. " +
                    "Please set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET environment variables. " +
                    "Register your app at https://developers.tiktok.com/");
        }
        return "https://www.tiktok.com/v2/auth/authorize/" +
               "?client_key=" + encode(tikTokConfig.getClientKey()) +
               "&scope=" + encode("user.info.basic,video.publish") +
               "&response_type=code" +
               "&redirect_uri=" + encode(tikTokConfig.getRedirectUri()) +
               "&state=" + encode(state + ":" + restaurantId);
    }

    private String buildGoogleOAuthUrl(String state, Long restaurantId) {
        if (isBlank(googleConfig.getClientId()) || isBlank(googleConfig.getClientSecret())) {
            throw new BadRequestException(
                    "CONFIGURATION REQUIRED: Google (YouTube) client credentials are not configured. " +
                    "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables. " +
                    "Register your app at https://console.cloud.google.com/");
        }
        return "https://accounts.google.com/o/oauth2/v2/auth" +
               "?client_id=" + encode(googleConfig.getClientId()) +
               "&redirect_uri=" + encode(googleConfig.getRedirectUri()) +
               "&response_type=code" +
               "&scope=" + encode("https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube") +
               "&access_type=offline" +
               "&state=" + encode(state + ":" + restaurantId);
    }

    // ─── Token Exchange ──────────────────────────────────────────────────────────

    private TokenResult exchangeCodeForTokens(Platform platform, String code, Long restaurantId) {
        return switch (platform) {
            case INSTAGRAM, FACEBOOK -> exchangeMetaTokens(code);
            case TWITTER -> exchangeXTokens(code);
            case TIKTOK -> exchangeTikTokTokens(code);
            case YOUTUBE -> exchangeGoogleTokens(code);
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
            Integer expiresIn = (Integer) response.get("expires_in");

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

    @SuppressWarnings("unchecked")
    private TokenResult exchangeXTokens(String code) {
        if (isBlank(xConfig.getClientId())) {
            throw new BadRequestException("CONFIGURATION REQUIRED: X credentials not configured.");
        }
        try {
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("code", code);
            body.add("grant_type", "authorization_code");
            body.add("client_id", xConfig.getClientId());
            body.add("redirect_uri", xConfig.getRedirectUri());
            body.add("code_verifier", "challenge");

            String credentials = Base64.getEncoder().encodeToString(
                    (xConfig.getClientId() + ":" + xConfig.getClientSecret()).getBytes());

            Map<String, Object> response = restClient.post()
                    .uri("https://api.twitter.com/2/oauth2/token")
                    .header("Authorization", "Basic " + credentials)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String accessToken = (String) response.get("access_token");
            String refreshToken = (String) response.get("refresh_token");

            return new TokenResult(accessToken, refreshToken, null, "X Account", null);
        } catch (Exception e) {
            log.warn("[Social] X token exchange failed: {}", e.getMessage());
            throw new BadRequestException("Failed to exchange X authorization code: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private TokenResult exchangeTikTokTokens(String code) {
        if (isBlank(tikTokConfig.getClientKey())) {
            throw new BadRequestException("CONFIGURATION REQUIRED: TikTok credentials not configured.");
        }
        try {
            Map<String, Object> requestBody = Map.of(
                    "client_key", tikTokConfig.getClientKey(),
                    "client_secret", tikTokConfig.getClientSecret(),
                    "code", code,
                    "grant_type", "authorization_code",
                    "redirect_uri", tikTokConfig.getRedirectUri()
            );

            Map<String, Object> response = restClient.post()
                    .uri("https://open.tiktokapis.com/v2/oauth/token/")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            Map<String, Object> data = (Map<String, Object>) response.get("data");
            if (data == null) throw new BadRequestException("TikTok returned empty token data");

            String accessToken = (String) data.get("access_token");
            String refreshToken = (String) data.get("refresh_token");
            Integer expiresIn = (Integer) data.get("expires_in");
            String openId = (String) data.get("open_id");

            return new TokenResult(
                    accessToken, refreshToken,
                    expiresIn != null ? LocalDateTime.now().plusSeconds(expiresIn) : null,
                    "TikTok Account", openId
            );
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.warn("[Social] TikTok token exchange failed: {}", e.getMessage());
            throw new BadRequestException("Failed to exchange TikTok authorization code: " + e.getMessage());
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
            Integer expiresIn = (Integer) response.get("expires_in");

            return new TokenResult(
                    accessToken, refreshToken,
                    expiresIn != null ? LocalDateTime.now().plusSeconds(expiresIn) : null,
                    "YouTube Channel", null
            );
        } catch (Exception e) {
            log.warn("[Social] Google token exchange failed: {}", e.getMessage());
            throw new BadRequestException("Failed to exchange Google authorization code: " + e.getMessage());
        }
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private Platform parsePlatform(String platformStr) {
        try {
            return Platform.valueOf(platformStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unsupported platform: " + platformStr +
                    ". Supported: INSTAGRAM, FACEBOOK, TWITTER, TIKTOK, YOUTUBE");
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

    // Internal record for token exchange results — never exposed to frontend
    private record TokenResult(
            String accessToken,
            String refreshToken,
            LocalDateTime expiresAt,
            String accountName,
            String platformAccountId
    ) {}
}
