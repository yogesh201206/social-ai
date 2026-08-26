package com.socialflow.service;

import com.socialflow.dto.AIHistoryRequest;
import com.socialflow.dto.AIHistoryResponse;

import java.util.List;

public interface AIHistoryService {
    List<AIHistoryResponse> getHistory(String currentUserEmail, boolean isAdmin);
    AIHistoryResponse getHistoryById(Long id, String currentUserEmail, boolean isAdmin);
    AIHistoryResponse createHistory(AIHistoryRequest request, String currentUserEmail);
    void deleteHistory(Long id, String currentUserEmail, boolean isAdmin);
}
