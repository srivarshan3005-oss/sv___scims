package com.scims.service;

import com.scims.dto.request.ProfileUpdateRequest;
import com.scims.dto.response.DashboardResponse;
import com.scims.dto.response.PageResponse;
import com.scims.dto.response.UserResponse;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    UserResponse getProfile(Long userId);
    UserResponse updateProfile(Long userId, ProfileUpdateRequest request);
    UserResponse uploadProfileImage(Long userId, MultipartFile file);
    PageResponse<UserResponse> getAllUsers(String search, int page, int size);
    UserResponse toggleUserStatus(Long userId);
    DashboardResponse getAdminDashboard();
    DashboardResponse getCitizenDashboard(Long userId);
    void deleteUser(Long userId);
}
