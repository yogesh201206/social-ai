package com.socialflow.dto;

import com.socialflow.entity.ContentType;
import com.socialflow.entity.Platform;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiGenerateResponse {

    private String generatedContent;

    private String model;

    private Long historyId;

    private ContentType contentType;

    private Platform platform;

    private LocalDateTime generatedAt;
}
