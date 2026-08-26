package com.socialflow.controller;

import com.socialflow.dto.AIHistoryRequest;
import com.socialflow.dto.AIHistoryResponse;
import com.socialflow.service.AIHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/history")
@RequiredArgsConstructor
public class AIHistoryController {

    private final AIHistoryService aiHistoryService;

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    @GetMapping
    public ResponseEntity<List<AIHistoryResponse>> getHistory(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(aiHistoryService.getHistory(email, isAdmin(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AIHistoryResponse> getHistoryById(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(aiHistoryService.getHistoryById(id, email, isAdmin(authentication)));
    }

    @PostMapping
    public ResponseEntity<AIHistoryResponse> createHistory(@Valid @RequestBody AIHistoryRequest request, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return new ResponseEntity<>(aiHistoryService.createHistory(request, email), HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHistory(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        aiHistoryService.deleteHistory(id, email, isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }
}
