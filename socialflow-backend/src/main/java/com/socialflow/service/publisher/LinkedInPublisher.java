package com.socialflow.service.publisher;

import com.socialflow.entity.Post;
import com.socialflow.entity.SocialAccount;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Publishes to LinkedIn using the LinkedIn Share API (UGC Posts API).
 *
 * Requires:
 * - LinkedIn App with "Share on LinkedIn" product enabled
 * - OAuth scopes: openid, profile, w_member_social
 * - Valid user access token obtained via LinkedIn OAuth 2.0 PKCE flow
 *
 * Current LinkedIn API (as of 2024-2026):
 * - UGC Posts API: POST https://api.linkedin.com/v2/ugcPosts
 * - Author is the authenticated member (not page) unless using Organization API
 *
 * CONFIGURATION REQUIRED: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET must be set.
 *
 * NOTE: LinkedIn restricts API access. If "Share on LinkedIn" product is not
 * approved in the LinkedIn Developer Portal, publishing will fail with 403.
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

        try {
            Map<String, Object> body = buildSharePayload(post, authorUrn);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri("https://api.linkedin.com/v2/ugcPosts")
                    .header("Authorization", "Bearer " + accessToken)
                    .header("X-Restli-Protocol-Version", "2.0.0")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            // LinkedIn UGC Posts API returns the post ID in the "id" field
            String linkedInPostId = response != null ? (String) response.get("id") : null;

            log.info("[LinkedIn] Published post id={} -> linkedInPostId={}", post.getId(), linkedInPostId);
            return PublishResult.success(linkedInPostId);

        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            String responseBody = e.getResponseBodyAsString();
            log.warn("[LinkedIn] Publish failed for post={}: HTTP {} body={}", post.getId(), status, responseBody);

            if (status == 401) {
                return PublishResult.failure(
                        "LinkedIn access token is invalid or expired. Please reconnect your account.");
            } else if (status == 403) {
                return PublishResult.failure(
                        "LinkedIn permission denied (HTTP 403). Ensure the 'Share on LinkedIn' product is " +
                        "enabled in your LinkedIn Developer app and the w_member_social scope is granted. " +
                        "CONFIGURATION REQUIRED if this is the first setup.");
            } else if (status == 422) {
                return PublishResult.failure("LinkedIn rejected the post content. Please check your caption.");
            } else if (status == 429) {
                return PublishResult.failure("LinkedIn API rate limit reached. Please wait before publishing again.");
            }
            return PublishResult.failure("LinkedIn API error: HTTP " + status);
        } catch (Exception e) {
            log.error("[LinkedIn] Unexpected publish error for post={}: {}", post.getId(), e.getMessage());
            return PublishResult.failure("LinkedIn publish failed: " + e.getMessage());
        }
    }

    /**
     * Builds the UGC Post payload for LinkedIn.
     * Supports text-only posts and posts with an image URL.
     */
    private Map<String, Object> buildSharePayload(Post post, String authorUrn) {
        String caption = buildCaption(post);

        Map<String, Object> shareMediaCategory;
        Map<String, Object> specificContent;

        if (post.getImageUrl() != null && !post.getImageUrl().isBlank()) {
            // Post with article/URL attachment
            shareMediaCategory = null; // will be set below
            List<Map<String, Object>> media = new ArrayList<>();
            Map<String, Object> mediaItem = new HashMap<>();
            mediaItem.put("status", "READY");
            mediaItem.put("originalUrl", post.getImageUrl());
            if (post.getTitle() != null && !post.getTitle().isBlank()) {
                mediaItem.put("title", Map.of("text", post.getTitle()));
            }
            media.add(mediaItem);

            specificContent = Map.of(
                    "com.linkedin.ugc.ShareContent", Map.of(
                            "shareCommentary", Map.of("text", caption),
                            "shareMediaCategory", "ARTICLE",
                            "media", media
                    )
            );
        } else {
            // Text-only post (NONE category)
            specificContent = Map.of(
                    "com.linkedin.ugc.ShareContent", Map.of(
                            "shareCommentary", Map.of("text", caption),
                            "shareMediaCategory", "NONE"
                    )
            );
        }

        return Map.of(
                "author", authorUrn,
                "lifecycleState", "PUBLISHED",
                "specificContent", specificContent,
                "visibility", Map.of(
                        "com.linkedin.ugc.MemberNetworkVisibility", "PUBLIC"
                )
        );
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
