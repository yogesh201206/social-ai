package com.socialflow.service.impl;

import com.socialflow.dto.BranchRequest;
import com.socialflow.dto.BranchResponse;
import com.socialflow.dto.RestaurantRequest;
import com.socialflow.dto.RestaurantResponse;
import com.socialflow.entity.Branch;
import com.socialflow.entity.Restaurant;
import com.socialflow.entity.User;
import com.socialflow.exception.ResourceNotFoundException;
import com.socialflow.exception.UnauthorizedException;
import com.socialflow.repository.BranchRepository;
import com.socialflow.repository.RestaurantRepository;
import com.socialflow.repository.UserRepository;
import com.socialflow.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RestaurantServiceImpl implements RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;

    @Override
    public List<RestaurantResponse> getAllRestaurants(String currentUserEmail, boolean isAdmin) {
        List<Restaurant> list;
        if (isAdmin) {
            list = restaurantRepository.findAll();
        } else {
            list = restaurantRepository.findByOwnerEmail(currentUserEmail);
        }
        return list.stream().map(this::mapToRestaurantResponse).collect(Collectors.toList());
    }

    @Override
    public RestaurantResponse getRestaurantById(Long id, String currentUserEmail, boolean isAdmin) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));

        if (!isAdmin && !restaurant.getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("You are not authorized to view this restaurant");
        }

        return mapToRestaurantResponse(restaurant);
    }

    @Override
    @Transactional
    public RestaurantResponse createRestaurant(RestaurantRequest request, String currentUserEmail) {
        User owner = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserEmail));

        Restaurant restaurant = Restaurant.builder()
                .name(request.getName())
                .category(request.getCategory())
                .businessType(request.getBusinessType())
                .description(request.getDescription())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .owner(owner)
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();

        Restaurant saved = restaurantRepository.save(restaurant);
        return mapToRestaurantResponse(saved);
    }

    @Override
    @Transactional
    public RestaurantResponse updateRestaurant(Long id, RestaurantRequest request, String currentUserEmail, boolean isAdmin) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));

        if (!isAdmin && !restaurant.getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("You are not authorized to update this restaurant");
        }

        if (request.getName() != null) restaurant.setName(request.getName());
        if (request.getCategory() != null) restaurant.setCategory(request.getCategory());
        if (request.getBusinessType() != null) restaurant.setBusinessType(request.getBusinessType());
        if (request.getDescription() != null) restaurant.setDescription(request.getDescription());
        if (request.getPhone() != null) restaurant.setPhone(request.getPhone());
        if (request.getEmail() != null) restaurant.setEmail(request.getEmail());
        if (request.getAddress() != null) restaurant.setAddress(request.getAddress());
        if (request.getStatus() != null) restaurant.setStatus(request.getStatus());

        return mapToRestaurantResponse(restaurantRepository.save(restaurant));
    }

    @Override
    @Transactional
    public void deleteRestaurant(Long id, String currentUserEmail, boolean isAdmin) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));

        if (!isAdmin && !restaurant.getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("You are not authorized to delete this restaurant");
        }

        restaurantRepository.delete(restaurant);
    }

    @Override
    public List<BranchResponse> getBranchesByRestaurantId(Long restaurantId, String currentUserEmail, boolean isAdmin) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));

        if (!isAdmin && !restaurant.getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        return branchRepository.findByRestaurantId(restaurantId).stream()
                .map(this::mapToBranchResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BranchResponse addBranch(Long restaurantId, BranchRequest request, String currentUserEmail, boolean isAdmin) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));

        if (!isAdmin && !restaurant.getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        Branch branch = Branch.builder()
                .branchName(request.getBranchName())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .phone(request.getPhone())
                .restaurant(restaurant)
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();

        return mapToBranchResponse(branchRepository.save(branch));
    }

    private RestaurantResponse mapToRestaurantResponse(Restaurant r) {
        List<BranchResponse> branches = branchRepository.findByRestaurantId(r.getId()).stream()
                .map(this::mapToBranchResponse)
                .collect(Collectors.toList());

        return RestaurantResponse.builder()
                .id(r.getId())
                .name(r.getName())
                .category(r.getCategory())
                .businessType(r.getBusinessType())
                .description(r.getDescription())
                .phone(r.getPhone())
                .email(r.getEmail())
                .address(r.getAddress())
                .ownerId(r.getOwner().getId())
                .ownerName(r.getOwner().getName())
                .status(r.getStatus())
                .branches(branches)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private BranchResponse mapToBranchResponse(Branch b) {
        return BranchResponse.builder()
                .id(b.getId())
                .branchName(b.getBranchName())
                .address(b.getAddress())
                .city(b.getCity())
                .state(b.getState())
                .phone(b.getPhone())
                .restaurantId(b.getRestaurant().getId())
                .status(b.getStatus())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
