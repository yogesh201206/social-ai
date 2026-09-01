package com.socialflow.service.publisher;

/**
 * Result of fetching real performance metrics from a social platform.
 *
 * @param success       true if API call succeeded and metrics were parsed
 * @param likes         real like count (null if unsupported/unavailable)
 * @param comments      real comment/reply count (null if unsupported/unavailable)
 * @param shares        real share/repost count (null if unsupported/unavailable)
 * @param views         real view/impression count (null if unsupported/unavailable)
 * @param metricsStatus status string: AVAILABLE, NOT_FETCHED, NOT_SUPPORTED, PERMISSION_REQUIRED, API_ERROR
 * @param errorMessage  error message if metricsStatus is API_ERROR or PERMISSION_REQUIRED
 */
public record MetricsResult(
        boolean success,
        Long likes,
        Long comments,
        Long shares,
        Long views,
        String metricsStatus,
        String errorMessage
) {
    public static MetricsResult available(Long likes, Long comments, Long shares, Long views) {
        return new MetricsResult(true, likes, comments, shares, views, "AVAILABLE", null);
    }

    public static MetricsResult notSupported(String reason) {
        return new MetricsResult(false, null, null, null, null, "NOT_SUPPORTED", reason);
    }

    public static MetricsResult permissionRequired(String reason) {
        return new MetricsResult(false, null, null, null, null, "PERMISSION_REQUIRED", reason);
    }

    public static MetricsResult notFetched(String reason) {
        return new MetricsResult(false, null, null, null, null, "NOT_FETCHED", reason);
    }

    public static MetricsResult error(String errorMessage) {
        return new MetricsResult(false, null, null, null, null, "API_ERROR", errorMessage);
    }
}
