package com.socialflow.dto;

import com.socialflow.entity.Platform;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostMetricsDto {
    private Long postId;
    private Platform platform;
    private String platformPostId;
    private Long likes;
    private Long comments;
    private Long shares;
    private Long views;
    private Long impressions;
    private Long reach;
    private Double engagement;
    private String metricsStatus;
    private String errorMessage;
    private LocalDateTime lastUpdated;
    private String externalUrl;
}
