package com.socialflow.controller;

import com.socialflow.dto.AdminDashboardDto;
import com.socialflow.dto.RestaurantResponse;
import com.socialflow.dto.UserResponse;
import com.socialflow.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardDto> getDashboardMetrics() {
        return ResponseEntity.ok(adminService.getDashboardMetrics());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/restaurants")
    public ResponseEntity<List<RestaurantResponse>> getAllRestaurants() {
        return ResponseEntity.ok(adminService.getAllRestaurants());
    }

    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getAdminReports() {
        Map<String, Object> reports = new HashMap<>();
        reports.put("metrics", adminService.getDashboardMetrics());
        reports.put("generatedAt", java.time.LocalDateTime.now());
        reports.put("status", "SUCCESS");
        return ResponseEntity.ok(reports);
    }
}
