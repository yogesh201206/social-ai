package com.socialflow.dto;

import com.socialflow.entity.ContentType;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIHistoryRequest {

    private Long restaurantId;

    private ContentType contentType;

    @NotBlank(message = "Prompt is required")
    private String prompt;

    @NotBlank(message = "Generated content is required")
    private String generatedContent;
}
