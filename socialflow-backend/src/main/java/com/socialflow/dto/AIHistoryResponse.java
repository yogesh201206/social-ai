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
public class AIHistoryResponse {
    private Long id;
    private Long userId;
    private String userName;
    private Long restaurantId;
    private String restaurantName;
    private ContentType contentType;
    private Platform platform;
    private String model;
    private String prompt;
    private String generatedContent;
    private LocalDateTime createdAt;
}
