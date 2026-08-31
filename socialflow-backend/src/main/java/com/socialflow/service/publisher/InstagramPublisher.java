package com.socialflow.service.publisher;

import com.socialflow.entity.Post;
import com.socialflow.entity.SocialAccount;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

/**
 * Publishes to Instagram using the Meta Graph API.
 *
 * Requires:
 * - Instagram Business or Creator account linked to a Facebook Page
 * - instagram_content_publish permission
 * - pages_read_engagement permission
 *
 * NOTE: Personal Instagram accounts do NOT support API publishing.
 * Text-only posts are not supported; imageUrl or videoUrl is required.
 *
 * CONFIGURATION REQUIRED: META_APP_ID, META_APP_SECRET must be set.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InstagramPublisher implements SocialMediaPublisher {

    private final RestClient restClient;

    private static final String GRAPH_API = "https://graph.facebook.com/v19.0";

    @Override
    public PublishResult publish(Post post, SocialAccount account) {
        // ── COMING SOON ──────────────────────────────────────────────────────────
        // Instagram integration is not yet enabled. Meta Business verification
        // and Meta App Review for instagram_content_publish are required.
        // Architecture is ready for when credentials are approved.
        // ─────────────────────────────────────────────────────────────────────────
        return PublishResult.failure(
                "Instagram integration is coming soon. Social account publishing has not been enabled yet. " +
                "Please check back after Meta Business verification is complete.");
    }

    // ─── Future implementation (preserved for when Meta credentials are approved) ─

    @SuppressWarnings("unused")
    private PublishResult publishWhenEnabled(Post post, SocialAccount account) {
        // Security: access token is used here in backend only — never logged
        String accessToken = account.getAccessToken();

        if (accessToken == null || accessToken.isBlank()) {
            return PublishResult.failure("Instagram access token is missing. Please reconnect your account.");
        }

        if (!account.isTokenValid()) {
            return PublishResult.failure("Instagram access token has expired. Please reconnect your account.");
        }

        // Instagram requires media for content publishing
        if (post.getImageUrl() == null || post.getImageUrl().isBlank()) {
            return PublishResult.failure(
                    "Instagram publishing requires an image URL. Text-only posts are not supported by the Instagram API.");
        }

        String igUserId = account.getPlatformAccountId();
        if (igUserId == null || igUserId.isBlank()) {
            return PublishResult.failure("Instagram user ID not found. Please reconnect your account.");
        }

        String caption = buildCaption(post);

        try {
            // Step 1: Create media container
            Map<String, Object> containerBody = new HashMap<>();
            containerBody.put("image_url", post.getImageUrl());
            containerBody.put("caption", caption);
            containerBody.put("access_token", accessToken);

            @SuppressWarnings("unchecked")
            Map<String, Object> containerResponse = restClient.post()
                    .uri(GRAPH_API + "/" + igUserId + "/media")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(containerBody)
                    .retrieve()
                    .body(Map.class);

            String containerId = (String) containerResponse.get("id");
            if (containerId == null) {
                return PublishResult.failure("Instagram did not return a media container ID.");
            }

            // Step 2: Publish media container
            Map<String, Object> publishBody = Map.of(
                    "creation_id", containerId,
                    "access_token", accessToken
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> publishResponse = restClient.post()
                    .uri(GRAPH_API + "/" + igUserId + "/media_publish")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(publishBody)
                    .retrieve()
                    .body(Map.class);

            String postId = (String) publishResponse.get("id");
            log.info("[Instagram] Published post id={} -> platformPostId={}", post.getId(), postId);
            return PublishResult.success(postId);

        } catch (HttpClientErrorException e) {
            String body = e.getResponseBodyAsString();
            log.warn("[Instagram] Publish failed for post={}: HTTP {} body={}", post.getId(), e.getStatusCode().value(), body);
            return PublishResult.failure("Instagram API error: " + parseMetaError(body));
        } catch (Exception e) {
            log.error("[Instagram] Unexpected publish error for post={}: {}", post.getId(), e.getMessage());
            return PublishResult.failure("Instagram publish failed: " + e.getMessage());
        }
    }

    private String buildCaption(Post post) {
        StringBuilder sb = new StringBuilder();
        if (post.getCaption() != null && !post.getCaption().isBlank()) {
            sb.append(post.getCaption());
        }
        if (post.getHashtags() != null && !post.getHashtags().isBlank()) {
            sb.append("\n\n").append(post.getHashtags());
        }
        return sb.toString();
    }

    private String parseMetaError(String body) {
        // Safe extraction of Meta error message without logging the full body (may contain tokens in edge cases)
        if (body != null && body.contains("\"message\"")) {
            int start = body.indexOf("\"message\":\"") + 11;
            int end = body.indexOf("\"", start);
            if (start > 10 && end > start) {
                return body.substring(start, end);
            }
        }
        return "Unknown Meta API error";
    }
}
