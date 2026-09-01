package com.socialflow.dto;

import com.socialflow.entity.Platform;
import com.socialflow.entity.PostStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String caption;
    private String imageUrl;
    private String mediaPath;
    private String mediaType;
    private String originalFileName;
    private String hashtags;

    @NotNull(message = "Platform is required")
    private Platform platform;

    @NotNull(message = "Restaurant ID is required")
    private Long restaurantId;

    private Long branchId;

    private PostStatus status;

    private LocalDateTime scheduledAt;
    private String timezone;
}
