package com.socialflow.controller;

import com.socialflow.dto.ScheduleRequest;
import com.socialflow.dto.ScheduleResponse;
import com.socialflow.service.ScheduledPostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class SchedulerController {

    private final ScheduledPostService scheduledPostService;

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equalsIgnoreCase(a.getAuthority()) || "ADMIN".equalsIgnoreCase(a.getAuthority()));
    }

    @GetMapping
    public ResponseEntity<List<ScheduleResponse>> getAllSchedules(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(scheduledPostService.getAllSchedules(email, isAdmin(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScheduleResponse> getScheduleById(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(scheduledPostService.getScheduleById(id, email, isAdmin(authentication)));
    }

    @PostMapping
    public ResponseEntity<ScheduleResponse> createSchedule(@Valid @RequestBody ScheduleRequest request, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return new ResponseEntity<>(scheduledPostService.createSchedule(request, email, isAdmin(authentication)), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScheduleResponse> updateSchedule(@PathVariable Long id, @RequestBody ScheduleRequest request, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(scheduledPostService.updateSchedule(id, request, email, isAdmin(authentication)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        scheduledPostService.deleteSchedule(id, email, isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ScheduleResponse> cancelSchedule(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(scheduledPostService.cancelSchedule(id, email, isAdmin(authentication)));
    }
}
