package com.socialflow.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsOverviewDto {
    private Integer totalReach;
    private Integer totalImpressions;
    private Integer totalLikes;
    private Integer totalComments;
    private Integer totalShares;
    private Integer totalFollowers;
    private Double averageEngagementRate;
    private Integer totalPosts;
}
