package com.scims.controller;

import com.scims.dto.request.ProfileUpdateRequest;
import com.scims.dto.response.*;
import com.scims.security.UserDetailsImpl;
import com.scims.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/citizen")
@PreAuthorize("hasRole('CITIZEN')")
@RequiredArgsConstructor
public class CitizenProfileController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(ApiResponse.success(userService.getProfile(user.getId())));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody ProfileUpdateRequest request,
            @AuthenticationPrincipal UserDetailsImpl user) {
        UserResponse response = userService.updateProfile(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", response));
    }

    @PostMapping(value = "/profile/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserResponse>> uploadProfileImage(
            @RequestPart("image") MultipartFile file,
            @AuthenticationPrincipal UserDetailsImpl user) {
        UserResponse response = userService.uploadProfileImage(user.getId(), file);
        return ResponseEntity.ok(ApiResponse.success("Profile image updated", response));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard(
            @AuthenticationPrincipal UserDetailsImpl user) {
        DashboardResponse dashboard = userService.getCitizenDashboard(user.getId());
        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }
}
