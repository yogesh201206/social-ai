package com.socialflow.controller;

import com.socialflow.dto.AiGenerateRequest;
import com.socialflow.dto.AiGenerateResponse;
import com.socialflow.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    /**
     * Real AI content generation endpoint.
     * Calls Hugging Face Router API from the backend — HF_TOKEN NEVER reaches frontend.
     * Automatically saves successful results to ai_history for the authenticated user.
     *
     * POST /api/ai/generate
     */
    @PostMapping("/generate")
    public ResponseEntity<AiGenerateResponse> generate(
            @Valid @RequestBody AiGenerateRequest request,
            Authentication authentication) {

        String currentUserEmail = authentication.getName();
        AiGenerateResponse response = aiService.generate(request, currentUserEmail);
        return ResponseEntity.ok(response);
    }
}
