package com.socialflow.service.publisher;

import com.socialflow.entity.Post;
import com.socialflow.entity.SocialAccount;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Publishes to LinkedIn, deletes posts from LinkedIn, and fetches metrics.
 *
 * Supports:
 * - Text-only posts (com.linkedin.ugc.ShareContent with NONE category)
 * - Image posts using LinkedIn Images API (registerUpload + binary PUT + IMAGE category)
 * - External deletion of published UGC posts & shares with proper single-encoding and fallback
 * - Metrics inspection (checks permissions / returns PERMISSION_REQUIRED if member token lacks read scopes)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LinkedInPublisher implements SocialMediaPublisher {

    private final RestClient restClient;

    @Override
    public PublishResult publish(Post post, SocialAccount account) {
        String accessToken = account.getAccessToken();

        if (accessToken == null || accessToken.isBlank()) {
            return PublishResult.failure("LinkedIn access token is missing. Please reconnect your account.");
        }

        if (!account.isTokenValid()) {
            return PublishResult.failure("LinkedIn access token has expired. Please reconnect your account.");
        }

        String personUrn = account.getPlatformAccountId();
        if (personUrn == null || personUrn.isBlank()) {
            return PublishResult.failure("LinkedIn member ID not found. Please reconnect your account.");
        }

        // Ensure URN is in correct format: urn:li:person:{id}
        String authorUrn = personUrn.startsWith("urn:li:") ? personUrn : "urn:li:person:" + personUrn;

        // If post has an image, use the 3-step LinkedIn Image upload flow
        if (post.getImageUrl() != null && !post.getImageUrl().isBlank()) {
            return publishWithImage(post, account, authorUrn, accessToken);
        }

        // Text-only post
        return publishTextOnly(post, authorUrn, accessToken);
    }

    private PublishResult publishTextOnly(Post post, String authorUrn, String accessToken) {
        try {
            String caption = buildCaption(post);

            Map<String, Object> specificContent = Map.of(
                    "com.linkedin.ugc.ShareContent", Map.of(
                            "shareCommentary", Map.of("text", caption),
                            "shareMediaCategory", "NONE"
                    )
            );

            Map<String, Object> body = Map.of(
                    "author", authorUrn,
                    "lifecycleState", "PUBLISHED",
                    "specificContent", specificContent,
                    "visibility", Map.of(
                            "com.linkedin.ugc.MemberNetworkVisibility", "PUBLIC"
                    )
            );

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> responseEntity = restClient.post()
                    .uri("https://api.linkedin.com/v2/ugcPosts")
                    .header("Authorization", "Bearer " + accessToken)
                    .header("X-Restli-Protocol-Version", "2.0.0")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toEntity(Map.class);

            @SuppressWarnings("unchecked")
            Map<String, Object> responseBody = responseEntity.getBody();
            String linkedInPostId = extractLinkedInPostId(responseEntity, responseBody);

            log.info("[LinkedIn] Published text post id={} -> platformPostId={}", post.getId(), linkedInPostId);
            return PublishResult.success(linkedInPostId);

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            String responseBody = e.getResponseBodyAsString();
            log.warn("[LinkedIn] Text publish failed for post={}: HTTP {} body={}", post.getId(), status, responseBody);
            return handleLinkedInHttpError(status, responseBody);
        } catch (Exception e) {
            log.error("[LinkedIn] Unexpected text publish error for post={}: {}", post.getId(), e.getMessage());
            return PublishResult.failure("LinkedIn publish failed: " + e.getMessage());
        }
    }

    private PublishResult publishWithImage(Post post, SocialAccount account, String authorUrn, String accessToken) {
        try {
            byte[] imageBytes = fetchMediaBytes(post.getImageUrl());
            if (imageBytes == null || imageBytes.length == 0) {
                return PublishResult.failure("Could not read image content for LinkedIn upload. Please verify image URL or format.");
            }

            // Step 1: Register upload with LinkedIn Assets API
            Map<String, Object> registerRequest = Map.of(
                    "registerUploadRequest", Map.of(
                            "recipes", List.of("urn:li:digitalmediaRecipe:feedshare-image"),
                            "owner", authorUrn,
                            "supportedUploadMechanism", List.of("SYNCHRONOUS_UPLOAD")
                    )
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> registerResponse = restClient.post()
                    .uri("https://api.linkedin.com/v2/assets?action=registerUpload")
                    .header("Authorization", "Bearer " + accessToken)
                    .header("X-Restli-Protocol-Version", "2.0.0")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(registerRequest)
                    .retrieve()
                    .body(Map.class);

            if (registerResponse == null || !registerResponse.containsKey("value")) {
                return PublishResult.failure("LinkedIn image upload registration failed: invalid response from API.");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> valueMap = (Map<String, Object>) registerResponse.get("value");
            String assetUrn = (String) valueMap.get("asset");

            @SuppressWarnings("unchecked")
            Map<String, Object> uploadMechanism = (Map<String, Object>) valueMap.get("uploadMechanism");
            @SuppressWarnings("unchecked")
            Map<String, Object> mediaUploadHttpRequest = (Map<String, Object>) uploadMechanism.get("com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest");
            String uploadUrl = (String) mediaUploadHttpRequest.get("uploadUrl");

            if (uploadUrl == null || assetUrn == null) {
                return PublishResult.failure("LinkedIn did not return an upload URL or asset URN.");
            }

            // Step 2: Upload image binary to the returned upload URL
            String contentType = detectImageContentType(post.getImageUrl());
            restClient.put()
                    .uri(uploadUrl)
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(imageBytes)
                    .retrieve()
                    .toBodilessEntity();

            // Step 3: Create UGC Post with IMAGE category referencing assetUrn
            String caption = buildCaption(post);
            String titleText = (post.getTitle() != null && !post.getTitle().isBlank()) ? post.getTitle() : "Post Image";

            Map<String, Object> mediaItem = new HashMap<>();
            mediaItem.put("status", "READY");
            mediaItem.put("media", assetUrn);
            mediaItem.put("title", Map.of("text", titleText));
            mediaItem.put("description", Map.of("text", titleText));

            Map<String, Object> specificContent = Map.of(
                    "com.linkedin.ugc.ShareContent", Map.of(
                            "shareCommentary", Map.of("text", caption),
                            "shareMediaCategory", "IMAGE",
                            "media", List.of(mediaItem)
                    )
            );

            Map<String, Object> postBody = Map.of(
                    "author", authorUrn,
                    "lifecycleState", "PUBLISHED",
                    "specificContent", specificContent,
                    "visibility", Map.of(
                            "com.linkedin.ugc.MemberNetworkVisibility", "PUBLIC"
                    )
            );

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> postResponseEntity = restClient.post()
                    .uri("https://api.linkedin.com/v2/ugcPosts")
                    .header("Authorization", "Bearer " + accessToken)
                    .header("X-Restli-Protocol-Version", "2.0.0")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(postBody)
                    .retrieve()
                    .toEntity(Map.class);

            @SuppressWarnings("unchecked")
            Map<String, Object> postResponseBody = postResponseEntity.getBody();
            String linkedInPostId = extractLinkedInPostId(postResponseEntity, postResponseBody);

            log.info("[LinkedIn] Published image post id={} -> platformPostId={}", post.getId(), linkedInPostId);
            return PublishResult.success(linkedInPostId);

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            String responseBody = e.getResponseBodyAsString();
            log.warn("[LinkedIn] Image publish failed for post={}: HTTP {} body={}", post.getId(), status, responseBody);
            return handleLinkedInHttpError(status, responseBody);
        } catch (Exception e) {
            log.error("[LinkedIn] Unexpected image publish error for post={}: {}", post.getId(), e.getMessage());
            return PublishResult.failure("LinkedIn image publish failed: " + e.getMessage());
        }
    }

    private String extractLinkedInPostId(@SuppressWarnings("rawtypes") ResponseEntity<Map> responseEntity, Map<String, Object> responseBody) {
        if (responseBody != null && responseBody.get("id") != null) {
            return (String) responseBody.get("id");
        }
        if (responseEntity != null) {
            String headerId = responseEntity.getHeaders().getFirst("x-restli-id");
            if (headerId != null && !headerId.isBlank()) return headerId;
            headerId = responseEntity.getHeaders().getFirst("X-RestLi-Id");
            if (headerId != null && !headerId.isBlank()) return headerId;
        }
        return null;
    }

    @Override
    public DeleteResult delete(Post post, SocialAccount account) {
        String platformPostId = post.getPlatformPostId();
        if (platformPostId == null || platformPostId.isBlank()) {
            // Nothing on LinkedIn to delete
            return DeleteResult.succeeded();
        }

        String accessToken = account.getAccessToken();
        if (accessToken == null || accessToken.isBlank()) {
            return DeleteResult.failure("LinkedIn access token is missing. Please reconnect your account.");
        }

        if (!account.isTokenValid()) {
            return DeleteResult.failure("LinkedIn access token has expired. Please reconnect your account.");
        }

        String rawId = platformPostId.trim();
        log.info("[LinkedIn] Initiating delete for post id={} with platformPostId={}", post.getId(), rawId);

        // Determine primary delete endpoint based on URN prefix
        String primaryEndpoint;
        if (rawId.startsWith("urn:li:share:")) {
            primaryEndpoint = "https://api.linkedin.com/v2/shares/";
        } else if (rawId.startsWith("urn:li:post:")) {
            primaryEndpoint = "https://api.linkedin.com/rest/posts/";
        } else {
            // Default to ugcPosts endpoint for urn:li:ugcPost:...
            primaryEndpoint = "https://api.linkedin.com/v2/ugcPosts/";
        }

        return executeLinkedInDelete(rawId, primaryEndpoint, accessToken, post.getId(), true);
    }

    private DeleteResult executeLinkedInDelete(String platformPostId, String endpointBase, String accessToken, Long postId, boolean allowFallback) {
        // Encode URN once and pass as a java.net.URI object to prevent RestClient from double-encoding '%'
        String encodedUrn = URLEncoder.encode(platformPostId, StandardCharsets.UTF_8);
        String fullUrl = endpointBase + encodedUrn;
        URI deleteUri = URI.create(fullUrl);

        try {
            var requestSpec = restClient.delete()
                    .uri(deleteUri)
                    .header("Authorization", "Bearer " + accessToken)
                    .header("X-Restli-Protocol-Version", "2.0.0");

            if (endpointBase.contains("/rest/")) {
                requestSpec.header("LinkedIn-Version", "202401");
            }

            requestSpec.retrieve().toBodilessEntity();

            log.info("[LinkedIn] Successfully deleted post id={} platformPostId={} endpoint={}", postId, platformPostId, endpointBase);
            return DeleteResult.succeeded();

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            String responseBody = e.getResponseBodyAsString();
            log.warn("[LinkedIn] Delete failed: HTTP {} body={} platformPostId={} endpoint={}",
                    status, responseBody, platformPostId, fullUrl);

            // If ugcPosts endpoint failed with 400/404, attempt fallback to shares endpoint and vice versa
            if (allowFallback && (status == 400 || status == 404)) {
                if (endpointBase.contains("/v2/ugcPosts/")) {
                    log.info("[LinkedIn] Retrying delete with /v2/shares/ for post id={}", postId);
                    return executeLinkedInDelete(platformPostId, "https://api.linkedin.com/v2/shares/", accessToken, postId, false);
                } else if (endpointBase.contains("/v2/shares/")) {
                    log.info("[LinkedIn] Retrying delete with /v2/ugcPosts/ for post id={}", postId);
                    return executeLinkedInDelete(platformPostId, "https://api.linkedin.com/v2/ugcPosts/", accessToken, postId, false);
                }
            }

            if (status == 404) {
                // Post was already deleted directly on LinkedIn
                log.info("[LinkedIn] Post already removed on LinkedIn (HTTP 404), proceeding with local deletion for post id={}", postId);
                return DeleteResult.succeeded();
            } else if (status == 401) {
                return DeleteResult.failure("LinkedIn access token is invalid or expired. Please reconnect your account.");
            } else if (status == 403) {
                return DeleteResult.failure("LinkedIn delete permission denied (HTTP 403). Only the original author can delete this post.");
            } else if (status == 400) {
                String errorDetail = parseLinkedInError(responseBody);
                return DeleteResult.failure("LinkedIn delete request rejected (HTTP 400): " + errorDetail);
            }
            return DeleteResult.failure("LinkedIn delete failed: HTTP " + status);
        } catch (Exception e) {
            log.error("[LinkedIn] Unexpected delete error for post id={}: {}", postId, e.getMessage());
            return DeleteResult.failure("LinkedIn delete failed: " + e.getMessage());
        }
    }

    private String parseLinkedInError(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "Bad Request";
        }
        try {
            if (responseBody.contains("\"message\"")) {
                int start = responseBody.indexOf("\"message\":\"") + 11;
                int end = responseBody.indexOf("\"", start);
                if (start > 10 && end > start) {
                    return responseBody.substring(start, end);
                }
            }
        } catch (Exception ignored) {}
        return "Invalid post identifier or request format";
    }

    @Override
    public MetricsResult fetchMetrics(Post post, SocialAccount account) {
        String platformPostId = post.getPlatformPostId();
        if (platformPostId == null || platformPostId.isBlank()) {
            return MetricsResult.notFetched("Post has no LinkedIn platform post ID.");
        }

        String accessToken = account.getAccessToken();
        if (accessToken == null || accessToken.isBlank()) {
            return MetricsResult.error("LinkedIn access token is missing.");
        }

        try {
            String encodedUrn = URLEncoder.encode(platformPostId, StandardCharsets.UTF_8);
            URI uri = URI.create("https://api.linkedin.com/v2/socialMetadata/" + encodedUrn);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.get()
                    .uri(uri)
                    .header("Authorization", "Bearer " + accessToken)
                    .header("X-Restli-Protocol-Version", "2.0.0")
                    .retrieve()
                    .body(Map.class);

            if (response != null) {
                Long likes = null;
                Long comments = null;
                Long shares = null;

                if (response.get("likesSummary") instanceof Map<?, ?> likesMap) {
                    Object count = likesMap.get("totalLikes");
                    if (count instanceof Number n) likes = n.longValue();
                }
                if (response.get("commentsSummary") instanceof Map<?, ?> commentsMap) {
                    Object count = commentsMap.get("totalComments");
                    if (count instanceof Number n) comments = n.longValue();
                }
                if (response.get("totalShares") instanceof Number n) {
                    shares = n.longValue();
                }

                return MetricsResult.available(likes != null ? likes : 0L, comments != null ? comments : 0L, shares != null ? shares : 0L, null);
            }
            return MetricsResult.permissionRequired("LinkedIn analytics read permission is not granted for this account type.");

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            if (status == 403 || status == 401) {
                return MetricsResult.permissionRequired("LinkedIn member tokens do not have read analytics permission (requires Community Management API).");
            }
            return MetricsResult.error("LinkedIn metrics fetch failed: HTTP " + status);
        } catch (Exception e) {
            return MetricsResult.error("LinkedIn metrics error: " + e.getMessage());
        }
    }

    private byte[] fetchMediaBytes(String mediaUrl) {
        if (mediaUrl == null || mediaUrl.isBlank()) return null;
        try {
            if (mediaUrl.startsWith("data:")) {
                int commaIndex = mediaUrl.indexOf(",");
                if (commaIndex != -1) {
                    String base64Data = mediaUrl.substring(commaIndex + 1);
                    return Base64.getDecoder().decode(base64Data.trim());
                }
            }
            if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
                return restClient.get()
                        .uri(mediaUrl)
                        .retrieve()
                        .body(byte[].class);
            }
        } catch (Exception e) {
            log.warn("[LinkedIn] Failed to fetch image bytes from {}: {}", mediaUrl, e.getMessage());
        }
        return null;
    }

    private String detectImageContentType(String mediaUrl) {
        if (mediaUrl != null) {
            String lower = mediaUrl.toLowerCase();
            if (lower.contains("png")) return "image/png";
            if (lower.contains("gif")) return "image/gif";
            if (lower.contains("webp")) return "image/webp";
        }
        return "image/jpeg";
    }

    private PublishResult handleLinkedInHttpError(int status, String responseBody) {
        if (status == 401) {
            return PublishResult.failure(
                    "LinkedIn access token is invalid or expired. Please reconnect your account.");
        } else if (status == 403) {
            return PublishResult.failure(
                    "LinkedIn permission denied (HTTP 403). Ensure the 'Share on LinkedIn' product is " +
                    "enabled in your LinkedIn Developer app and the w_member_social scope is granted. " +
                    "CONFIGURATION REQUIRED if this is the first setup.");
        } else if (status == 422) {
            return PublishResult.failure("LinkedIn rejected the post content. Please check your caption and image format.");
        } else if (status == 429) {
            return PublishResult.failure("LinkedIn API rate limit reached. Please wait before publishing again.");
        }
        return PublishResult.failure("LinkedIn API error: HTTP " + status);
    }

    private String buildCaption(Post post) {
        StringBuilder sb = new StringBuilder();
        if (post.getCaption() != null && !post.getCaption().isBlank()) {
            sb.append(post.getCaption());
        }
        if (post.getHashtags() != null && !post.getHashtags().isBlank()) {
            sb.append("\n\n").append(post.getHashtags());
        }
        // LinkedIn posts support up to 3000 chars for text
        String text = sb.toString().trim();
        if (text.length() > 3000) {
            text = text.substring(0, 2997) + "...";
        }
        return text;
    }
}
