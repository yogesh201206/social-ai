package com.socialflow.dto;

import com.socialflow.entity.CampaignStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaignResponse {
    private Long id;
    private String campaignName;
    private Long restaurantId;
    private String restaurantName;
    private Long branchId;
    private String branchName;
    private String audience;
    private String subject;
    private String previewText;
    private String content;
    private String ctaText;
    private String ctaLink;
    private Integer recipientCount;
    private CampaignStatus status;
    private LocalDateTime scheduledAt;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
