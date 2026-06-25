package com.scims.service.impl;

import com.scims.dto.request.ProfileUpdateRequest;
import com.scims.dto.response.DashboardResponse;
import com.scims.dto.response.PageResponse;
import com.scims.dto.response.UserResponse;
import com.scims.entity.ComplaintStatus;
import com.scims.entity.User;
import com.scims.exception.ResourceNotFoundException;
import com.scims.repository.ComplaintRepository;
import com.scims.repository.UserRepository;
import com.scims.service.FileUploadService;
import com.scims.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final FileUploadService fileUploadService;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return mapToResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        return mapToResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse uploadProfileImage(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        // Delete old profile image from disk before saving new one
        if (user.getProfileImage() != null) {
            fileUploadService.deleteFile(user.getProfileImage());
        }
        String imagePath = fileUploadService.uploadImage(file, "profiles");
        user.setProfileImage(imagePath);
        return mapToResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAllUsers(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        // Pass null when search is blank so JPQL returns all rows
        String searchTerm = (search != null && !search.isBlank()) ? search : null;
        Page<User> users = userRepository.findAllCitizens(searchTerm, pageable);
        return PageResponse.from(users.map(this::mapToResponse));
    }

    @Override
    @Transactional
    public UserResponse toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.setIsActive(!user.getIsActive());
        log.info("User #{} ({}) status toggled to {}",
                userId, user.getEmail(), user.getIsActive());
        return mapToResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getAdminDashboard() {
        long total      = complaintRepository.count();
        long pending    = complaintRepository.countByStatus(ComplaintStatus.PENDING);
        long inProgress = complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS);
        long resolved   = complaintRepository.countByStatus(ComplaintStatus.RESOLVED);
        long rejected   = complaintRepository.countByStatus(ComplaintStatus.REJECTED);
        long totalUsers = userRepository.countActiveCitizens();

        return DashboardResponse.builder()
                .totalComplaints(total)
                .pendingComplaints(pending)
                .inProgressComplaints(inProgress)
                .resolvedComplaints(resolved)
                .rejectedComplaints(rejected)
                .totalUsers(totalUsers)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getCitizenDashboard(Long userId) {
        long total      = complaintRepository.countByUserId(userId);
        long pending    = complaintRepository.countByUserIdAndStatus(
                            userId, ComplaintStatus.PENDING);
        long inProgress = complaintRepository.countByUserIdAndStatus(
                            userId, ComplaintStatus.IN_PROGRESS);
        long resolved   = complaintRepository.countByUserIdAndStatus(
                            userId, ComplaintStatus.RESOLVED);
        long rejected   = complaintRepository.countByUserIdAndStatus(
                            userId, ComplaintStatus.REJECTED);

        return DashboardResponse.builder()
                .totalComplaints(total)
                .pendingComplaints(pending)
                .inProgressComplaints(inProgress)
                .resolvedComplaints(resolved)
                .rejectedComplaints(rejected)
                .build();
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        // Soft delete: just deactivate the account
        user.setIsActive(false);
        userRepository.save(user);
        log.info("User #{} soft-deleted (deactivated)", userId);
    }

    /**
     * Maps a User entity to UserResponse DTO.
     * Profile image URL is prefixed with /uploads/ to match static
     * resource handler — stored path is relative (e.g. "profiles/uuid.jpg").
     */
    private UserResponse mapToResponse(User u) {
        long totalComplaints = complaintRepository.countByUserId(u.getId());
        String profileImageUrl = null;
        if (u.getProfileImage() != null && !u.getProfileImage().isBlank()) {
            profileImageUrl = "/uploads/" + u.getProfileImage();
        }
        return UserResponse.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .address(u.getAddress())
                .profileImage(profileImageUrl)
                .isActive(u.getIsActive())
                .role(u.getRole().getName())
                .createdAt(u.getCreatedAt())
                .totalComplaints(totalComplaints)
                .build();
    }
}
