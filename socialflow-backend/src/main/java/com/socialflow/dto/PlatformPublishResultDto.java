package com.socialflow.dto;

import com.socialflow.entity.Platform;
import com.socialflow.entity.PostStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformPublishResultDto {
    private Platform platform;
    private PostStatus status;
    private Long postId;
    private String platformPostId;
    private String externalUrl;
    private String error;
    private String message;
}
