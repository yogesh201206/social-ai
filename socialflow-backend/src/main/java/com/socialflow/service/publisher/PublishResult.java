package com.socialflow.service.publisher;

/**
 * Result of a social media publish attempt.
 *
 * @param success         true only when the platform confirmed the post was published
 * @param platformPostId  the post ID returned by the platform (null on failure)
 * @param errorMessage    human-readable error message (null on success)
 */
public record PublishResult(
        boolean success,
        String platformPostId,
        String errorMessage
) {
    public static PublishResult success(String platformPostId) {
        return new PublishResult(true, platformPostId, null);
    }

    public static PublishResult failure(String errorMessage) {
        return new PublishResult(false, null, errorMessage);
    }
}
