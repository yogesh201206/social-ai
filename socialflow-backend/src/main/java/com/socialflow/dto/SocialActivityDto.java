package com.socialflow.dto;

import com.socialflow.entity.Platform;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialActivityDto {
    private Long id;
    private Long postId;
    private Platform platform;
    private String activityType;
    private String platformActivityId;
    private String actorPlatformId;
    private String actorName;
    private String actorProfileImageUrl;
    private String commentText;
    private LocalDateTime createdAt;
    private LocalDateTime fetchedAt;
}
