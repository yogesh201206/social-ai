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
 * Publishes to Facebook Pages using the Meta Graph API.
 *
 * Requires:
 * - Facebook Page (not personal profile)
 * - pages_manage_posts permission
 * - Page access token (not user token)
 *
 * CONFIGURATION REQUIRED: META_APP_ID, META_APP_SECRET must be set.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FacebookPublisher implements SocialMediaPublisher {

    private final RestClient restClient;
    private static final String GRAPH_API = "https://graph.facebook.com/v19.0";

    @Override
    public PublishResult publish(Post post, SocialAccount account) {
        // ── COMING SOON ──────────────────────────────────────────────────────────
        // Facebook integration is not yet enabled. Meta Business verification
        // and pages_manage_posts permission approval are required.
        // Architecture is ready for when credentials are approved.
        // ─────────────────────────────────────────────────────────────────────────
        return PublishResult.failure(
                "Facebook integration is coming soon. Social account publishing has not been enabled yet. " +
                "Please check back after Meta Business verification is complete.");
    }

    // ─── Future implementation (preserved for when Meta credentials are approved) ─

    @SuppressWarnings("unused")
    private PublishResult publishWhenEnabled(Post post, SocialAccount account) {
        String accessToken = account.getAccessToken();

        if (accessToken == null || accessToken.isBlank()) {
            return PublishResult.failure("Facebook access token is missing. Please reconnect your account.");
        }

        if (!account.isTokenValid()) {
            return PublishResult.failure("Facebook access token has expired. Please reconnect your account.");
        }

        String pageId = account.getPlatformAccountId();
        if (pageId == null || pageId.isBlank()) {
            return PublishResult.failure("Facebook page ID not found. Please reconnect your account.");
        }

        try {
            String message = buildMessage(post);
            Map<String, Object> body = new HashMap<>();
            body.put("message", message);
            body.put("access_token", accessToken);

            // If image URL is present, publish as photo
            String endpoint;
            if (post.getImageUrl() != null && !post.getImageUrl().isBlank()) {
                body.put("url", post.getImageUrl());
                endpoint = GRAPH_API + "/" + pageId + "/photos";
            } else {
                endpoint = GRAPH_API + "/" + pageId + "/feed";
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri(endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String postId = (String) response.get("id");
            if (postId == null) postId = (String) response.get("post_id");

            log.info("[Facebook] Published post id={} -> platformPostId={}", post.getId(), postId);
            return PublishResult.success(postId);

        } catch (HttpClientErrorException e) {
            String errorBody = e.getResponseBodyAsString();
            log.warn("[Facebook] Publish failed for post={}: HTTP {}", post.getId(), e.getStatusCode().value());
            return PublishResult.failure("Facebook API error: " + parseMetaError(errorBody));
        } catch (Exception e) {
            log.error("[Facebook] Unexpected publish error for post={}: {}", post.getId(), e.getMessage());
            return PublishResult.failure("Facebook publish failed: " + e.getMessage());
        }
    }

    private String buildMessage(Post post) {
        StringBuilder sb = new StringBuilder();
        if (post.getCaption() != null) sb.append(post.getCaption());
        if (post.getHashtags() != null && !post.getHashtags().isBlank()) {
            sb.append("\n\n").append(post.getHashtags());
        }
        return sb.toString();
    }

    private String parseMetaError(String body) {
        if (body != null && body.contains("\"message\"")) {
            int start = body.indexOf("\"message\":\"") + 11;
            int end = body.indexOf("\"", start);
            if (start > 10 && end > start) return body.substring(start, end);
        }
        return "Unknown Facebook API error";
    }
}
