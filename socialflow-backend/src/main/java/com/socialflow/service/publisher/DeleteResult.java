package com.socialflow.service.publisher;

/**
 * Result of a social media post delete operation.
 *
 * @param success      true only when the platform confirmed the post was deleted (or 404 already deleted)
 * @param errorMessage human-readable error message (null on success)
 */
public record DeleteResult(
        boolean success,
        String errorMessage
) {
    public static DeleteResult succeeded() {
        return new DeleteResult(true, null);
    }

    public static DeleteResult failure(String errorMessage) {
        return new DeleteResult(false, errorMessage);
    }

    public static DeleteResult failed(String errorMessage) {
        return new DeleteResult(false, errorMessage);
    }
}
