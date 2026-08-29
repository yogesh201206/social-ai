package com.socialflow.service.impl;

import com.socialflow.dto.AdminDashboardDto;
import com.socialflow.dto.RestaurantResponse;
import com.socialflow.dto.UserResponse;
import com.socialflow.entity.UserStatus;
import com.socialflow.repository.*;
import com.socialflow.service.AdminService;
import com.socialflow.service.RestaurantService;
import com.socialflow.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final BranchRepository branchRepository;
    private final PostRepository postRepository;
    private final ScheduledPostRepository scheduledPostRepository;
    private final AIHistoryRepository aiHistoryRepository;
    private final EmailCampaignRepository emailCampaignRepository;
    private final UserService userService;
    private final RestaurantService restaurantService;

    @Override
    public AdminDashboardDto getDashboardMetrics() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.findAll().stream()
                .filter(u -> u.getStatus() == UserStatus.ACTIVE).count();
        long totalRestaurants = restaurantRepository.count();
        long totalBranches = branchRepository.count();
        long totalPosts = postRepository.count();
        long scheduledPosts = scheduledPostRepository.count();
        long aiGenerations = aiHistoryRepository.count();
        long activeCampaigns = emailCampaignRepository.count();

        return AdminDashboardDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .totalRestaurants(totalRestaurants)
                .totalBranches(totalBranches)
                .totalPosts(totalPosts)
                .scheduledPosts(scheduledPosts)
                .aiGenerations(aiGenerations)
                .activeCampaigns(activeCampaigns)
                .build();
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    @Override
    public List<RestaurantResponse> getAllRestaurants() {
        return restaurantService.getAllRestaurants(null, true);
    }
}
