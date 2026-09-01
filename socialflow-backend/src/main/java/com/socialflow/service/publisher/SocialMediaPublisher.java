package com.socialflow.service.publisher;

import com.socialflow.entity.Post;
import com.socialflow.entity.SocialAccount;

/**
 * Contract for interacting with a connected social media platform:
 * publishing, platform deletion, and real performance metrics.
 */
public interface SocialMediaPublisher {

    /**
     * Publishes the given post using the connected social account.
     *
     * @param post    the post to publish (caption, imageUrl, hashtags, etc.)
     * @param account the connected social account with valid access token
     * @return PublishResult with platformPostId on success, or error message on failure
     */
    PublishResult publish(Post post, SocialAccount account);

    /**
     * Deletes the post from the external social media platform.
     *
     * @param post    the post with a non-null platformPostId
     * @param account the connected social account with valid access token
     * @return DeleteResult with success=true if deleted (or 404), or error message on failure
     */
    DeleteResult delete(Post post, SocialAccount account);

    /**
     * Fetches real performance metrics from the social media platform.
     *
     * @param post    the post with a non-null platformPostId
     * @param account the connected social account with valid access token
     * @return MetricsResult containing real counts and metricsStatus (AVAILABLE, PERMISSION_REQUIRED, etc.)
     */
    MetricsResult fetchMetrics(Post post, SocialAccount account);
}
