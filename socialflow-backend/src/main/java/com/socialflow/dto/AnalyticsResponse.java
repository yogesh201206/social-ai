package com.socialflow.dto;

import com.socialflow.entity.Platform;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsResponse {
    private Long id;
    private Long restaurantId;
    private String restaurantName;
    private Long branchId;
    private String branchName;
    private Platform platform;
    private LocalDate date;
    private Integer reach;
    private Integer impressions;
    private Integer likes;
    private Integer comments;
    private Integer shares;
    private Integer followers;
    private Double engagementRate;
}
