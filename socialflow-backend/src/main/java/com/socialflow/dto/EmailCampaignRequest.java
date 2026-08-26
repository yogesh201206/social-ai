package com.socialflow.dto;

import com.socialflow.entity.CampaignStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaignRequest {

    @NotBlank(message = "Campaign name is required")
    private String campaignName;

    @NotNull(message = "Restaurant ID is required")
    private Long restaurantId;

    private Long branchId;

    private String audience;

    @NotBlank(message = "Subject is required")
    private String subject;

    private String previewText;

    private String content;

    private String ctaText;

    private String ctaLink;

    private Integer recipientCount;

    private CampaignStatus status;

    private LocalDateTime scheduledAt;
}
