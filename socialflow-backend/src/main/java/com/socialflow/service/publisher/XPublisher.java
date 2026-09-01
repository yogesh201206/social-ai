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
 * Publishes to X (Twitter) using X API v2, handles external tweet deletion,
 * and fetches real public metrics.
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
                    .uri("https://api.x.com/2/tweets")
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            @SuppressWarnings("unchecked")
            Map<String, Object> data = response != null ? (Map<String, Object>) response.get("data") : null;
            String tweetId = data != null ? (String) data.get("id") : null;

            log.info("[X] Published tweet for post id={} -> tweetId={}", post.getId(), tweetId);
            return PublishResult.success(tweetId);

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            log.warn("[X] Publish failed for post={}: HTTP {}", post.getId(), status);
            return handleXHttpError(status);
        } catch (Exception e) {
            log.error("[X] Unexpected publish error for post={}: {}", post.getId(), e.getMessage());
            return PublishResult.failure("X publish failed: " + e.getMessage());
        }
    }

    @Override
    public DeleteResult delete(Post post, SocialAccount account) {
        String platformPostId = post.getPlatformPostId();
        if (platformPostId == null || platformPostId.isBlank()) {
            return DeleteResult.succeeded();
        }

        String accessToken = account.getAccessToken();
        if (accessToken == null || accessToken.isBlank()) {
            return DeleteResult.failure("X access token is missing. Please reconnect your account.");
        }

        try {
            restClient.delete()
                    .uri("https://api.x.com/2/tweets/" + platformPostId)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .toBodilessEntity();

            log.info("[X] Successfully deleted tweet id={} for post id={}", platformPostId, post.getId());
            return DeleteResult.succeeded();

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            log.warn("[X] Delete returned HTTP {} for post={}", status, post.getId());
            if (status == 404) {
                // Tweet already deleted on X
                return DeleteResult.succeeded();
            } else if (status == 401 || status == 403) {
                return DeleteResult.failure("X delete permission denied or token expired (HTTP " + status + ").");
            } else if (status == 402) {
                return DeleteResult.failure("X API rejected request: Developer account payment/credits required (HTTP 402).");
            }
            return DeleteResult.failure("X delete failed: HTTP " + status);
        } catch (Exception e) {
            log.error("[X] Delete failed for post={}: {}", post.getId(), e.getMessage());
            return DeleteResult.failure("X delete failed: " + e.getMessage());
        }
    }

    @Override
    public MetricsResult fetchMetrics(Post post, SocialAccount account) {
        String platformPostId = post.getPlatformPostId();
        if (platformPostId == null || platformPostId.isBlank()) {
            return MetricsResult.notFetched("Post has no X tweet ID.");
        }

        String accessToken = account.getAccessToken();
        if (accessToken == null || accessToken.isBlank()) {
            return MetricsResult.error("X access token is missing.");
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.get()
                    .uri("https://api.x.com/2/tweets/" + platformPostId + "?tweet.fields=public_metrics")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.get("data") instanceof Map<?, ?> dataMap) {
                if (dataMap.get("public_metrics") instanceof Map<?, ?> metrics) {
                    Long likes = parseNumber(metrics.get("like_count"));
                    Long comments = parseNumber(metrics.get("reply_count"));
                    Long retweets = parseNumber(metrics.get("retweet_count"));
                    Long quotes = parseNumber(metrics.get("quote_count"));
                    Long shares = (retweets != null ? retweets : 0L) + (quotes != null ? quotes : 0L);
                    Long views = parseNumber(metrics.get("impression_count"));

                    return MetricsResult.available(
                            likes != null ? likes : 0L,
                            comments != null ? comments : 0L,
                            shares,
                            views
                    );
                }
            }
            return MetricsResult.notFetched("X returned empty metrics object.");

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            if (status == 402) {
                return MetricsResult.permissionRequired("X public metrics require appropriate API access plan (HTTP 402 Payment Required).");
            } else if (status == 403 || status == 401) {
                return MetricsResult.permissionRequired("X public metrics access denied (HTTP " + status + ").");
            }
            return MetricsResult.error("X metrics fetch failed: HTTP " + status);
        } catch (Exception e) {
            return MetricsResult.error("X metrics error: " + e.getMessage());
        }
    }

    private Long parseNumber(Object obj) {
        if (obj instanceof Number n) return n.longValue();
        return null;
    }

    private PublishResult handleXHttpError(int status) {
        if (status == 402) {
            return PublishResult.failure(
                    "X API rejected this request because the connected developer account does not currently have the required API access/credits (HTTP 402 Payment Required).");
        } else if (status == 403) {
            return PublishResult.failure(
                    "X API access denied (HTTP 403). Your X Developer app may not have 'Read and Write' permissions, " +
                    "or the account does not have the required API access level.");
        } else if (status == 401) {
            return PublishResult.failure("X access token is invalid or expired. Please reconnect your account.");
        } else if (status == 429) {
            return PublishResult.failure("X API rate limit reached. Please wait before publishing again.");
        }
        return PublishResult.failure("X API error: HTTP " + status);
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
