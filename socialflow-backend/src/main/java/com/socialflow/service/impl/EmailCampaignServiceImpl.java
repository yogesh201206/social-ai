package com.socialflow.service.impl;

import com.socialflow.dto.EmailCampaignRequest;
import com.socialflow.dto.EmailCampaignResponse;
import com.socialflow.entity.Branch;
import com.socialflow.entity.CampaignStatus;
import com.socialflow.entity.EmailCampaign;
import com.socialflow.entity.Restaurant;
import com.socialflow.exception.ResourceNotFoundException;
import com.socialflow.exception.UnauthorizedException;
import com.socialflow.repository.BranchRepository;
import com.socialflow.repository.EmailCampaignRepository;
import com.socialflow.repository.RestaurantRepository;
import com.socialflow.service.EmailCampaignService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmailCampaignServiceImpl implements EmailCampaignService {

    private final EmailCampaignRepository emailCampaignRepository;
    private final RestaurantRepository restaurantRepository;
    private final BranchRepository branchRepository;

    @Override
    public List<EmailCampaignResponse> getAllCampaigns(String currentUserEmail, boolean isAdmin) {
        List<EmailCampaign> list;
        if (isAdmin) {
            list = emailCampaignRepository.findAll();
        } else {
            list = emailCampaignRepository.findByRestaurantOwnerEmail(currentUserEmail);
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public EmailCampaignResponse getCampaignById(Long id, String currentUserEmail, boolean isAdmin) {
        EmailCampaign campaign = emailCampaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Email Campaign not found with id: " + id));

        if (!isAdmin && !campaign.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        return mapToResponse(campaign);
    }

    @Override
    @Transactional
    public EmailCampaignResponse createCampaign(EmailCampaignRequest request, String currentUserEmail, boolean isAdmin) {
        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + request.getRestaurantId()));

        if (!isAdmin && !restaurant.getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        Branch branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId()).orElse(null);
        }

        EmailCampaign campaign = EmailCampaign.builder()
                .campaignName(request.getCampaignName())
                .restaurant(restaurant)
                .branch(branch)
                .audience(request.getAudience())
                .subject(request.getSubject())
                .previewText(request.getPreviewText())
                .content(request.getContent())
                .ctaText(request.getCtaText())
                .ctaLink(request.getCtaLink())
                .recipientCount(request.getRecipientCount() != null ? request.getRecipientCount() : 0)
                .status(request.getStatus() != null ? request.getStatus() : CampaignStatus.DRAFT)
                .scheduledAt(request.getScheduledAt())
                .build();

        return mapToResponse(emailCampaignRepository.save(campaign));
    }

    @Override
    @Transactional
    public EmailCampaignResponse updateCampaign(Long id, EmailCampaignRequest request, String currentUserEmail, boolean isAdmin) {
        EmailCampaign campaign = emailCampaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Email Campaign not found with id: " + id));

        if (!isAdmin && !campaign.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        if (request.getCampaignName() != null) campaign.setCampaignName(request.getCampaignName());
        if (request.getAudience() != null) campaign.setAudience(request.getAudience());
        if (request.getSubject() != null) campaign.setSubject(request.getSubject());
        if (request.getPreviewText() != null) campaign.setPreviewText(request.getPreviewText());
        if (request.getContent() != null) campaign.setContent(request.getContent());
        if (request.getCtaText() != null) campaign.setCtaText(request.getCtaText());
        if (request.getCtaLink() != null) campaign.setCtaLink(request.getCtaLink());
        if (request.getRecipientCount() != null) campaign.setRecipientCount(request.getRecipientCount());
        if (request.getStatus() != null) campaign.setStatus(request.getStatus());
        if (request.getScheduledAt() != null) campaign.setScheduledAt(request.getScheduledAt());

        return mapToResponse(emailCampaignRepository.save(campaign));
    }

    @Override
    @Transactional
    public void deleteCampaign(Long id, String currentUserEmail, boolean isAdmin) {
        EmailCampaign campaign = emailCampaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Email Campaign not found with id: " + id));

        if (!isAdmin && !campaign.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        emailCampaignRepository.delete(campaign);
    }

    @Override
    @Transactional
    public EmailCampaignResponse scheduleCampaign(Long id, String scheduledAt, String currentUserEmail, boolean isAdmin) {
        EmailCampaign campaign = emailCampaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Email Campaign not found with id: " + id));

        if (!isAdmin && !campaign.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        campaign.setStatus(CampaignStatus.SCHEDULED);
        if (scheduledAt != null) {
            campaign.setScheduledAt(LocalDateTime.parse(scheduledAt));
        }
        return mapToResponse(emailCampaignRepository.save(campaign));
    }

    private EmailCampaignResponse mapToResponse(EmailCampaign c) {
        return EmailCampaignResponse.builder()
                .id(c.getId())
                .campaignName(c.getCampaignName())
                .restaurantId(c.getRestaurant().getId())
                .restaurantName(c.getRestaurant().getName())
                .branchId(c.getBranch() != null ? c.getBranch().getId() : null)
                .branchName(c.getBranch() != null ? c.getBranch().getBranchName() : null)
                .audience(c.getAudience())
                .subject(c.getSubject())
                .previewText(c.getPreviewText())
                .content(c.getContent())
                .ctaText(c.getCtaText())
                .ctaLink(c.getCtaLink())
                .recipientCount(c.getRecipientCount())
                .status(c.getStatus())
                .scheduledAt(c.getScheduledAt())
                .sentAt(c.getSentAt())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
