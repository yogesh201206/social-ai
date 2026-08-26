package com.socialflow.service;

import com.socialflow.dto.BranchRequest;
import com.socialflow.dto.BranchResponse;
import com.socialflow.dto.RestaurantRequest;
import com.socialflow.dto.RestaurantResponse;

import java.util.List;

public interface RestaurantService {
    List<RestaurantResponse> getAllRestaurants(String currentUserEmail, boolean isAdmin);
    RestaurantResponse getRestaurantById(Long id, String currentUserEmail, boolean isAdmin);
    RestaurantResponse createRestaurant(RestaurantRequest request, String currentUserEmail);
    RestaurantResponse updateRestaurant(Long id, RestaurantRequest request, String currentUserEmail, boolean isAdmin);
    void deleteRestaurant(Long id, String currentUserEmail, boolean isAdmin);
    
    List<BranchResponse> getBranchesByRestaurantId(Long restaurantId, String currentUserEmail, boolean isAdmin);
    BranchResponse addBranch(Long restaurantId, BranchRequest request, String currentUserEmail, boolean isAdmin);
}
