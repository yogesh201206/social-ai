package com.socialflow.service.publisher;

/**
 * Result of a social media publish attempt.
 *
 * @param success         true only when the platform confirmed the post was published
 * @param platformPostId  the post ID returned by the platform (null on failure)
 * @param errorMessage    human-readable error message (null on success)
 * @param platformPostUrl direct external permalink returned by the platform (null on failure or if unsupported)
 */
public record PublishResult(
        boolean success,
        String platformPostId,
        String errorMessage,
        String platformPostUrl
) {
    public static PublishResult success(String platformPostId) {
        return new PublishResult(true, platformPostId, null, null);
    }

    public static PublishResult success(String platformPostId, String platformPostUrl) {
        return new PublishResult(true, platformPostId, null, platformPostUrl);
    }

    public static PublishResult failure(String errorMessage) {
        return new PublishResult(false, null, errorMessage, null);
    }
}
