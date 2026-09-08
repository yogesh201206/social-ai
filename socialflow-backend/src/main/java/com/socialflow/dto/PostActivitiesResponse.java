package com.socialflow.dto;

import com.socialflow.entity.Platform;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostActivitiesResponse {
    private Long postId;
    private Platform platform;
    /**
     * AVAILABLE, NOT_FETCHED, NOT_SUPPORTED, PERMISSION_REQUIRED, API_ERROR
     */
    private String status;
    private String message;
    private List<SocialActivityDto> activities;
    private int totalActivities;
    private LocalDateTime fetchedAt;
}
