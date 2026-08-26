package com.socialflow.service;

import com.socialflow.dto.AnalyticsOverviewDto;
import com.socialflow.dto.AnalyticsResponse;
import com.socialflow.entity.Platform;

import java.util.List;

public interface AnalyticsService {
    AnalyticsOverviewDto getOverview(Long restaurantId, Long branchId, String currentUserEmail, boolean isAdmin);
    List<AnalyticsResponse> getPlatformAnalytics(Long restaurantId, Platform platform, String currentUserEmail, boolean isAdmin);
    List<AnalyticsResponse> getPostAnalytics(Long restaurantId, String currentUserEmail, boolean isAdmin);
}
