package com.socialflow.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardDto {
    private Long totalUsers;
    private Long activeUsers;
    private Long totalRestaurants;
    private Long totalBranches;
    private Long totalPosts;
    private Long scheduledPosts;
    private Long aiGenerations;
    private Long activeCampaigns;
}
