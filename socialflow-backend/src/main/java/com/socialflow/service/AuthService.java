package com.socialflow.service;

import com.socialflow.dto.AuthResponse;
import com.socialflow.dto.LoginRequest;
import com.socialflow.dto.RegisterRequest;
import com.socialflow.dto.UserResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    UserResponse getCurrentUser(String email);
}
