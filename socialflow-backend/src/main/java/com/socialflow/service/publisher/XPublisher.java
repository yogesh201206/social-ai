package com.socialflow.service.publisher;

import com.socialflow.entity.Post;
import com.socialflow.entity.SocialAccount;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Publishes to X (Twitter) using X API v2.
 *
 * Requires:
 * - X Developer Portal app with "Read and Write" permissions
 * - tweet.write scope
 * - OAuth 2.0 user context (not app-only)
 *
 * CONFIGURATION REQUIRED: X_CLIENT_ID, X_CLIENT_SECRET must be set.
 *
 * NOTE: X API free tier has post creation limits.
 * X API requires approved developer access for write operations.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class XPublisher implements SocialMediaPublisher {

    private final RestClient restClient;

    @Override
    public PublishResult publish(Post post, SocialAccount account) {
        String accessToken = account.getAccessToken();

        if (accessToken == null || accessToken.isBlank()) {
            return PublishResult.failure("X access token is missing. Please reconnect your account.");
        }

        if (!account.isTokenValid()) {
            return PublishResult.failure("X access token has expired. Please reconnect your account.");
        }

        // X has a 280 character limit
        String tweetText = buildTweetText(post);
        if (tweetText.length() > 280) {
            tweetText = tweetText.substring(0, 277) + "...";
        }

        try {
            Map<String, String> body = Map.of("text", tweetText);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri("https://api.twitter.com/2/tweets")
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) response.get("data");
            String tweetId = data != null ? (String) data.get("id") : null;

            log.info("[X] Published tweet for post id={} -> tweetId={}", post.getId(), tweetId);
            return PublishResult.success(tweetId);

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            log.warn("[X] Publish failed for post={}: HTTP {}", post.getId(), status);
            if (status == 403) {
                return PublishResult.failure(
                        "X API access denied (HTTP 403). Your X Developer app may not have 'Read and Write' permissions, " +
                        "or the account does not have the required API access level.");
            } else if (status == 429) {
                return PublishResult.failure("X API rate limit reached. Please wait before publishing again.");
            }
            return PublishResult.failure("X API error: HTTP " + status);
        } catch (Exception e) {
            log.error("[X] Unexpected publish error for post={}: {}", post.getId(), e.getMessage());
            return PublishResult.failure("X publish failed: " + e.getMessage());
        }
    }

    private String buildTweetText(Post post) {
        StringBuilder sb = new StringBuilder();
        if (post.getCaption() != null && !post.getCaption().isBlank()) {
            sb.append(post.getCaption());
        }
        // For X, append only a few relevant hashtags
        if (post.getHashtags() != null && !post.getHashtags().isBlank()) {
            String[] tags = post.getHashtags().split("\\s+");
            int remaining = 280 - sb.length() - 1;
            StringBuilder hashtagPart = new StringBuilder();
            for (String tag : tags) {
                if (hashtagPart.length() + tag.length() + 1 <= Math.min(remaining, 100)) {
                    hashtagPart.append(" ").append(tag);
                }
            }
            if (!hashtagPart.isEmpty()) sb.append(hashtagPart);
        }
        return sb.toString().trim();
    }
}
