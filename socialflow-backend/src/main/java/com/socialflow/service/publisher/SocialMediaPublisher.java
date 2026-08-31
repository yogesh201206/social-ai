package com.socialflow.service.publisher;

import com.socialflow.entity.Post;
import com.socialflow.entity.SocialAccount;

/**
 * Contract for publishing a post to a social media platform.
 * Each platform gets its own implementation.
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
}
