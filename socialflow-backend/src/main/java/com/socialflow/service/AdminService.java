package com.socialflow.service;

import com.socialflow.dto.AdminDashboardDto;
import com.socialflow.dto.RestaurantResponse;
import com.socialflow.dto.UserResponse;

import java.util.List;

public interface AdminService {
    AdminDashboardDto getDashboardMetrics();
    List<UserResponse> getAllUsers();
    List<RestaurantResponse> getAllRestaurants();
}
