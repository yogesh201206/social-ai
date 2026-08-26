package com.socialflow.controller;

import com.socialflow.dto.EmailCampaignRequest;
import com.socialflow.dto.EmailCampaignResponse;
import com.socialflow.service.EmailCampaignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/email-campaigns")
@RequiredArgsConstructor
public class EmailCampaignController {

    private final EmailCampaignService emailCampaignService;

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    @GetMapping
    public ResponseEntity<List<EmailCampaignResponse>> getAllCampaigns(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(emailCampaignService.getAllCampaigns(email, isAdmin(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmailCampaignResponse> getCampaignById(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(emailCampaignService.getCampaignById(id, email, isAdmin(authentication)));
    }

    @PostMapping
    public ResponseEntity<EmailCampaignResponse> createCampaign(@Valid @RequestBody EmailCampaignRequest request, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return new ResponseEntity<>(emailCampaignService.createCampaign(request, email, isAdmin(authentication)), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmailCampaignResponse> updateCampaign(@PathVariable Long id, @RequestBody EmailCampaignRequest request, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(emailCampaignService.updateCampaign(id, request, email, isAdmin(authentication)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCampaign(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        emailCampaignService.deleteCampaign(id, email, isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/schedule")
    public ResponseEntity<EmailCampaignResponse> scheduleCampaign(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        String scheduledAt = body != null ? body.get("scheduledAt") : null;
        return ResponseEntity.ok(emailCampaignService.scheduleCampaign(id, scheduledAt, email, isAdmin(authentication)));
    }
}
