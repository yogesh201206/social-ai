package com.socialflow.service;

import com.socialflow.dto.UserResponse;
import com.socialflow.dto.UserUpdateRequest;

import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();
    UserResponse getUserById(Long id);
    UserResponse updateUser(Long id, UserUpdateRequest request);
    void deleteUser(Long id);
    UserResponse activateUser(Long id);
    UserResponse deactivateUser(Long id);
    UserResponse suspendUser(Long id);
}
