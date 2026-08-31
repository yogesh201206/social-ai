package com.socialflow.dto;

import com.socialflow.entity.ContentType;
import com.socialflow.entity.Platform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiGenerateRequest {

    @NotBlank(message = "Prompt is required")
    @Size(max = 2000, message = "Prompt must not exceed 2000 characters")
    private String prompt;

    private Long restaurantId;

    private Long branchId;

    private ContentType contentType;

    private Platform platform;

    // Additional context fields from the AI form
    private String restaurantName;

    private String category;

    private String audience;

    private String location;
}
