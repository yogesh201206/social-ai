package com.socialflow.dto;

import com.socialflow.entity.Platform;
import com.socialflow.entity.ScheduleStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleResponse {
    private Long id;
    private Long postId;
    private String postTitle;
    private Long restaurantId;
    private String restaurantName;
    private Long branchId;
    private String branchName;
    private Platform platform;
    private LocalDateTime scheduledDateTime;
    private String timezone;
    private ScheduleStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
