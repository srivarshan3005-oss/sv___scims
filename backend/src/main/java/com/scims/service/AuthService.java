package com.scims.service;

import com.scims.dto.request.LoginRequest;
import com.scims.dto.request.RegisterRequest;
import com.scims.dto.response.JwtResponse;
import com.scims.dto.response.UserResponse;

public interface AuthService {
    JwtResponse login(LoginRequest request);
    UserResponse register(RegisterRequest request);
}
