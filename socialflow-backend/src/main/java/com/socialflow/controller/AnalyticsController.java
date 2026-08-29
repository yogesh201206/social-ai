package com.socialflow.controller;

import com.socialflow.dto.AnalyticsOverviewDto;
import com.socialflow.dto.AnalyticsResponse;
import com.socialflow.entity.Platform;
import com.socialflow.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equalsIgnoreCase(a.getAuthority()) || "ADMIN".equalsIgnoreCase(a.getAuthority()));
    }

    @GetMapping("/overview")
    public ResponseEntity<AnalyticsOverviewDto> getOverview(
            @RequestParam(required = false) Long restaurantId,
            @RequestParam(required = false) Long branchId,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(analyticsService.getOverview(restaurantId, branchId, email, isAdmin(authentication)));
    }

    @GetMapping("/platforms")
    public ResponseEntity<List<AnalyticsResponse>> getPlatformAnalytics(
            @RequestParam(required = false) Long restaurantId,
            @RequestParam(required = false) Platform platform,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(analyticsService.getPlatformAnalytics(restaurantId, platform, email, isAdmin(authentication)));
    }

    @GetMapping("/posts")
    public ResponseEntity<List<AnalyticsResponse>> getPostAnalytics(
            @RequestParam(required = false) Long restaurantId,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(analyticsService.getPostAnalytics(restaurantId, email, isAdmin(authentication)));
    }
}
