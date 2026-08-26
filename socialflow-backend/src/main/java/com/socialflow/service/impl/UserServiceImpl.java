package com.socialflow.service.impl;

import com.socialflow.dto.UserResponse;
import com.socialflow.dto.UserUpdateRequest;
import com.socialflow.entity.User;
import com.socialflow.entity.UserStatus;
import com.socialflow.exception.ResourceNotFoundException;
import com.socialflow.repository.UserRepository;
import com.socialflow.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getBusinessName() != null) user.setBusinessName(request.getBusinessName());
        if (request.getBusinessType() != null) user.setBusinessType(request.getBusinessType());
        if (request.getPlan() != null) user.setPlan(request.getPlan());

        User updated = userRepository.save(user);
        return mapToUserResponse(updated);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    @Override
    @Transactional
    public UserResponse activateUser(Long id) {
        return changeUserStatus(id, UserStatus.ACTIVE);
    }

    @Override
    @Transactional
    public UserResponse deactivateUser(Long id) {
        return changeUserStatus(id, UserStatus.INACTIVE);
    }

    @Override
    @Transactional
    public UserResponse suspendUser(Long id) {
        return changeUserStatus(id, UserStatus.SUSPENDED);
    }

    private UserResponse changeUserStatus(Long id, UserStatus status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setStatus(status);
        return mapToUserResponse(userRepository.save(user));
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .businessName(user.getBusinessName())
                .businessType(user.getBusinessType())
                .plan(user.getPlan())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
