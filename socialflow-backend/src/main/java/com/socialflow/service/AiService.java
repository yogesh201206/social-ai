package com.socialflow.service;

import com.socialflow.dto.AiGenerateRequest;
import com.socialflow.dto.AiGenerateResponse;

public interface AiService {

    /**
     * Generates AI content by calling the Hugging Face Router API.
     * Automatically saves the result to ai_history for the authenticated user.
     *
     * @param request          the generation request (prompt, context fields)
     * @param currentUserEmail the authenticated user's email (from JWT — never from request body)
     * @return the generated content and metadata
     */
    AiGenerateResponse generate(AiGenerateRequest request, String currentUserEmail);
}
