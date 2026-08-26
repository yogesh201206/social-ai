package com.socialflow.service.impl;

import com.socialflow.dto.AIHistoryRequest;
import com.socialflow.dto.AIHistoryResponse;
import com.socialflow.entity.AIHistory;
import com.socialflow.entity.Restaurant;
import com.socialflow.entity.User;
import com.socialflow.exception.ResourceNotFoundException;
import com.socialflow.exception.UnauthorizedException;
import com.socialflow.repository.AIHistoryRepository;
import com.socialflow.repository.RestaurantRepository;
import com.socialflow.repository.UserRepository;
import com.socialflow.service.AIHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AIHistoryServiceImpl implements AIHistoryService {

    private final AIHistoryRepository aiHistoryRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;

    @Override
    public List<AIHistoryResponse> getHistory(String currentUserEmail, boolean isAdmin) {
        List<AIHistory> list;
        if (isAdmin) {
            list = aiHistoryRepository.findAll();
        } else {
            list = aiHistoryRepository.findByUserEmail(currentUserEmail);
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public AIHistoryResponse getHistoryById(Long id, String currentUserEmail, boolean isAdmin) {
        AIHistory history = aiHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AI History record not found with id: " + id));

        if (!isAdmin && !history.getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        return mapToResponse(history);
    }

    @Override
    @Transactional
    public AIHistoryResponse createHistory(AIHistoryRequest request, String currentUserEmail) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserEmail));

        Restaurant restaurant = null;
        if (request.getRestaurantId() != null) {
            restaurant = restaurantRepository.findById(request.getRestaurantId()).orElse(null);
        }

        AIHistory history = AIHistory.builder()
                .user(user)
                .restaurant(restaurant)
                .contentType(request.getContentType())
                .prompt(request.getPrompt())
                .generatedContent(request.getGeneratedContent())
                .build();

        return mapToResponse(aiHistoryRepository.save(history));
    }

    @Override
    @Transactional
    public void deleteHistory(Long id, String currentUserEmail, boolean isAdmin) {
        AIHistory history = aiHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AI History record not found with id: " + id));

        if (!isAdmin && !history.getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        aiHistoryRepository.delete(history);
    }

    private AIHistoryResponse mapToResponse(AIHistory h) {
        return AIHistoryResponse.builder()
                .id(h.getId())
                .userId(h.getUser().getId())
                .userName(h.getUser().getName())
                .restaurantId(h.getRestaurant() != null ? h.getRestaurant().getId() : null)
                .restaurantName(h.getRestaurant() != null ? h.getRestaurant().getName() : null)
                .contentType(h.getContentType())
                .prompt(h.getPrompt())
                .generatedContent(h.getGeneratedContent())
                .createdAt(h.getCreatedAt())
                .build();
    }
}
