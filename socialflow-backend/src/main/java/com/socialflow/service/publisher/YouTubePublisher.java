package com.socialflow.service.publisher;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialflow.entity.Post;
import com.socialflow.entity.SocialAccount;
import com.socialflow.service.MediaStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Publishes to YouTube using YouTube Data API v3 multipart upload,
 * handles video deletion, and fetches real statistics (views, likes, comments).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class YouTubePublisher implements SocialMediaPublisher {

    private final RestClient restClient;
    private final MediaStorageService mediaStorageService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public PublishResult publish(Post post, SocialAccount account) {
        String accessToken = account.getAccessToken();

        if (accessToken == null || accessToken.isBlank()) {
            return PublishResult.failure("YouTube access token is missing. Please reconnect your account.");
        }

        if (!account.isTokenValid()) {
            return PublishResult.failure("YouTube access token has expired. Please reconnect your account.");
        }

        String mediaReference = (post.getMediaPath() != null && !post.getMediaPath().isBlank())
                ? post.getMediaPath()
                : post.getImageUrl();

        // YouTube requires a video — reject text-only or image-only posts
        if (mediaReference == null || mediaReference.isBlank()) {
            return PublishResult.failure("YouTube publishing requires a video.");
        }

        // Validate that media is not a static image
        String lowerRef = mediaReference.toLowerCase();
        if (lowerRef.endsWith(".jpg") || lowerRef.endsWith(".jpeg") || lowerRef.endsWith(".png") ||
            lowerRef.endsWith(".gif") || lowerRef.endsWith(".webp") || lowerRef.startsWith("data:image/")) {
            return PublishResult.failure("YouTube publishing requires a video.");
        }

        byte[] videoBytes = fetchVideoBytes(mediaReference);
        if (videoBytes == null || videoBytes.length == 0) {
            return PublishResult.failure("Could not read video file for YouTube upload. Please ensure a valid video is selected.");
        }

        String videoMimeType = detectVideoContentType(mediaReference);

        try {
            // Build video resource metadata
            String privacyStatus = "private"; // default to private for safety, or user-selected
            if (post.getCaption() != null && post.getCaption().toLowerCase().contains("[privacy:public]")) {
                privacyStatus = "public";
            } else if (post.getCaption() != null && post.getCaption().toLowerCase().contains("[privacy:unlisted]")) {
                privacyStatus = "unlisted";
            }

            String title = post.getTitle() != null && !post.getTitle().isBlank() ? post.getTitle() : "SocialFlow Video";
            if (title.length() > 100) {
                title = title.substring(0, 97) + "...";
            }

            Map<String, Object> snippet = Map.of(
                    "title", title,
                    "description", buildDescription(post),
                    "tags", extractTags(post),
                    "categoryId", "22" // People & Blogs
            );

            Map<String, Object> status = Map.of(
                    "privacyStatus", privacyStatus,
                    "selfDeclaredMadeForKids", false
            );

            Map<String, Object> videoResource = Map.of(
                    "snippet", snippet,
                    "status", status
            );

            // Construct RFC 2387 multipart/related payload for YouTube Data API v3 upload
            String boundary = "socialflow_boundary_" + UUID.randomUUID().toString().replace("-", "");
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            // Part 1: Metadata JSON
            String jsonBody = objectMapper.writeValueAsString(videoResource);
            String part1Header = "--" + boundary + "\r\n" +
                    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
                    jsonBody + "\r\n";
            baos.write(part1Header.getBytes(StandardCharsets.UTF_8));

            // Part 2: Video Binary
            String part2Header = "--" + boundary + "\r\n" +
                    "Content-Type: " + videoMimeType + "\r\n\r\n";
            baos.write(part2Header.getBytes(StandardCharsets.UTF_8));
            baos.write(videoBytes);

            // Closing boundary
            String closingBoundary = "\r\n--" + boundary + "--\r\n";
            baos.write(closingBoundary.getBytes(StandardCharsets.UTF_8));

            byte[] multipartPayload = baos.toByteArray();

            log.info("[YouTube] Uploading video for post id={} (size={} bytes, mimeType={}, privacy={})",
                    post.getId(), videoBytes.length, videoMimeType, privacyStatus);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status")
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.parseMediaType("multipart/related; boundary=" + boundary))
                    .body(multipartPayload)
                    .retrieve()
                    .body(Map.class);

            String videoId = response != null ? (String) response.get("id") : null;
            if (videoId == null || videoId.isBlank()) {
                return PublishResult.failure("YouTube did not return a valid video ID.");
            }

            log.info("[YouTube] Successfully published video for post id={} -> videoId={}", post.getId(), videoId);
            return PublishResult.success(videoId);

        } catch (HttpClientErrorException e) {
            int statusCode = e.getStatusCode().value();
            String responseBody = e.getResponseBodyAsString();
            log.warn("[YouTube] Publish failed for post={}: HTTP {} body={}", post.getId(), statusCode, responseBody);
            return handleYouTubeHttpError(statusCode, responseBody);
        } catch (Exception e) {
            log.error("[YouTube] Unexpected publish error for post={}: {}", post.getId(), e.getMessage());
            return PublishResult.failure("YouTube publish failed: " + e.getMessage());
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
            return DeleteResult.failure("YouTube access token is missing. Please reconnect your account.");
        }

        try {
            restClient.delete()
                    .uri("https://www.googleapis.com/youtube/v3/videos?id=" + platformPostId)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .toBodilessEntity();

            log.info("[YouTube] Successfully deleted video id={} for post id={}", platformPostId, post.getId());
            return DeleteResult.succeeded();

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            log.warn("[YouTube] Delete returned HTTP {} for post={}", status, post.getId());
            if (status == 404) {
                // Video was already deleted on YouTube
                return DeleteResult.succeeded();
            } else if (status == 401 || status == 403) {
                return DeleteResult.failure("YouTube delete permission denied or token expired (HTTP " + status + ").");
            }
            return DeleteResult.failure("YouTube delete failed: HTTP " + status);
        } catch (Exception e) {
            log.error("[YouTube] Delete failed for post={}: {}", post.getId(), e.getMessage());
            return DeleteResult.failure("YouTube delete failed: " + e.getMessage());
        }
    }

    @Override
    public MetricsResult fetchMetrics(Post post, SocialAccount account) {
        String platformPostId = post.getPlatformPostId();
        if (platformPostId == null || platformPostId.isBlank()) {
            return MetricsResult.notFetched("Post has no YouTube video ID.");
        }

        String accessToken = account.getAccessToken();
        if (accessToken == null || accessToken.isBlank()) {
            return MetricsResult.error("YouTube access token is missing.");
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.get()
                    .uri("https://www.googleapis.com/youtube/v3/videos?part=statistics&id=" + platformPostId)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.get("items") instanceof List<?> items && !items.isEmpty()) {
                if (items.get(0) instanceof Map<?, ?> itemMap && itemMap.get("statistics") instanceof Map<?, ?> stats) {
                    Long views = parseNumber(stats.get("viewCount"));
                    Long likes = parseNumber(stats.get("likeCount"));
                    Long comments = parseNumber(stats.get("commentCount"));

                    return MetricsResult.available(
                            likes != null ? likes : 0L,
                            comments != null ? comments : 0L,
                            null, // shares not directly on video statistics
                            views != null ? views : 0L
                    );
                }
            }
            return MetricsResult.notFetched("Video statistics not found on YouTube.");

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            if (status == 403 || status == 401) {
                return MetricsResult.permissionRequired("YouTube API permission denied (HTTP " + status + ").");
            }
            return MetricsResult.error("YouTube statistics fetch failed: HTTP " + status);
        } catch (Exception e) {
            return MetricsResult.error("YouTube statistics error: " + e.getMessage());
        }
    }

    private byte[] fetchVideoBytes(String mediaUrl) {
        if (mediaUrl == null || mediaUrl.isBlank()) return null;

        // Check local file storage via MediaStorageService
        byte[] localBytes = mediaStorageService.loadMediaBytes(mediaUrl);
        if (localBytes != null && localBytes.length > 0) {
            return localBytes;
        }

        // Check if it's a data URL
        if (mediaUrl.startsWith("data:video/")) {
            int commaIndex = mediaUrl.indexOf(",");
            if (commaIndex != -1) {
                String base64Data = mediaUrl.substring(commaIndex + 1);
                return Base64.getDecoder().decode(base64Data.trim());
            }
        }

        // Check remote HTTP/HTTPS URL
        if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
            try {
                return restClient.get()
                        .uri(mediaUrl)
                        .retrieve()
                        .body(byte[].class);
            } catch (Exception e) {
                log.warn("[YouTube] Failed to download video from {}: {}", mediaUrl, e.getMessage());
            }
        }

        return null;
    }

    private String detectVideoContentType(String mediaUrl) {
        if (mediaUrl != null) {
            String lower = mediaUrl.toLowerCase();
            if (lower.endsWith(".mov")) return "video/quicktime";
            if (lower.endsWith(".webm")) return "video/webm";
            if (lower.endsWith(".mkv")) return "video/x-matroska";
        }
        return "video/mp4";
    }

    private PublishResult handleYouTubeHttpError(int status, String responseBody) {
        if (status == 403) {
            return PublishResult.failure(
                    "YouTube API permission denied (HTTP 403). Ensure YouTube Data API v3 is enabled in Google Cloud Console " +
                    "and the youtube.upload scope is granted.");
        } else if (status == 401) {
            return PublishResult.failure("YouTube access token is invalid or expired. Please reconnect your account.");
        } else if (status == 400) {
            return PublishResult.failure("YouTube rejected video upload request (HTTP 400). Please verify video format.");
        }
        return PublishResult.failure("YouTube API error: HTTP " + status);
    }

    private Long parseNumber(Object obj) {
        if (obj instanceof Number n) return n.longValue();
        if (obj instanceof String s) {
            try {
                return Long.parseLong(s);
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private String buildDescription(Post post) {
        StringBuilder sb = new StringBuilder();
        if (post.getCaption() != null) {
            // Clean any internal privacy markers
            String cleanCaption = post.getCaption()
                    .replace("[privacy:public]", "")
                    .replace("[privacy:unlisted]", "")
                    .replace("[privacy:private]", "")
                    .trim();
            sb.append(cleanCaption);
        }
        if (post.getHashtags() != null && !post.getHashtags().isBlank()) {
            sb.append("\n\n").append(post.getHashtags());
        }
        return sb.toString().trim();
    }

    private List<String> extractTags(Post post) {
        if (post.getHashtags() == null || post.getHashtags().isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(post.getHashtags().split("\\s+"))
                .map(tag -> tag.startsWith("#") ? tag.substring(1) : tag)
                .filter(tag -> !tag.isBlank())
                .limit(30)
                .toList();
    }
}
