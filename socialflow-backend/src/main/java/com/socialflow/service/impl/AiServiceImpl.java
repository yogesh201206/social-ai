package com.socialflow.service.impl;

import com.socialflow.config.HuggingFaceConfig;
import com.socialflow.dto.AiGenerateRequest;
import com.socialflow.dto.AiGenerateResponse;
import com.socialflow.entity.*;
import com.socialflow.exception.BadRequestException;
import com.socialflow.exception.ResourceNotFoundException;
import com.socialflow.exception.UnauthorizedException;
import com.socialflow.repository.AIHistoryRepository;
import com.socialflow.repository.RestaurantRepository;
import com.socialflow.repository.UserRepository;
import com.socialflow.service.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiServiceImpl implements AiService {

    private final HuggingFaceConfig huggingFaceConfig;
    private final RestClient restClient;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final AIHistoryRepository aiHistoryRepository;

    @Override
    @Transactional
    public AiGenerateResponse generate(AiGenerateRequest request, String currentUserEmail) {
        // 1. Validate prompt
        if (request.getPrompt() == null || request.getPrompt().isBlank()) {
            throw new BadRequestException("Prompt is required and cannot be empty");
        }

        // 2. Validate HF token is configured
        String hfToken = huggingFaceConfig.getApi().getToken();
        if (hfToken == null || hfToken.isBlank()) {
            throw new BadRequestException(
                    "Hugging Face API token is not configured. Please set the HF_TOKEN environment variable on the backend server."
            );
        }

        // 3. Resolve user from JWT (NEVER from request body)
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserEmail));

        // 4. Validate restaurant ownership if restaurantId is provided
        Restaurant restaurant = null;
        if (request.getRestaurantId() != null) {
            restaurant = restaurantRepository.findById(request.getRestaurantId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Restaurant not found with id: " + request.getRestaurantId()));

            boolean isAdmin = user.getRole() == Role.ADMIN;
            if (!isAdmin && !restaurant.getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
                throw new UnauthorizedException("You are not authorized to use this restaurant's information");
            }
        }

        // 5. Build enriched system + user messages
        String systemPrompt = buildSystemPrompt(request, restaurant);
        String userMessage = request.getPrompt();

        // 6. Call Hugging Face Router API
        String model = huggingFaceConfig.getModel();
        String baseUrl = huggingFaceConfig.getApi().getBaseUrl();
        String endpoint = baseUrl + "/chat/completions";

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userMessage)
                ),
                "max_tokens", 800,
                "temperature", 0.8
        );

        String generatedContent;
        try {
            // NOTE: Authorization header is built here — HF_TOKEN NEVER goes to frontend
            @SuppressWarnings("unchecked")
            Map<String, Object> hfResponse = restClient.post()
                    .uri(endpoint)
                    .header("Authorization", "Bearer " + hfToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            generatedContent = extractContent(hfResponse);

        } catch (HttpClientErrorException e) {
            HttpStatusCode statusCode = e.getStatusCode();
            int statusValue = statusCode.value();
            if (statusValue == 401 || statusValue == 403) {
                log.warn("[AI] Hugging Face authentication failed — check HF_TOKEN configuration");
                throw new BadRequestException("AI service authentication failed. Please check the HF_TOKEN configuration.");
            } else if (statusValue == 429) {
                log.warn("[AI] Hugging Face rate limit reached");
                throw new BadRequestException("AI service rate limit reached. Please wait a moment and try again.");
            } else {
                log.warn("[AI] Hugging Face client error: HTTP {}", statusValue);
                throw new BadRequestException("AI service returned an error: " + statusValue + ". Please try again.");
            }
        } catch (HttpServerErrorException e) {
            log.warn("[AI] Hugging Face server error: HTTP {}", e.getStatusCode().value());
            throw new BadRequestException("AI service is temporarily unavailable. Please try again later.");
        } catch (ResourceAccessException e) {
            log.warn("[AI] Hugging Face connection failed: {}", e.getMessage());
            throw new BadRequestException("Unable to connect to AI service. Please check your internet connection.");
        } catch (Exception e) {
            log.error("[AI] Unexpected error calling Hugging Face API", e);
            throw new BadRequestException("AI service error: " + e.getMessage());
        }

        if (generatedContent == null || generatedContent.isBlank()) {
            throw new BadRequestException("AI service returned an empty response. Please try again.");
        }

        // 7. Auto-save to ai_history (ONLY after successful generation)
        AIHistory history = AIHistory.builder()
                .user(user)
                .restaurant(restaurant)
                .contentType(request.getContentType())
                .platform(request.getPlatform())
                .model(model)
                .prompt(request.getPrompt())
                .generatedContent(generatedContent)
                .build();

        AIHistory saved = aiHistoryRepository.save(history);
        log.info("[AI] Generated content saved to ai_history id={} for user={}", saved.getId(), currentUserEmail);

        // 8. Return response to frontend
        return AiGenerateResponse.builder()
                .generatedContent(generatedContent)
                .model(model)
                .historyId(saved.getId())
                .contentType(request.getContentType())
                .platform(request.getPlatform())
                .generatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * Builds a rich system prompt giving the AI restaurant marketing context.
     */
    private String buildSystemPrompt(AiGenerateRequest request, Restaurant restaurant) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert social media marketing assistant specializing in restaurant marketing. ");
        sb.append("Your task is to generate engaging, platform-appropriate marketing content. ");
        sb.append("Always write in a friendly, professional tone suitable for food businesses.\n\n");

        // Add restaurant context
        if (restaurant != null) {
            sb.append("Restaurant Context:\n");
            sb.append("- Name: ").append(restaurant.getName()).append("\n");
            if (restaurant.getCategory() != null) sb.append("- Category: ").append(restaurant.getCategory()).append("\n");
            if (restaurant.getDescription() != null) sb.append("- Description: ").append(restaurant.getDescription()).append("\n");
            if (restaurant.getAddress() != null) sb.append("- Location: ").append(restaurant.getAddress()).append("\n");
        } else {
            // Use form fields if no restaurant entity
            if (request.getRestaurantName() != null && !request.getRestaurantName().isBlank()) {
                sb.append("Restaurant Name: ").append(request.getRestaurantName()).append("\n");
            }
            if (request.getCategory() != null && !request.getCategory().isBlank()) {
                sb.append("Restaurant Category: ").append(request.getCategory()).append("\n");
            }
            if (request.getLocation() != null && !request.getLocation().isBlank()) {
                sb.append("Location: ").append(request.getLocation()).append("\n");
            }
            if (request.getAudience() != null && !request.getAudience().isBlank()) {
                sb.append("Target Audience: ").append(request.getAudience()).append("\n");
            }
        }

        // Add content type guidance
        if (request.getContentType() != null) {
            sb.append("\nContent Type Requested: ").append(request.getContentType().name()).append("\n");
            switch (request.getContentType()) {
                case Caption -> sb.append("Generate an engaging social media caption with emojis.\n");
                case Hashtags -> sb.append("Generate 15-20 relevant hashtags. Format as space-separated hashtags starting with #.\n");
                case CTA -> sb.append("Generate a compelling call-to-action for the restaurant.\n");
                case Marketing_Idea -> sb.append("Generate a creative marketing campaign idea with execution steps.\n");
                case Email_Content -> sb.append("Generate professional email marketing content with subject line and body.\n");
            }
        }

        // Add platform guidance
        if (request.getPlatform() != null) {
            sb.append("Target Platform: ").append(request.getPlatform().name()).append("\n");
            switch (request.getPlatform()) {
                case INSTAGRAM -> sb.append("Optimize for Instagram: use emojis, max 2200 chars, include hashtag block.\n");
                case FACEBOOK -> sb.append("Optimize for Facebook: conversational tone, can be longer, include a question.\n");
                case TWITTER -> sb.append("Optimize for X/Twitter: concise, max 280 characters, punchy.\n");
                case TIKTOK -> sb.append("Optimize for TikTok: trendy, energetic, include video hook idea.\n");
                case YOUTUBE -> sb.append("Optimize for YouTube: include description, keywords, and CTA to subscribe.\n");
            }
        }

        sb.append("\nRespond ONLY with the requested content — no meta-commentary, no 'here is your caption' intro.");

        return sb.toString();
    }

    /**
     * Safely extracts content from Hugging Face response structure.
     * Expected: choices[0].message.content
     */
    @SuppressWarnings("unchecked")
    private String extractContent(Map<String, Object> response) {
        if (response == null) return null;
        Object choices = response.get("choices");
        if (!(choices instanceof List<?> choiceList) || choiceList.isEmpty()) return null;

        Object first = choiceList.get(0);
        if (!(first instanceof Map<?, ?> choice)) return null;

        Object message = choice.get("message");
        if (!(message instanceof Map<?, ?> msg)) return null;

        Object content = msg.get("content");
        return content instanceof String s ? s.trim() : null;
    }
}
