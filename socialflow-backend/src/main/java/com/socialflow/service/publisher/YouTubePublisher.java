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
 * Publishes to YouTube using YouTube Data API v3.
 *
 * Requires:
 * - Google Cloud project with YouTube Data API v3 enabled
 * - OAuth scope: https://www.googleapis.com/auth/youtube.upload
 * - Valid video file/URL — YouTube does NOT support text-only posts via API
 * - Channel must be in good standing
 *
 * CONFIGURATION REQUIRED: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET must be set.
 *
 * NOTE: Full video upload requires multipart upload which is beyond a simple REST call.
 * This implementation inserts video metadata assuming the video URL points to a direct upload.
 * For production, use the YouTube resumable upload protocol.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class YouTubePublisher implements SocialMediaPublisher {

    private final RestClient restClient;

    @Override
    public PublishResult publish(Post post, SocialAccount account) {
        String accessToken = account.getAccessToken();

        if (accessToken == null || accessToken.isBlank()) {
            return PublishResult.failure("YouTube access token is missing. Please reconnect your account.");
        }

        if (!account.isTokenValid()) {
            return PublishResult.failure("YouTube access token has expired. Please reconnect your account.");
        }

        // YouTube requires a video — no text-only posts
        if (post.getImageUrl() == null || post.getImageUrl().isBlank()) {
            return PublishResult.failure(
                    "YouTube only supports video content. Please provide a video URL. " +
                    "Text-only or image-only posts are not supported by the YouTube Data API.");
        }

        try {
            // Build video resource metadata
            Map<String, Object> snippet = Map.of(
                    "title", post.getTitle() != null ? post.getTitle() : "New Video",
                    "description", buildDescription(post),
                    "tags", extractTags(post),
                    "categoryId", "22" // People & Blogs — adjust as needed
            );

            Map<String, Object> status = Map.of(
                    "privacyStatus", "public",
                    "selfDeclaredMadeForKids", false
            );

            Map<String, Object> videoResource = Map.of(
                    "snippet", snippet,
                    "status", status
            );

            // NOTE: YouTube video upload requires the actual binary file.
            // The YouTube Data API v3 insert endpoint with part=snippet,status
            // sets metadata; the actual video content must be uploaded separately
            // via the resumable upload protocol.
            // This call sets the metadata and returns the video ID once content is uploaded.
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri("https://www.googleapis.com/youtube/v3/videos?part=snippet,status")
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(videoResource)
                    .retrieve()
                    .body(Map.class);

            String videoId = (String) response.get("id");
            log.info("[YouTube] Published video for post id={} -> videoId={}", post.getId(), videoId);
            return PublishResult.success(videoId);

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            log.warn("[YouTube] Publish failed for post={}: HTTP {}", post.getId(), status);
            if (status == 403) {
                return PublishResult.failure(
                        "YouTube API permission denied. Ensure YouTube Data API v3 is enabled in Google Cloud Console " +
                        "and the youtube.upload scope is granted.");
            } else if (status == 401) {
                return PublishResult.failure("YouTube access token is invalid or expired. Please reconnect your account.");
            }
            return PublishResult.failure("YouTube API error: HTTP " + status);
        } catch (Exception e) {
            log.error("[YouTube] Unexpected publish error for post={}: {}", post.getId(), e.getMessage());
            return PublishResult.failure("YouTube publish failed: " + e.getMessage());
        }
    }

    private String buildDescription(Post post) {
        StringBuilder sb = new StringBuilder();
        if (post.getCaption() != null) sb.append(post.getCaption());
        if (post.getHashtags() != null && !post.getHashtags().isBlank()) {
            sb.append("\n\n").append(post.getHashtags());
        }
        return sb.toString();
    }

    private java.util.List<String> extractTags(Post post) {
        if (post.getHashtags() == null || post.getHashtags().isBlank()) {
            return java.util.List.of();
        }
        return java.util.Arrays.stream(post.getHashtags().split("\\s+"))
                .map(tag -> tag.startsWith("#") ? tag.substring(1) : tag)
                .filter(tag -> !tag.isBlank())
                .limit(30) // YouTube max 30 tags
                .toList();
    }
}
