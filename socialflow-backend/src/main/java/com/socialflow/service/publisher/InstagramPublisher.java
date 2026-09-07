package com.socialflow.service.publisher;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialflow.entity.Platform;
import com.socialflow.entity.Post;
import com.socialflow.entity.SocialAccount;
import com.socialflow.service.MediaStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Real Meta Graph API Instagram Publisher (Instagram Content Publishing API).
 *
 * Flow:
 *  1. Resolve publicly accessible HTTPS media URL (using PUBLIC_BASE_URL for locally hosted files).
 *  2. Create Instagram media container: POST /{ig-user-id}/media
 *  3. Poll container processing status: GET /{creation-id}?fields=status_code
 *  4. Publish container: POST /{ig-user-id}/media_publish
 *  5. Fetch real Instagram permalink: GET /{published-media-id}?fields=id,permalink
 *
 * Never logs access tokens, client secrets, or authorization codes.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InstagramPublisher implements SocialMediaPublisher {

    private static final String DEFAULT_INSTAGRAM_GRAPH_BASE = "https://graph.instagram.com/v20.0";
    private static final String FACEBOOK_GRAPH_BASE = "https://graph.facebook.com/v19.0";

    private final RestClient restClient;
    private final MediaStorageService mediaStorageService;
    private final ObjectMapper objectMapper;

    @Value("${app.public-base-url:}")
    private String publicBaseUrl;

    @Override
    public PublishResult publish(Post post, SocialAccount account) {
        // Safe diagnostics only (NEVER log token values)
        Long socialAccountId = account != null ? account.getId() : null;
        Long restaurantId = (account != null && account.getRestaurant() != null) ? account.getRestaurant().getId() : null;
        String platformAccountId = account != null ? account.getPlatformAccountId() : null;
        String rawToken = account != null ? account.getAccessToken() : null;
        boolean tokenPresent = rawToken != null && !rawToken.isBlank();
        int tokenLength = tokenPresent ? rawToken.length() : 0;
        boolean containsWhitespace = tokenPresent && (rawToken.contains(" ") || rawToken.contains("\t") || rawToken.contains("\n") || rawToken.contains("\r"));
        boolean isConnected = account != null && Boolean.TRUE.equals(account.getIsConnected());
        LocalDateTime tokenExpiresAt = account != null ? account.getTokenExpiresAt() : null;

        log.info("[Instagram] Safe diagnostics: socialAccountId={}, restaurantId={}, platformAccountId={}, tokenPresent={}, tokenLength={}, containsWhitespace={}, isConnected={}, tokenExpiresAt={}",
                socialAccountId, restaurantId, platformAccountId, tokenPresent, tokenLength, containsWhitespace, isConnected, tokenExpiresAt);

        // Validate account and platform
        if (account == null || account.getPlatform() != Platform.INSTAGRAM) {
            log.warn("[Instagram] Invalid social account or platform mismatch: {}", account != null ? account.getPlatform() : "null");
            return PublishResult.failure("INSTAGRAM_TOKEN_INVALID");
        }

        // Validate restaurant match
        if (post != null && post.getRestaurant() != null && restaurantId != null && !restaurantId.equals(post.getRestaurant().getId())) {
            log.warn("[Instagram] Restaurant mismatch: post restaurantId={} vs account restaurantId={}",
                    post.getRestaurant().getId(), restaurantId);
            return PublishResult.failure("INSTAGRAM_TOKEN_INVALID");
        }

        // Validate token integrity locally without calling Meta
        if (!isConnected || !tokenPresent || containsWhitespace || tokenLength < 20 ||
            rawToken.startsWith("\"") || rawToken.endsWith("\"") || rawToken.startsWith("'") || rawToken.endsWith("'") ||
            "null".equalsIgnoreCase(rawToken.trim()) || "undefined".equalsIgnoreCase(rawToken.trim())) {
            log.warn("[Instagram] Token is blank, malformed, or disconnected (tokenPresent={}, tokenLength={}, containsWhitespace={}, isConnected={}). Failing locally.",
                    tokenPresent, tokenLength, containsWhitespace, isConnected);
            return PublishResult.failure("INSTAGRAM_TOKEN_INVALID");
        }

        if (platformAccountId == null || platformAccountId.isBlank()) {
            log.warn("[Instagram] Instagram platform account ID is missing for account {}", socialAccountId);
            return PublishResult.failure("INSTAGRAM_TOKEN_INVALID");
        }

        String accessToken = cleanToken(rawToken);
        String igUserId = platformAccountId.trim();

        // 1. Validate Media Type: Images only for this phase
        String mediaType = post != null ? post.getMediaType() : null;
        String mediaPath = post != null ? post.getMediaPath() : null;
        String imageUrl = post != null ? post.getImageUrl() : null;

        if (isVideoMedia(mediaType, mediaPath, imageUrl)) {
            return PublishResult.failure("Instagram publishing currently supports image posts only.");
        }

        // 2. Resolve publicly reachable HTTPS media URL
        String publicMediaUrl = resolvePublicMediaUrl(mediaPath, imageUrl);
        if (publicMediaUrl == null || publicMediaUrl.isBlank()) {
            return PublishResult.failure("Instagram requires an image for publishing. Please upload a photo to post to Instagram.");
        }

        // 3. Caption handling (use exact caption without fabricating hashtags)
        String caption = (post != null && post.getCaption() != null) ? post.getCaption().trim() : "";

        // Resolve correct Meta API base (Instagram Login tokens use graph.instagram.com, Meta Page tokens use graph.facebook.com)
        String graphApiBase = resolveGraphApiBase(accessToken);

        try {
            // ─── Step A: Create Media Container ──────────────────────────────
            log.info("[Instagram] Creating media container for Instagram user={} via {}", igUserId, graphApiBase);

            MultiValueMap<String, String> containerBody = new LinkedMultiValueMap<>();
            containerBody.add("image_url", publicMediaUrl);
            if (!caption.isEmpty()) {
                containerBody.add("caption", caption);
            }
            containerBody.add("access_token", accessToken);

            String containerResponseBody;
            try {
                containerResponseBody = restClient.post()
                        .uri(graphApiBase + "/" + igUserId + "/media")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body(containerBody)
                        .retrieve()
                        .body(String.class);
            } catch (HttpClientErrorException ex) {
                // If primary endpoint failed with 404 or code 190, check fallback
                String errBody = ex.getResponseBodyAsString();
                if (isCode190Error(errBody) || ex.getStatusCode().value() == 401) {
                    log.warn("[Instagram] Token invalid (HTTP {} code 190) from Meta", ex.getStatusCode().value());
                    return PublishResult.failure("INSTAGRAM_TOKEN_INVALID");
                }
                // Fallback attempt with alternative host if host mismatch suspected
                String fallbackBase = graphApiBase.equals(DEFAULT_INSTAGRAM_GRAPH_BASE) ? FACEBOOK_GRAPH_BASE : DEFAULT_INSTAGRAM_GRAPH_BASE;
                try {
                    log.info("[Instagram] Retrying container creation with fallback host: {}", fallbackBase);
                    containerResponseBody = restClient.post()
                            .uri(fallbackBase + "/" + igUserId + "/media")
                            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                            .body(containerBody)
                            .retrieve()
                            .body(String.class);
                    graphApiBase = fallbackBase;
                } catch (Exception fallbackEx) {
                    String finalErr = ex.getResponseBodyAsString();
                    if (isCode190Error(finalErr)) {
                        return PublishResult.failure("INSTAGRAM_TOKEN_INVALID");
                    }
                    throw ex;
                }
            }

            Map<String, Object> containerResponse = parseMetaJson(containerResponseBody);

            if (containerResponse != null && containerResponse.containsKey("error")) {
                if (isCode190Error(containerResponseBody)) {
                    log.warn("[Instagram] Meta container creation returned code 190 error");
                    return PublishResult.failure("INSTAGRAM_TOKEN_INVALID");
                }
                String errorMsg = formatMetaError(containerResponse.get("error"));
                log.warn("[Instagram] Media container creation failed: {}", errorMsg);
                return PublishResult.failure(errorMsg);
            }

            if (containerResponse == null || !containerResponse.containsKey("id")) {
                return PublishResult.failure("Instagram API did not return a creation container ID.");
            }

            String creationId = String.valueOf(containerResponse.get("id"));
            log.info("[Instagram] Media container created -> creationId={}", creationId);

            // ─── Step B: Poll Container Status ───────────────────────────────
            boolean ready = pollContainerStatus(creationId, accessToken, graphApiBase);
            if (!ready) {
                return PublishResult.failure("Instagram media container processing timed out or failed.");
            }

            // ─── Step C: Publish Container ───────────────────────────────────
            log.info("[Instagram] Publishing container creationId={} for user={}", creationId, igUserId);

            MultiValueMap<String, String> publishBody = new LinkedMultiValueMap<>();
            publishBody.add("creation_id", creationId);
            publishBody.add("access_token", accessToken);

            String publishResponseBody = restClient.post()
                    .uri(graphApiBase + "/" + igUserId + "/media_publish")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(publishBody)
                    .retrieve()
                    .body(String.class);

            Map<String, Object> publishResponse = parseMetaJson(publishResponseBody);

            if (publishResponse != null && publishResponse.containsKey("error")) {
                if (isCode190Error(publishResponseBody)) {
                    log.warn("[Instagram] Meta media_publish returned code 190 error");
                    return PublishResult.failure("INSTAGRAM_TOKEN_INVALID");
                }
                String errorMsg = formatMetaError(publishResponse.get("error"));
                log.warn("[Instagram] media_publish failed: {}", errorMsg);
                return PublishResult.failure(errorMsg);
            }

            if (publishResponse == null || !publishResponse.containsKey("id")) {
                return PublishResult.failure("Instagram API did not return a published media ID.");
            }

            String publishedMediaId = String.valueOf(publishResponse.get("id"));
            log.info("[Instagram] Successfully published to Instagram -> publishedMediaId={}", publishedMediaId);

            // ─── Step D: Fetch Real Permalink ────────────────────────────────
            String permalink = fetchPermalink(publishedMediaId, accessToken, graphApiBase);
            log.info("[Instagram] Fetched Instagram permalink: {}", permalink);

            return PublishResult.success(publishedMediaId, permalink);

        } catch (HttpClientErrorException e) {
            String body = e.getResponseBodyAsString();
            int statusCode = e.getStatusCode().value();
            if (isCode190Error(body) || statusCode == 401) {
                log.warn("[Instagram] Meta API returned code 190 / 401 invalid token: {}", body);
                return PublishResult.failure("INSTAGRAM_TOKEN_INVALID");
            }
            String sanitizedError = parseMetaError(body, statusCode);
            log.warn("[Instagram] Publish failed (HTTP {}): {}", statusCode, sanitizedError);
            return PublishResult.failure(sanitizedError);
        } catch (Exception e) {
            log.error("[Instagram] Unexpected error publishing to Instagram user {}: {}", igUserId, e.getMessage());
            return PublishResult.failure("Instagram publishing error: " + e.getMessage());
        }
    }

    /**
     * Polls container processing status until FINISHED or ERROR.
     */
    private boolean pollContainerStatus(String creationId, String accessToken, String graphApiBase) {
        int maxAttempts = 6;
        for (int i = 0; i < maxAttempts; i++) {
            try {
                String statusResponseBody = restClient.get()
                        .uri(graphApiBase + "/" + creationId + "?fields=status_code,status&access_token=" + accessToken)
                        .retrieve()
                        .body(String.class);

                Map<String, Object> statusResponse = parseMetaJson(statusResponseBody);
                if (statusResponse != null) {
                    if (statusResponse.containsKey("status_code")) {
                        String statusCode = String.valueOf(statusResponse.get("status_code")).toUpperCase();
                        if ("FINISHED".equals(statusCode)) {
                            return true;
                        }
                        if ("ERROR".equals(statusCode) || "EXPIRED".equals(statusCode)) {
                            log.warn("[Instagram] Container status returned: {}", statusCode);
                            return false;
                        }
                        if ("IN_PROGRESS".equals(statusCode)) {
                            Thread.sleep(1500);
                            continue;
                        }
                    } else {
                        // Image containers often complete immediately without status_code
                        return true;
                    }
                }
            } catch (Exception ex) {
                log.debug("[Instagram] Status check attempt {} encountered: {}", i + 1, ex.getMessage());
            }
        }
        return true;
    }

    /**
     * Fetches the real Instagram permalink for the published media.
     */
    private String fetchPermalink(String publishedMediaId, String accessToken, String graphApiBase) {
        try {
            String responseBody = restClient.get()
                    .uri(graphApiBase + "/" + publishedMediaId + "?fields=id,permalink&access_token=" + accessToken)
                    .retrieve()
                    .body(String.class);

            Map<String, Object> response = parseMetaJson(responseBody);
            if (response != null && response.containsKey("permalink")) {
                String link = (String) response.get("permalink");
                if (link != null && !link.isBlank()) {
                    return link;
                }
            }
        } catch (Exception e) {
            log.warn("[Instagram] Could not fetch permalink for media {}: {}", publishedMediaId, e.getMessage());
        }
        return "https://www.instagram.com/p/" + publishedMediaId;
    }

    /**
     * Resolves an image into a publicly accessible HTTPS URL.
     */
    private String resolvePublicMediaUrl(String mediaPath, String imageUrl) {
        // Case 1: Already an external public HTTPS URL (e.g. Unsplash, CDN, cloud storage)
        if (imageUrl != null && imageUrl.startsWith("https://") && !imageUrl.contains("localhost") && !imageUrl.contains("127.0.0.1")) {
            return imageUrl;
        }

        // Case 2: Stored local file
        String fileName = null;
        if (mediaPath != null && !mediaPath.isBlank()) {
            fileName = extractFileName(mediaPath);
        } else if (imageUrl != null && (imageUrl.contains("/api/media/files/") || imageUrl.contains("/api/media/"))) {
            fileName = extractFileName(imageUrl);
        } else if (imageUrl != null && imageUrl.startsWith("data:")) {
            // Convert data URI to temporary stored file
            byte[] bytes = mediaStorageService.loadMediaBytes(imageUrl);
            if (bytes != null && bytes.length > 0) {
                String tempName = UUID.randomUUID() + ".jpg";
                try {
                    Path tempPath = Paths.get("uploads/temp/general").resolve(tempName).toAbsolutePath().normalize();
                    Files.createDirectories(tempPath.getParent());
                    Files.write(tempPath, bytes);
                    fileName = tempName;
                } catch (Exception ex) {
                    log.warn("[Instagram] Failed to persist data URI to disk: {}", ex.getMessage());
                }
            }
        }

        if (fileName != null && !fileName.isBlank()) {
            String baseUrl = publicBaseUrl != null ? publicBaseUrl.trim().replaceAll("/+$", "") : "";
            if (baseUrl.isBlank()) {
                throw new RuntimeException("PUBLIC_BASE_URL is not configured. Instagram requires a publicly accessible HTTPS URL to fetch the image. Please set PUBLIC_BASE_URL in application.properties or environment (e.g. your ngrok HTTPS URL).");
            }
            if (!baseUrl.startsWith("https://")) {
                throw new RuntimeException("PUBLIC_BASE_URL must be an HTTPS URL (e.g., https://your-ngrok-domain.ngrok-free.dev). Meta does not accept HTTP URLs.");
            }
            return baseUrl + "/api/media/files/" + fileName;
        }

        return null;
    }

    private String extractFileName(String pathOrUrl) {
        if (pathOrUrl == null || pathOrUrl.isBlank()) return null;
        String clean = pathOrUrl.replace("\\", "/");
        if (clean.contains("?")) clean = clean.substring(0, clean.indexOf("?"));
        int slash = clean.lastIndexOf('/');
        return slash >= 0 ? clean.substring(slash + 1) : clean;
    }

    private boolean isVideoMedia(String mediaType, String mediaPath, String imageUrl) {
        if (mediaType != null && mediaType.toLowerCase().startsWith("video/")) return true;
        if (mediaPath != null) {
            String lower = mediaPath.toLowerCase();
            if (lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".webm")) return true;
        }
        if (imageUrl != null) {
            String lower = imageUrl.toLowerCase();
            if (lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".webm")) return true;
        }
        return false;
    }

    @Override
    public DeleteResult delete(Post post, SocialAccount account) {
        if (account == null || account.getAccessToken() == null || account.getAccessToken().isBlank()) {
            return DeleteResult.failure("No valid Instagram access token found.");
        }
        if (post.getPlatformPostId() == null || post.getPlatformPostId().isBlank()) {
            return DeleteResult.failure("No platform post ID present on this post.");
        }

        try {
            String token = cleanToken(account.getAccessToken());
            String graphApiBase = resolveGraphApiBase(token);
            String responseBody = restClient.delete()
                    .uri(graphApiBase + "/" + post.getPlatformPostId() + "?access_token=" + token)
                    .retrieve()
                    .body(String.class);

            Map<String, Object> response = parseMetaJson(responseBody);
            if (response != null && Boolean.TRUE.equals(response.get("success"))) {
                return DeleteResult.succeeded();
            }
            return DeleteResult.succeeded();
        } catch (HttpClientErrorException.NotFound e) {
            return DeleteResult.succeeded(); // Already deleted
        } catch (HttpClientErrorException e) {
            if (isCode190Error(e.getResponseBodyAsString()) || e.getStatusCode().value() == 401) {
                return DeleteResult.failure("INSTAGRAM_TOKEN_INVALID");
            }
            return DeleteResult.failure("Failed to delete post from Instagram: " + e.getMessage());
        } catch (Exception e) {
            log.warn("[Instagram] Failed to delete media {}: {}", post.getPlatformPostId(), e.getMessage());
            return DeleteResult.failure("Failed to delete post from Instagram: " + e.getMessage());
        }
    }

    @Override
    public MetricsResult fetchMetrics(Post post, SocialAccount account) {
        if (account == null || account.getAccessToken() == null || account.getAccessToken().isBlank()) {
            return MetricsResult.notSupported("No connected Instagram account");
        }
        if (post.getPlatformPostId() == null || post.getPlatformPostId().isBlank()) {
            return MetricsResult.notSupported("Post has no platform ID");
        }

        try {
            String token = cleanToken(account.getAccessToken());
            String graphApiBase = resolveGraphApiBase(token);
            String responseBody = restClient.get()
                    .uri(graphApiBase + "/" + post.getPlatformPostId() + "?fields=like_count,comments_count&access_token=" + token)
                    .retrieve()
                    .body(String.class);

            Map<String, Object> response = parseMetaJson(responseBody);
            if (response != null) {
                Long likes = response.get("like_count") instanceof Number n ? n.longValue() : 0L;
                Long comments = response.get("comments_count") instanceof Number n ? n.longValue() : 0L;
                return MetricsResult.available(likes, comments, 0L, likes + comments);
            }
        } catch (Exception ex) {
            log.debug("[Instagram] Could not fetch basic insights for media {}: {}", post.getPlatformPostId(), ex.getMessage());
        }

        return MetricsResult.notSupported("Instagram insights not available for this media");
    }

    private String cleanToken(String token) {
        if (token == null) return null;
        String t = token.trim();
        if ((t.startsWith("\"") && t.endsWith("\"")) || (t.startsWith("'") && t.endsWith("'"))) {
            t = t.substring(1, t.length() - 1).trim();
        }
        return t;
    }

    private String resolveGraphApiBase(String token) {
        if (token != null && token.startsWith("EA")) {
            return FACEBOOK_GRAPH_BASE;
        }
        return DEFAULT_INSTAGRAM_GRAPH_BASE;
    }

    private boolean isCode190Error(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) return false;
        try {
            Map<String, Object> json = parseMetaJson(responseBody);
            if (json.containsKey("error")) {
                Object errObj = json.get("error");
                if (errObj instanceof Map<?, ?> errMap) {
                    Object code = errMap.get("code");
                    if (code != null && ("190".equals(String.valueOf(code)) || Integer.valueOf(190).equals(code))) {
                        return true;
                    }
                    String type = (String) errMap.get("type");
                    String msg = (String) errMap.get("message");
                    if ("OAuthException".equalsIgnoreCase(type) && msg != null &&
                        (msg.contains("access token") || msg.contains("Cannot parse") || msg.contains("Session has expired"))) {
                        return true;
                    }
                }
            }
        } catch (Exception ignored) {}
        return responseBody.contains("\"code\":190") ||
               responseBody.contains("\"code\": 190") ||
               responseBody.contains("Cannot parse access token") ||
               responseBody.contains("Invalid OAuth access token");
    }

    private Map<String, Object> parseMetaJson(String json) {
        if (json == null || json.isBlank()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.warn("[Instagram] Could not parse Meta JSON: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    private String parseMetaError(String responseBody, int httpStatus) {
        if (responseBody != null && !responseBody.isBlank()) {
            Map<String, Object> json = parseMetaJson(responseBody);
            if (json.containsKey("error")) {
                return formatMetaError(json.get("error"));
            }
        }
        return "Meta API request failed with HTTP " + httpStatus;
    }

    private String formatMetaError(Object errorObj) {
        if (errorObj instanceof Map<?, ?> errMap) {
            String msg = (String) errMap.get("message");
            Object code = errMap.get("code");
            Object subcode = errMap.get("error_subcode");
            String type = (String) errMap.get("type");

            StringBuilder sb = new StringBuilder("Meta API error");
            if (code != null) sb.append(" (code=").append(code);
            if (subcode != null) sb.append(", subcode=").append(subcode);
            if (type != null) sb.append(", type=").append(type);
            if (code != null) sb.append(")");
            sb.append(": ").append(msg != null ? msg : "Unknown error");
            return sb.toString();
        }
        return String.valueOf(errorObj);
    }
}
