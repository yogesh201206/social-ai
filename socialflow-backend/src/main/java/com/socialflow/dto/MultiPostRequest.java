package com.socialflow.dto;

import com.socialflow.entity.Platform;
import com.socialflow.entity.PostStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MultiPostRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String caption;
    private String imageUrl;
    private String mediaPath;
    private String mediaType;
    private String originalFileName;
    private String hashtags;

    @NotEmpty(message = "At least one platform must be selected")
    private List<Platform> platforms;

    @NotNull(message = "Restaurant ID is required")
    private Long restaurantId;

    private Long branchId;

    private PostStatus status;

    private LocalDateTime scheduledAt;
    private String timezone;

    private Boolean publishNow;
}
