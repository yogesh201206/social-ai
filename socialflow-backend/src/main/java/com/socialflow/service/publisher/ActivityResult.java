package com.socialflow.service.publisher;

import java.util.Collections;
import java.util.List;

/**
 * Result object returned when fetching activities (comments, interactions) from a social media platform.
 *
 * @param success     true if activities were successfully queried (even if 0 comments returned)
 * @param activities  list of real activities returned by the platform API
 * @param status      AVAILABLE, NOT_FETCHED, NOT_SUPPORTED, PERMISSION_REQUIRED, API_ERROR
 * @param message     human-readable explanation or sanitized error message
 */
public record ActivityResult(
        boolean success,
        List<SocialActivityItem> activities,
        String status,
        String message
) {
    public static ActivityResult available(List<SocialActivityItem> activities) {
        return new ActivityResult(true, activities != null ? activities : Collections.emptyList(), "AVAILABLE", null);
    }

    public static ActivityResult notFetched(String message) {
        return new ActivityResult(false, Collections.emptyList(), "NOT_FETCHED", message);
    }

    public static ActivityResult notSupported(String message) {
        return new ActivityResult(false, Collections.emptyList(), "NOT_SUPPORTED", message);
    }

    public static ActivityResult permissionRequired(String message) {
        return new ActivityResult(false, Collections.emptyList(), "PERMISSION_REQUIRED", message);
    }

    public static ActivityResult apiError(String message) {
        return new ActivityResult(false, Collections.emptyList(), "API_ERROR", message);
    }
}
