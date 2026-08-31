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
 * Publishes to TikTok using TikTok's Content Posting API v2.
 *
 * Requires:
 * - TikTok Developer app with video.publish scope approved
 * - Content is video-based — text-only posts are NOT supported by TikTok's API
 * - TikTok Creator account (not all business accounts support this)
 *
 * IMPORTANT: TikTok Content Posting API requires video upload, not direct caption posting.
 * This implementation handles the case where only text/caption exists by returning a clear error.
 *
 * CONFIGURATION REQUIRED: TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET must be set.
 * APPROVAL REQUIRED: video.publish scope requires TikTok developer approval.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TikTokPublisher implements SocialMediaPublisher {

    private final RestClient restClient;

    @Override
    public PublishResult publish(Post post, SocialAccount account) {
        String accessToken = account.getAccessToken();

        if (accessToken == null || accessToken.isBlank()) {
            return PublishResult.failure("TikTok access token is missing. Please reconnect your account.");
        }

        if (!account.isTokenValid()) {
            return PublishResult.failure("TikTok access token has expired. Please reconnect your account.");
        }

        // TikTok requires a video — text-only posts are not supported
        if (post.getImageUrl() == null || post.getImageUrl().isBlank()) {
            return PublishResult.failure(
                    "TikTok only supports video content. Please provide a video URL to publish to TikTok. " +
                    "Text-only posts are not supported by the TikTok Content Posting API.");
        }

        String openId = account.getPlatformAccountId();
        if (openId == null || openId.isBlank()) {
            return PublishResult.failure("TikTok user ID not found. Please reconnect your account.");
        }

        try {
            // TikTok Content Posting API — Direct Post (requires video URL)
            Map<String, Object> postInfo = Map.of(
                    "privacy_level", "PUBLIC_TO_EVERYONE",
                    "title", post.getCaption() != null ? post.getCaption().substring(0, Math.min(post.getCaption().length(), 150)) : "New Post",
                    "video_cover_timestamp_ms", 1000
            );

            Map<String, Object> sourceInfo = Map.of(
                    "source", "PULL_FROM_URL",
                    "video_url", post.getImageUrl() // must be a video URL for TikTok
            );

            Map<String, Object> body = Map.of(
                    "post_info", postInfo,
                    "source_info", sourceInfo,
                    "post_mode", "DIRECT_POST"
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri("https://open.tiktokapis.com/v2/post/publish/video/init/")
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) response.get("data");
            String publishId = data != null ? (String) data.get("publish_id") : null;

            log.info("[TikTok] Initiated publish for post id={} -> publishId={}", post.getId(), publishId);
            return PublishResult.success(publishId);

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            String body = e.getResponseBodyAsString();
            log.warn("[TikTok] Publish failed for post={}: HTTP {}", post.getId(), status);

            if (status == 401) {
                return PublishResult.failure("TikTok access denied. Your developer app may not have video.publish scope approved.");
            } else if (status == 403) {
                return PublishResult.failure(
                        "TikTok permission denied. The video.publish scope requires explicit approval from TikTok for your developer app.");
            }
            return PublishResult.failure("TikTok API error: HTTP " + status);
        } catch (Exception e) {
            log.error("[TikTok] Unexpected publish error for post={}: {}", post.getId(), e.getMessage());
            return PublishResult.failure("TikTok publish failed: " + e.getMessage());
        }
    }
}
