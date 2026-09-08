package com.socialflow.service.publisher;

import java.time.LocalDateTime;

/**
 * Immutable value object representing a single activity item (e.g. comment or reaction)
 * fetched directly from a platform API.
 */
public record SocialActivityItem(
        String platformActivityId,
        String activityType,
        String actorPlatformId,
        String actorName,
        String actorProfileImageUrl,
        String commentText,
        LocalDateTime createdAt
) {
}
