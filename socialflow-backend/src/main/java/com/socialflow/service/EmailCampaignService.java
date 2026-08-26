package com.socialflow.service;

import com.socialflow.dto.EmailCampaignRequest;
import com.socialflow.dto.EmailCampaignResponse;

import java.util.List;

public interface EmailCampaignService {
    List<EmailCampaignResponse> getAllCampaigns(String currentUserEmail, boolean isAdmin);
    EmailCampaignResponse getCampaignById(Long id, String currentUserEmail, boolean isAdmin);
    EmailCampaignResponse createCampaign(EmailCampaignRequest request, String currentUserEmail, boolean isAdmin);
    EmailCampaignResponse updateCampaign(Long id, EmailCampaignRequest request, String currentUserEmail, boolean isAdmin);
    void deleteCampaign(Long id, String currentUserEmail, boolean isAdmin);
    EmailCampaignResponse scheduleCampaign(Long id, String scheduledAt, String currentUserEmail, boolean isAdmin);
}
