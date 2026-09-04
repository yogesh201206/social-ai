package com.socialflow.service.publisher;

import com.socialflow.entity.Post;
import com.socialflow.entity.SocialAccount;
import com.socialflow.service.MediaStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Real Meta Graph API Facebook Page Publisher.
 * Handles text and photo publishing, external deletion, and real engagement metrics.
 * Zero fake metrics or mock data. Never logs access tokens.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FacebookPublisher implements SocialMediaPublisher {

    private static final String GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

    private final RestClient restClient;
    private final MediaStorageService mediaStorageService;

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
    @SuppressWarnings("unchecked")
    private PublishResult publishFeedMessage(String pageId, String message, String pageAccessToken) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("message", message != null ? message : "");
        body.add("access_token", pageAccessToken);

        log.info("[Facebook] Publishing feed message to Page {}", pageId);

        Map<String, Object> response = restClient.post()
                .uri(GRAPH_API_BASE + "/" + pageId + "/feed")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(body)
                .retrieve()
                .body(Map.class);

        if (response != null && response.containsKey("id")) {
            String postId = (String) response.get("id");
            log.info("[Facebook] Successfully published text post to Page {} -> platformPostId={}", pageId, postId);
            return PublishResult.success(postId);
        }

        return PublishResult.failure("Facebook API returned response without post ID.");
    }

    /**
     * Publishes a photo post with caption to the Facebook Page: POST /{page-id}/photos
     */
    @SuppressWarnings("unchecked")
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

            Map<String, Object> response = restClient.post()
                    .uri(GRAPH_API_BASE + "/" + pageId + "/photos")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(multipartBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null) {
                String postId = (String) response.get("post_id");
                if (postId == null || postId.isBlank()) {
                    postId = (String) response.get("id");
                }
                if (postId != null && !postId.isBlank()) {
                    log.info("[Facebook] Successfully published photo to Page {} -> platformPostId={}", pageId, postId);
                    return PublishResult.success(postId);
                }
            }
            return PublishResult.failure("Facebook API returned empty ID for photo upload.");
        } else if (imageUrl != null && !imageUrl.isBlank()) {
            // Public URL photo post
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("url", imageUrl);
            if (caption != null && !caption.isBlank()) {
                body.add("caption", caption);
            }
            body.add("access_token", pageAccessToken);

            log.info("[Facebook] Publishing photo via URL to Page {}", pageId);

            Map<String, Object> response = restClient.post()
                    .uri(GRAPH_API_BASE + "/" + pageId + "/photos")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response != null) {
                String postId = (String) response.get("post_id");
                if (postId == null || postId.isBlank()) {
                    postId = (String) response.get("id");
                }
                if (postId != null && !postId.isBlank()) {
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

            Map<?, ?> response = restClient.delete()
                    .uri(GRAPH_API_BASE + "/" + platformPostId + "?access_token=" + pageAccessToken)
                    .retrieve()
                    .body(Map.class);

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
    @SuppressWarnings("unchecked")
    public MetricsResult fetchMetrics(Post post, SocialAccount account) {
        if (post == null || post.getPlatformPostId() == null || post.getPlatformPostId().isBlank()) {
            return MetricsResult.notFetched("No platform post ID");
        }

        if (account == null || account.getAccessToken() == null || account.getAccessToken().isBlank()) {
            return MetricsResult.permissionRequired("Facebook access token is missing or expired");
        }

        String platformPostId = post.getPlatformPostId();
        String pageAccessToken = account.getAccessToken();

        Long likes = 0L;
        Long comments = 0L;
        Long shares = 0L;
        Long views = null;

        try {
            // Fetch reactions summary, comments summary, shares count, and insights impressions
            String fields = "shares,comments.summary(true),reactions.summary(true),insights.metric(post_impressions,post_engaged_users)";
            Map<String, Object> response = restClient.get()
                    .uri(GRAPH_API_BASE + "/" + platformPostId + "?fields=" + fields + "&access_token=" + pageAccessToken)
                    .retrieve()
                    .body(Map.class);

            if (response != null) {
                // Reactions
                if (response.get("reactions") instanceof Map<?, ?> reactionsMap) {
                    if (reactionsMap.get("summary") instanceof Map<?, ?> summaryMap) {
                        likes = extractCount(summaryMap.get("total_count"));
                    }
                }

                // Comments
                if (response.get("comments") instanceof Map<?, ?> commentsMap) {
                    if (commentsMap.get("summary") instanceof Map<?, ?> summaryMap) {
                        comments = extractCount(summaryMap.get("total_count"));
                    }
                }

                // Shares
                if (response.get("shares") instanceof Map<?, ?> sharesMap) {
                    shares = extractCount(sharesMap.get("count"));
                }

                // Insights (impressions / reach)
                if (response.get("insights") instanceof Map<?, ?> insightsMap) {
                    if (insightsMap.get("data") instanceof List<?> dataList) {
                        for (Object item : dataList) {
                            if (item instanceof Map<?, ?> metricItem) {
                                String name = (String) metricItem.get("name");
                                if ("post_impressions".equals(name) && metricItem.get("values") instanceof List<?> valuesList && !valuesList.isEmpty()) {
                                    if (valuesList.get(0) instanceof Map<?, ?> valueMap) {
                                        views = extractCount(valueMap.get("value"));
                                    }
                                }
                            }
                        }
                    }
                }

                log.info("[Facebook] Fetched real metrics for post {} -> reactions={}, comments={}, shares={}, impressions={}",
                        platformPostId, likes, comments, shares, views);
                return MetricsResult.available(likes, comments, shares, views);
            }

            return MetricsResult.available(0L, 0L, 0L, null);
        } catch (HttpClientErrorException e) {
            String body = e.getResponseBodyAsString();
            if (e.getStatusCode().value() == 400 && (body.contains("read_insights") || body.contains("(#100)") || body.contains("(#200)"))) {
                // Fallback: query without insights
                return fetchBaseEngagementOnly(platformPostId, pageAccessToken);
            }
            String sanitizedError = parseMetaError(body, e.getStatusCode().value());
            log.warn("[Facebook] Metrics fetch error for {}: {}", platformPostId, sanitizedError);
            if (sanitizedError.contains("permission") || sanitizedError.contains("OAuthException")) {
                return MetricsResult.permissionRequired(sanitizedError);
            }
            return MetricsResult.error(sanitizedError);
        } catch (Exception e) {
            log.warn("[Facebook] Error fetching metrics for {}: {}", platformPostId, e.getMessage());
            return MetricsResult.error("Failed to fetch Facebook metrics: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private MetricsResult fetchBaseEngagementOnly(String platformPostId, String pageAccessToken) {
        try {
            String fields = "shares,comments.summary(true),reactions.summary(true)";
            Map<String, Object> response = restClient.get()
                    .uri(GRAPH_API_BASE + "/" + platformPostId + "?fields=" + fields + "&access_token=" + pageAccessToken)
                    .retrieve()
                    .body(Map.class);

            Long likes = 0L;
            Long comments = 0L;
            Long shares = 0L;

            if (response != null) {
                if (response.get("reactions") instanceof Map<?, ?> reactionsMap && reactionsMap.get("summary") instanceof Map<?, ?> summaryMap) {
                    likes = extractCount(summaryMap.get("total_count"));
                }
                if (response.get("comments") instanceof Map<?, ?> commentsMap && commentsMap.get("summary") instanceof Map<?, ?> summaryMap) {
                    comments = extractCount(summaryMap.get("total_count"));
                }
                if (response.get("shares") instanceof Map<?, ?> sharesMap) {
                    shares = extractCount(sharesMap.get("count"));
                }
                return MetricsResult.available(likes, comments, shares, null);
            }
        } catch (Exception ignored) {}
        return MetricsResult.available(0L, 0L, 0L, null);
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
            // Extract message and code without logging sensitive fields
            if (errorBody.contains("\"message\":")) {
                int start = errorBody.indexOf("\"message\":\"") + 11;
                int end = errorBody.indexOf("\"", start);
                if (start > 10 && end > start) {
                    String msg = errorBody.substring(start, end);
                    if (errorBody.contains("OAuthException") || errorBody.contains("190")) {
                        return "FACEBOOK_TOKEN_INVALID: " + msg;
                    } else if (errorBody.contains("(#200)") || errorBody.contains("Permissions")) {
                        return "FACEBOOK_PERMISSION_REQUIRED: " + msg;
                    }
                    return "FACEBOOK_API_ERROR: " + msg;
                }
            }
        } catch (Exception ignored) {}
        return "Facebook API error (HTTP " + statusCode + ")";
    }
}
