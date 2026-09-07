package com.socialflow.service.publisher;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialflow.entity.Post;
import com.socialflow.entity.SocialAccount;
import com.socialflow.service.MediaStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.util.*;

/**
 * Real Meta Graph API Facebook Page Publisher.
 * Handles text and photo publishing, external deletion, and real engagement metrics.
 * Safely inspects token permissions and diagnostics. Never logs access tokens.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FacebookPublisher implements SocialMediaPublisher {

    private static final String GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

    private final RestClient restClient;
    private final MediaStorageService mediaStorageService;
    private final ObjectMapper objectMapper;

    @Value("${app.public-base-url:}")
    private String publicBaseUrl;

    public record MetaErrorInfo(String message, String type, int code, int errorSubcode) {}
    private record EngagementResult(boolean success, Long likes, Long comments, Long shares, boolean isPermissionError, String errorMessage) {}

    @Override
    public PublishResult publish(Post post, SocialAccount account) {
        if (account == null || account.getAccessToken() == null || account.getAccessToken().isBlank()) {
            return PublishResult.failure("No valid Facebook Page access token found. Please connect your Facebook account.");
        }

        String pageId = account.getPlatformAccountId();
        if (pageId == null || pageId.isBlank()) {
            return PublishResult.failure("Facebook Page ID is missing for this account. Please reconnect Facebook.");
        }

        String pageAccessToken = account.getAccessToken();
        String fullMessage = buildPostMessage(post);

        // Determine if post includes an image or is text-only
        String mediaPath = post.getMediaPath();
        String imageUrl = post.getImageUrl();
        boolean hasLocalMedia = mediaPath != null && !mediaPath.isBlank();
        boolean hasImageUrl = imageUrl != null && !imageUrl.isBlank();

        try {
            if (hasLocalMedia || hasImageUrl) {
                return publishPhoto(pageId, fullMessage, mediaPath, imageUrl, pageAccessToken);
            } else {
                return publishFeedMessage(pageId, fullMessage, pageAccessToken);
            }
        } catch (HttpClientErrorException e) {
            String sanitizedError = parseMetaError(e.getResponseBodyAsString(), e.getStatusCode().value());
            log.warn("[Facebook] Publish failed (HTTP {}): {}", e.getStatusCode().value(), sanitizedError);
            return PublishResult.failure(sanitizedError);
        } catch (Exception e) {
            log.error("[Facebook] Unexpected error publishing to Page {}: {}", pageId, e.getMessage());
            return PublishResult.failure("Facebook publishing error: " + e.getMessage());
        }
    }

    /**
     * Publishes a text-only post to the Facebook Page feed: POST /{page-id}/feed
     */
    private PublishResult publishFeedMessage(String pageId, String message, String pageAccessToken) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("message", message != null ? message : "");
        body.add("access_token", pageAccessToken);

        log.info("[Facebook] Publishing feed message to Page {}", pageId);

        String responseBody = restClient.post()
                .uri(GRAPH_API_BASE + "/" + pageId + "/feed")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(body)
                .retrieve()
                .body(String.class);

        Map<String, Object> response = parseMetaJson(responseBody);

        if (response != null) {
            if (response.containsKey("error")) {
                String errorMsg = formatMetaError(response.get("error"));
                log.warn("[Facebook] Publish feed error from Meta API: {}", errorMsg);
                return PublishResult.failure(errorMsg);
            }
            if (response.containsKey("id")) {
                String postId = String.valueOf(response.get("id"));
                if (postId != null && !postId.isBlank() && !"null".equalsIgnoreCase(postId)) {
                    log.info("[Facebook] Successfully published text post to Page {} -> platformPostId={}", pageId, postId);
                    return PublishResult.success(postId);
                }
            }
        }

        return PublishResult.failure("Facebook API returned response without post ID.");
    }

    /**
     * Publishes a photo post with caption to the Facebook Page: POST /{page-id}/photos
     */
    private PublishResult publishPhoto(String pageId, String caption, String mediaPath, String imageUrl, String pageAccessToken) {
        byte[] imageBytes = null;
        String fileName = "photo.jpg";

        if (mediaPath != null && !mediaPath.isBlank()) {
            imageBytes = mediaStorageService.loadMediaBytes(mediaPath);
            fileName = mediaPath.contains("/") ? mediaPath.substring(mediaPath.lastIndexOf("/") + 1) : "upload.jpg";
        } else if (imageUrl != null && (imageUrl.startsWith("data:") || imageUrl.contains("/api/media/files/"))) {
            imageBytes = mediaStorageService.loadMediaBytes(imageUrl);
        }

        if (imageBytes != null && imageBytes.length > 0) {
            // Multipart upload with raw image binary
            final String finalFileName = fileName;
            ByteArrayResource fileResource = new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return finalFileName;
                }
            };

            MultiValueMap<String, Object> multipartBody = new LinkedMultiValueMap<>();
            multipartBody.add("source", fileResource);
            if (caption != null && !caption.isBlank()) {
                multipartBody.add("caption", caption);
            }
            multipartBody.add("access_token", pageAccessToken);

            log.info("[Facebook] Uploading photo binary ({} bytes) to Page {}", imageBytes.length, pageId);

            String responseBody = restClient.post()
                    .uri(GRAPH_API_BASE + "/" + pageId + "/photos")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(multipartBody)
                    .retrieve()
                    .body(String.class);

            Map<String, Object> response = parseMetaJson(responseBody);

            if (response != null) {
                if (response.containsKey("error")) {
                    String errorMsg = formatMetaError(response.get("error"));
                    log.warn("[Facebook] Publish photo binary error from Meta API: {}", errorMsg);
                    return PublishResult.failure(errorMsg);
                }
                String postId = response.get("post_id") != null ? String.valueOf(response.get("post_id")) : null;
                if (postId == null || postId.isBlank() || "null".equalsIgnoreCase(postId)) {
                    postId = response.get("id") != null ? String.valueOf(response.get("id")) : null;
                }
                if (postId != null && !postId.isBlank() && !"null".equalsIgnoreCase(postId)) {
                    log.info("[Facebook] Successfully published photo to Page {} -> platformPostId={}", pageId, postId);
                    return PublishResult.success(postId);
                }
            }
            return PublishResult.failure("Facebook API returned empty ID for photo upload.");
        } else if (imageUrl != null && !imageUrl.isBlank()) {
            // Public URL photo post — Meta requires a publicly reachable HTTPS URL
            String publicMediaUrl;
            try {
                publicMediaUrl = resolvePublicMediaUrl(mediaPath, imageUrl);
            } catch (IllegalArgumentException ex) {
                log.warn("[Facebook] Cannot resolve public media URL: {}", ex.getMessage());
                return PublishResult.failure("Facebook image publishing failed: " + ex.getMessage());
            }

            // Safe diagnostic log — host only, never the token
            try {
                URI uri = URI.create(publicMediaUrl);
                log.info("[Facebook] Resolved public media URL: scheme={}, host={}, path={}",
                        uri.getScheme(), uri.getHost(), uri.getPath());
            } catch (Exception ignore) {
                log.info("[Facebook] Resolved public media URL (could not parse for logging)");
            }

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("url", publicMediaUrl);
            if (caption != null && !caption.isBlank()) {
                body.add("caption", caption);
            }
            body.add("access_token", pageAccessToken);

            log.info("[Facebook] Publishing photo via public HTTPS URL to Page {}", pageId);

            String responseBody = restClient.post()
                    .uri(GRAPH_API_BASE + "/" + pageId + "/photos")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            Map<String, Object> response = parseMetaJson(responseBody);

            if (response != null) {
                if (response.containsKey("error")) {
                    String errorMsg = formatMetaError(response.get("error"));
                    log.warn("[Facebook] Publish photo URL error from Meta API: {}", errorMsg);
                    return PublishResult.failure(errorMsg);
                }
                String postId = response.get("post_id") != null ? String.valueOf(response.get("post_id")) : null;
                if (postId == null || postId.isBlank() || "null".equalsIgnoreCase(postId)) {
                    postId = response.get("id") != null ? String.valueOf(response.get("id")) : null;
                }
                if (postId != null && !postId.isBlank() && !"null".equalsIgnoreCase(postId)) {
                    log.info("[Facebook] Successfully published photo via URL to Page {} -> platformPostId={}", pageId, postId);
                    return PublishResult.success(postId);
                }
            }
            return PublishResult.failure("Facebook API returned empty ID for photo URL upload.");
        }

        return PublishResult.failure("No valid image file or URL found for Facebook photo publishing.");
    }

    @Override
    public DeleteResult delete(Post post, SocialAccount account) {
        if (post == null || post.getPlatformPostId() == null || post.getPlatformPostId().isBlank()) {
            return DeleteResult.succeeded();
        }

        if (account == null || account.getAccessToken() == null || account.getAccessToken().isBlank()) {
            return DeleteResult.failure("Cannot delete from Facebook: Page access token is missing.");
        }

        String platformPostId = post.getPlatformPostId();
        String pageAccessToken = account.getAccessToken();

        try {
            log.info("[Facebook] Deleting post {} from Facebook Page", platformPostId);

            String responseBody = restClient.delete()
                    .uri(GRAPH_API_BASE + "/" + platformPostId + "?access_token=" + pageAccessToken)
                    .retrieve()
                    .body(String.class);

            Map<String, Object> response = parseMetaJson(responseBody);

            boolean success = response != null && Boolean.TRUE.equals(response.get("success"));
            if (success) {
                log.info("[Facebook] Post {} successfully deleted from Facebook", platformPostId);
                return DeleteResult.succeeded();
            }
            return DeleteResult.succeeded(); // Graph API may return empty on successful delete
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 404) {
                log.info("[Facebook] Post {} already deleted or not found on Facebook (404)", platformPostId);
                return DeleteResult.succeeded();
            }
            String sanitizedError = parseMetaError(e.getResponseBodyAsString(), e.getStatusCode().value());
            log.warn("[Facebook] Delete failed for post {}: {}", platformPostId, sanitizedError);
            return DeleteResult.failure(sanitizedError);
        } catch (Exception e) {
            log.error("[Facebook] Unexpected error deleting post {}: {}", platformPostId, e.getMessage());
            return DeleteResult.failure("Facebook delete error: " + e.getMessage());
        }
    }

    @Override
    public MetricsResult fetchMetrics(Post post, SocialAccount account) {
        if (post == null || post.getPlatformPostId() == null || post.getPlatformPostId().isBlank()) {
            return MetricsResult.notFetched("No platform post ID");
        }

        if (account == null || account.getAccessToken() == null || account.getAccessToken().isBlank()) {
            return MetricsResult.permissionRequired("Facebook access token is missing or expired");
        }

        String platformPostId = post.getPlatformPostId();
        String pageAccessToken = account.getAccessToken();
        String pageId = account.getPlatformAccountId();

        // 1. Diagnostic logging (Step 1 & Step 2)
        logFacebookDiagnostics(pageAccessToken, pageId, platformPostId);

        // 2. Step 5: Primary Query - Fetch Real Basic Post Engagement (Reactions, Comments, Shares)
        EngagementResult engagement = fetchPostEngagement(platformPostId, pageAccessToken);
        if (!engagement.success()) {
            if (engagement.isPermissionError()) {
                return MetricsResult.permissionRequired(engagement.errorMessage());
            }
            return MetricsResult.error(engagement.errorMessage());
        }

        Long likes = engagement.likes();
        Long comments = engagement.comments();
        Long shares = engagement.shares();

        // 3. Step 5: Separate Query - Post Insights (Impressions / Reach)
        // If insights are unavailable or not yet generated, views is null without failing basic engagement
        Long views = fetchPostInsights(platformPostId, pageAccessToken);

        log.info("[Facebook] Final metrics for post {} -> likes={}, comments={}, shares={}, views={}",
                platformPostId, likes, comments, shares, views);

        return MetricsResult.available(likes, comments, shares, views);
    }

    private EngagementResult fetchPostEngagement(String platformPostId, String pageAccessToken) {
        String endpoint = GRAPH_API_BASE + "/" + platformPostId + "?fields=shares,comments.summary(true),reactions.summary(true)&access_token=" + pageAccessToken;
        log.info("[Facebook] Fetching engagement: GET {}/{}?fields=shares,comments.summary(true),reactions.summary(true)", GRAPH_API_BASE, platformPostId);

        try {
            String responseBody = restClient.get()
                    .uri(endpoint)
                    .retrieve()
                    .body(String.class);

            Map<String, Object> response = parseMetaJson(responseBody);

            if (response != null && !response.isEmpty()) {
                if (response.containsKey("error")) {
                    MetaErrorInfo err = extractMetaErrorInfo(response.get("error"));
                    log.warn("[Facebook] Meta error on engagement query: message='{}', type='{}', code={}, error_subcode={}",
                            err.message(), err.type(), err.code(), err.errorSubcode());
                    return handleEngagementError(err, platformPostId, pageAccessToken);
                }

                Long likes = 0L;
                Long comments = 0L;
                Long shares = 0L;

                if (response.get("reactions") instanceof Map<?, ?> reactionsMap && reactionsMap.get("summary") instanceof Map<?, ?> summaryMap) {
                    likes = extractCount(summaryMap.get("total_count"));
                }
                if (response.get("comments") instanceof Map<?, ?> commentsMap && commentsMap.get("summary") instanceof Map<?, ?> summaryMap) {
                    comments = extractCount(summaryMap.get("total_count"));
                }
                if (response.get("shares") instanceof Map<?, ?> sharesMap) {
                    shares = extractCount(sharesMap.get("count"));
                }

                return new EngagementResult(true, likes, comments, shares, false, null);
            }

            return new EngagementResult(true, 0L, 0L, 0L, false, null);

        } catch (HttpClientErrorException e) {
            String errBody = e.getResponseBodyAsString();
            MetaErrorInfo err = extractMetaErrorInfo(parseMetaJson(errBody).get("error"));
            log.warn("[Facebook] HTTP {} on engagement query GET {}/{}?fields=shares,comments.summary(true),reactions.summary(true): message='{}', type='{}', code={}, error_subcode={}",
                    e.getStatusCode().value(), GRAPH_API_BASE, platformPostId, err.message(), err.type(), err.code(), err.errorSubcode());

            return handleEngagementError(err, platformPostId, pageAccessToken);
        } catch (Exception e) {
            log.warn("[Facebook] Unexpected error on engagement query for {}: {}", platformPostId, e.getMessage());
            return new EngagementResult(false, 0L, 0L, 0L, false, "Failed to fetch Facebook engagement: " + e.getMessage());
        }
    }

    private EngagementResult handleEngagementError(MetaErrorInfo err, String platformPostId, String pageAccessToken) {
        // If shares field was unsupported on this node type (code 100), retry with reactions and comments only
        if (err.code() == 100) {
            log.info("[Facebook] Field mismatch on post {}. Retrying with comments.summary(true),reactions.summary(true)...", platformPostId);
            return fetchReactionsAndCommentsOnly(platformPostId, pageAccessToken);
        }

        // Token expired / invalidated
        if (err.code() == 190 || ("OAuthException".equals(err.type()) && err.message() != null && err.message().contains("Session has expired"))) {
            return new EngagementResult(false, 0L, 0L, 0L, true, "Facebook Page token expired: " + err.message());
        }

        // Permission required (explicit OAuth permission denial)
        if (err.code() == 200 || err.code() == 10 || (err.message() != null && (err.message().contains("pages_read_engagement") || err.message().contains("Permissions")))) {
            return new EngagementResult(false, 0L, 0L, 0L, true, "Facebook permission required: " + err.message());
        }

        // Other API errors (do NOT treat as permission required)
        return new EngagementResult(false, 0L, 0L, 0L, false, "Facebook API error (code " + err.code() + "): " + err.message());
    }

    private EngagementResult fetchReactionsAndCommentsOnly(String platformPostId, String pageAccessToken) {
        String endpoint = GRAPH_API_BASE + "/" + platformPostId + "?fields=comments.summary(true),reactions.summary(true)&access_token=" + pageAccessToken;
        log.info("[Facebook] Fetching reactions & comments: GET {}/{}?fields=comments.summary(true),reactions.summary(true)", GRAPH_API_BASE, platformPostId);

        try {
            String responseBody = restClient.get()
                    .uri(endpoint)
                    .retrieve()
                    .body(String.class);

            Map<String, Object> response = parseMetaJson(responseBody);

            if (response != null && !response.isEmpty() && !response.containsKey("error")) {
                Long likes = 0L;
                Long comments = 0L;

                if (response.get("reactions") instanceof Map<?, ?> reactionsMap && reactionsMap.get("summary") instanceof Map<?, ?> summaryMap) {
                    likes = extractCount(summaryMap.get("total_count"));
                }
                if (response.get("comments") instanceof Map<?, ?> commentsMap && commentsMap.get("summary") instanceof Map<?, ?> summaryMap) {
                    comments = extractCount(summaryMap.get("total_count"));
                }

                return new EngagementResult(true, likes, comments, 0L, false, null);
            }
        } catch (Exception e) {
            log.warn("[Facebook] Retry with reactions & comments failed for {}: {}", platformPostId, e.getMessage());
        }

        return new EngagementResult(true, 0L, 0L, 0L, false, null);
    }

    private Long fetchPostInsights(String platformPostId, String pageAccessToken) {
        String endpoint = GRAPH_API_BASE + "/" + platformPostId + "/insights?metric=post_impressions,post_engaged_users&access_token=" + pageAccessToken;
        log.info("[Facebook] Fetching insights: GET {}/{}/insights?metric=post_impressions,post_engaged_users", GRAPH_API_BASE, platformPostId);

        try {
            String responseBody = restClient.get()
                    .uri(endpoint)
                    .retrieve()
                    .body(String.class);

            Map<String, Object> response = parseMetaJson(responseBody);

            if (response != null && response.get("data") instanceof List<?> dataList) {
                for (Object item : dataList) {
                    if (item instanceof Map<?, ?> metricItem) {
                        String name = (String) metricItem.get("name");
                        if ("post_impressions".equals(name) && metricItem.get("values") instanceof List<?> valuesList && !valuesList.isEmpty()) {
                            if (valuesList.get(0) instanceof Map<?, ?> valueMap) {
                                return extractCount(valueMap.get("value"));
                            }
                        }
                    }
                }
            }
        } catch (HttpClientErrorException e) {
            MetaErrorInfo err = extractMetaErrorInfo(parseMetaJson(e.getResponseBodyAsString()).get("error"));
            log.info("[Facebook] Insights unavailable for post {} (code {}): {}. Proceeding without impressions.", platformPostId, err.code(), err.message());
        } catch (Exception e) {
            log.info("[Facebook] Insights fetch error for post {}: {}. Proceeding without impressions.", platformPostId, e.getMessage());
        }

        return null;
    }

    private void logFacebookDiagnostics(String pageAccessToken, String pageId, String platformPostId) {
        try {
            // Step 1: Inspect permissions via /me/permissions
            String permUri = GRAPH_API_BASE + "/me/permissions?access_token=" + pageAccessToken;
            try {
                String permBody = restClient.get().uri(permUri).retrieve().body(String.class);
                Map<String, Object> permJson = parseMetaJson(permBody);
                if (permJson != null && permJson.get("data") instanceof List<?> dataList) {
                    Map<String, String> perms = new LinkedHashMap<>();
                    for (Object item : dataList) {
                        if (item instanceof Map<?, ?> map) {
                            Object perm = map.get("permission");
                            Object status = map.get("status");
                            if (perm != null && status != null) {
                                perms.put(String.valueOf(perm), String.valueOf(status));
                            }
                        }
                    }
                    log.info("[Facebook Diagnostics Step 1] Scopes: pages_read_engagement={}, read_insights={}, pages_show_list={}, pages_manage_posts={}",
                            perms.getOrDefault("pages_read_engagement", "unknown"),
                            perms.getOrDefault("read_insights", "unknown"),
                            perms.getOrDefault("pages_show_list", "unknown"),
                            perms.getOrDefault("pages_manage_posts", "unknown"));
                }
            } catch (Exception e) {
                log.info("[Facebook Diagnostics Step 1] /me/permissions note: {}", e.getMessage());
            }

            // Step 2: Inspect Token Type via /me
            String meUri = GRAPH_API_BASE + "/me?fields=id,name,category&access_token=" + pageAccessToken;
            try {
                String meBody = restClient.get().uri(meUri).retrieve().body(String.class);
                Map<String, Object> meJson = parseMetaJson(meBody);
                if (meJson != null) {
                    Object targetId = meJson.get("id");
                    Object category = meJson.get("category");
                    String tokenType = (category != null || (targetId != null && String.valueOf(targetId).equals(pageId))) ? "PAGE" : "USER";
                    log.info("[Facebook Diagnostics Step 2] tokenType={}, targetId={}, expectedPageId={}, platformPostId={}",
                            tokenType, targetId, pageId, platformPostId);
                }
            } catch (Exception e) {
                log.info("[Facebook Diagnostics Step 2] Token inspection note: {}", e.getMessage());
            }

        } catch (Exception ignored) {}
    }

    private MetaErrorInfo extractMetaErrorInfo(Object errorObj) {
        if (errorObj instanceof Map<?, ?> errMap) {
            String message = errMap.get("message") != null ? String.valueOf(errMap.get("message")) : "Unknown error";
            String type = errMap.get("type") != null ? String.valueOf(errMap.get("type")) : "Unknown";
            int code = errMap.get("code") instanceof Number n ? n.intValue() : 0;
            int subcode = errMap.get("error_subcode") instanceof Number n ? n.intValue() : 0;
            return new MetaErrorInfo(message, type, code, subcode);
        }
        return new MetaErrorInfo("No error details available", "Unknown", 0, 0);
    }

    private Map<String, Object> parseMetaJson(String body) {
        if (body == null || body.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            Map<String, Object> map = objectMapper.readValue(body, new TypeReference<Map<String, Object>>() {});
            return map != null ? map : Collections.emptyMap();
        } catch (Exception e) {
            log.warn("[Facebook] Failed to parse Meta JSON response: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    private String formatMetaError(Object errorObj) {
        if (errorObj instanceof Map<?, ?> errMap) {
            Object msg = errMap.get("message");
            Object type = errMap.get("type");
            Object code = errMap.get("code");
            Object subcode = errMap.get("error_subcode");

            StringBuilder sb = new StringBuilder();
            if (type != null) {
                sb.append("[").append(type).append("] ");
            }
            if (msg != null) {
                sb.append(msg);
            } else {
                sb.append("Unknown Facebook API error");
            }
            if (code != null) {
                sb.append(" (code: ").append(code).append(")");
            }
            if (subcode != null) {
                sb.append(" (subcode: ").append(subcode).append(")");
            }

            String sanitized = sb.toString();
            String codeStr = String.valueOf(code);
            String typeStr = String.valueOf(type);
            // Token-invalid: ONLY real OAuth token errors (code 190) or explicit OAuthException
            // Do NOT classify code-100 URL errors ("url should represent a valid URL") as token-invalid
            boolean isTokenError = "190".equals(codeStr)
                    || ("OAuthException".equals(typeStr)
                        && (subcode != null && ("460".equals(String.valueOf(subcode))
                            || "467".equals(String.valueOf(subcode))
                            || "463".equals(String.valueOf(subcode)))));
            if (isTokenError) {
                return "FACEBOOK_TOKEN_INVALID: " + sanitized;
            } else if ("200".equals(codeStr) || "10".equals(codeStr)
                    || sanitized.contains("Permissions") || sanitized.contains("permission")) {
                return "FACEBOOK_PERMISSION_REQUIRED: " + sanitized;
            }
            return "FACEBOOK_API_ERROR: " + sanitized;
        }
        return "Facebook API error: " + String.valueOf(errorObj);
    }

    /**
     * Converts any media path or image URL into a publicly reachable HTTPS URL suitable
     * for Meta's Graph API. Meta's servers cannot reach localhost, 127.0.0.1, WSL paths,
     * or relative URLs.
     *
     * @param mediaPath stored relative media path (may be null)
     * @param imageUrl  raw image URL from the post (may be null)
     * @return absolute HTTPS URL reachable by Meta's CDN
     * @throws IllegalArgumentException if the URL cannot be resolved to a public HTTPS URL
     */
    private String resolvePublicMediaUrl(String mediaPath, String imageUrl) {
        // Case 1: imageUrl is already an external public HTTPS URL (e.g. Unsplash, S3, CDN)
        if (imageUrl != null && imageUrl.startsWith("https://")
                && !imageUrl.contains("localhost")
                && !imageUrl.contains("127.0.0.1")
                && !imageUrl.contains("10.0.2.2")) {
            return imageUrl;
        }

        // Case 2: extract filename from mediaPath or API-relative imageUrl, prepend PUBLIC_BASE_URL
        String fileName = null;
        if (mediaPath != null && !mediaPath.isBlank()) {
            fileName = extractMediaFileName(mediaPath);
        } else if (imageUrl != null && (imageUrl.contains("/api/media/") || imageUrl.contains("/uploads/"))) {
            fileName = extractMediaFileName(imageUrl);
        }

        if (fileName != null && !fileName.isBlank()) {
            String base = (publicBaseUrl != null) ? publicBaseUrl.trim().replaceAll("/+$", "") : "";
            if (base.isBlank()) {
                throw new IllegalArgumentException(
                        "PUBLIC_BASE_URL is not configured. Facebook requires a publicly accessible HTTPS URL. "
                        + "Set PUBLIC_BASE_URL in application.properties or environment variables "
                        + "(e.g., https://your-ngrok-domain.ngrok-free.app).");
            }
            if (!base.startsWith("https://")) {
                throw new IllegalArgumentException(
                        "PUBLIC_BASE_URL must start with https://. Current value scheme is not HTTPS. "
                        + "Meta does not accept HTTP or localhost URLs.");
            }
            return base + "/api/media/files/" + fileName;
        }

        // Case 3: cannot resolve — refuse rather than send a bad URL to Meta
        throw new IllegalArgumentException(
                "Cannot construct a public HTTPS media URL from the provided media path or image URL. "
                + "Ensure PUBLIC_BASE_URL is configured and the media has been uploaded via MediaStorageService.");
    }

    /**
     * Extracts just the filename portion from a path, URL, or API path.
     * Strips query strings and strips any leading directory segments.
     */
    private String extractMediaFileName(String pathOrUrl) {
        if (pathOrUrl == null || pathOrUrl.isBlank()) return null;
        String clean = pathOrUrl.replace("\\", "/");
        if (clean.contains("?")) clean = clean.substring(0, clean.indexOf('?'));
        int slash = clean.lastIndexOf('/');
        String name = slash >= 0 ? clean.substring(slash + 1) : clean;
        return name.isBlank() ? null : name;
    }

    private Long extractCount(Object val) {
        if (val instanceof Number n) {
            return n.longValue();
        }
        return 0L;
    }

    private String buildPostMessage(Post post) {
        StringBuilder sb = new StringBuilder();
        if (post.getCaption() != null && !post.getCaption().isBlank()) {
            sb.append(post.getCaption().trim());
        }
        if (post.getHashtags() != null && !post.getHashtags().isBlank()) {
            String hashtags = post.getHashtags().trim();
            if (sb.length() > 0 && !sb.toString().contains(hashtags)) {
                sb.append("\n\n").append(hashtags);
            } else if (sb.length() == 0) {
                sb.append(hashtags);
            }
        }
        return sb.toString();
    }

    private String parseMetaError(String errorBody, int statusCode) {
        if (errorBody == null || errorBody.isBlank()) {
            return "HTTP " + statusCode + " error from Meta Graph API";
        }
        try {
            Map<String, Object> parsed = parseMetaJson(errorBody);
            if (parsed != null && parsed.containsKey("error")) {
                return formatMetaError(parsed.get("error"));
            }
        } catch (Exception ignored) {}
        return "Facebook API error (HTTP " + statusCode + ")";
    }
}
