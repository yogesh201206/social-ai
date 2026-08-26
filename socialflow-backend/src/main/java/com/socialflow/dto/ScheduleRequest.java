package com.socialflow.dto;

import com.socialflow.entity.Platform;
import com.socialflow.entity.ScheduleStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleRequest {

    private Long postId;

    @NotNull(message = "Restaurant ID is required")
    private Long restaurantId;

    private Long branchId;

    private Platform platform;

    @NotNull(message = "Scheduled date time is required")
    private LocalDateTime scheduledDateTime;

    private String timezone;

    private ScheduleStatus status;
}
