package com.scims.controller;

import com.scims.dto.request.LoginRequest;
import com.scims.dto.request.RegisterRequest;
import com.scims.dto.response.ApiResponse;
import com.scims.dto.response.JwtResponse;
import com.scims.dto.response.UserResponse;
import com.scims.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // TEST ENDPOINT
    @GetMapping("/test")
    public String test() {
        return "Backend working";
    }

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        JwtResponse response = authService.login(request);

        return ResponseEntity.ok(
                ApiResponse.success("Login successful", response)
        );
    }

    // REGISTER
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(
            @Valid @RequestBody RegisterRequest request) {

        UserResponse response = authService.register(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }
}