package com.scims.service.impl;

import com.scims.dto.request.ComplaintRequest;
import com.scims.dto.request.StatusUpdateRequest;
import com.scims.dto.response.*;
import com.scims.entity.*;
import com.scims.exception.BadRequestException;
import com.scims.exception.ResourceNotFoundException;
import com.scims.exception.UnauthorizedException;
import com.scims.repository.*;
import com.scims.service.ComplaintService;
import com.scims.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final ComplaintImageRepository complaintImageRepository;
    private final FileUploadService fileUploadService;

    @Override
    @Transactional
    public ComplaintResponse createComplaint(ComplaintRequest request,
                                              MultipartFile image, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Category", request.getCategoryId()));

        Priority priority;
        try {
            priority = Priority.valueOf(request.getPriority().toUpperCase());
        } catch (Exception e) {
            priority = Priority.MEDIUM;
        }

        Complaint complaint = Complaint.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .status(ComplaintStatus.PENDING)
                .priority(priority)
                .user(user)
                .category(category)
                // Auto-route to whichever department currently owns this
                // category. Denormalized onto the complaint so it stays
                // fixed even if the category is moved to another
                // department later, and so Sub Admin queries can filter
                // directly on complaint.department_id.
                .department(category.getDepartment())
                // GPS fields — stored as-provided; null if permission was denied
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .gpsAccuracy(request.getGpsAccuracy())
                .build();

        Complaint saved = complaintRepository.save(complaint);

        // Save uploaded image if present
        if (image != null && !image.isEmpty()) {
            String imagePath = fileUploadService.uploadImage(image, "complaints");
            ComplaintImage ci = ComplaintImage.builder()
                    .complaint(saved)
                    .imagePath(imagePath)
                    .originalName(image.getOriginalFilename())
                    .build();
            complaintImageRepository.save(ci);
        }

        // Record initial status history
        StatusHistory history = StatusHistory.builder()
                .complaint(saved)
                .oldStatus(null)
                .newStatus(ComplaintStatus.PENDING.name())
                .changedBy(user)
                .remarks("Complaint submitted by citizen")
                .build();
        statusHistoryRepository.save(history);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintById(Long id, Long requestingUserId, String role) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint", id));
        // Citizens can only view their own complaints
        if ("ROLE_CITIZEN".equals(role) &&
                !complaint.getUser().getId().equals(requestingUserId)) {
            throw new UnauthorizedException(
                    "You are not authorized to view this complaint");
        }
        // Sub Admins can only view complaints routed to their own department
        if ("ROLE_SUB_ADMIN".equals(role)) {
            User subAdmin = userRepository.findById(requestingUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", requestingUserId));
            Long subAdminDeptId = subAdmin.getDepartment() != null ? subAdmin.getDepartment().getId() : null;
            Long complaintDeptId = complaint.getDepartment() != null ? complaint.getDepartment().getId() : null;
            if (subAdminDeptId == null || !subAdminDeptId.equals(complaintDeptId)) {
                throw new UnauthorizedException(
                        "This complaint belongs to a different department");
            }
        }
        return mapToResponse(complaint);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ComplaintResponse> getComplaintsByUser(Long userId,
                                                                int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        Page<Complaint> complaints = complaintRepository.findByUserId(userId, pageable);
        return PageResponse.from(complaints.map(this::mapToResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ComplaintResponse> getAllComplaints(String status,
                                                            Long categoryId,
                                                            String search,
                                                            int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());

        // Parse status safely
        ComplaintStatus cs = null;
        if (status != null && !status.isBlank()) {
            try {
                cs = ComplaintStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status filter value: {}", status);
            }
        }

        // Treat blank search as null so JPQL returns all rows
        String searchTerm = (search != null && !search.isBlank()) ? search : null;
        Long catId = (categoryId != null && categoryId > 0) ? categoryId : null;

        Page<Complaint> complaints = complaintRepository.findAllWithFilters(
                cs, catId, searchTerm, pageable);
        return PageResponse.from(complaints.map(this::mapToResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ComplaintResponse> getComplaintsByDepartment(Long departmentId,
                                                            String status,
                                                            Long categoryId,
                                                            String search,
                                                            int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());

        ComplaintStatus cs = null;
        if (status != null && !status.isBlank()) {
            try {
                cs = ComplaintStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status filter value: {}", status);
            }
        }

        String searchTerm = (search != null && !search.isBlank()) ? search : null;
        Long catId = (categoryId != null && categoryId > 0) ? categoryId : null;

        Page<Complaint> complaints = complaintRepository.findAllByDepartmentWithFilters(
                departmentId, cs, catId, searchTerm, pageable);
        return PageResponse.from(complaints.map(this::mapToResponse));
    }

    @Override
    @Transactional
    public ComplaintResponse updateStatus(Long complaintId,
                                           StatusUpdateRequest request,
                                           Long adminId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint", complaintId));
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin User", adminId));

        // Sub Admins may only update complaints in their own department.
        // Super Admin (ROLE_ADMIN) has a null department and bypasses this.
        if ("ROLE_SUB_ADMIN".equals(admin.getRole().getName())) {
            Long adminDeptId = admin.getDepartment() != null ? admin.getDepartment().getId() : null;
            Long complaintDeptId = complaint.getDepartment() != null ? complaint.getDepartment().getId() : null;
            if (adminDeptId == null || !adminDeptId.equals(complaintDeptId)) {
                throw new UnauthorizedException(
                        "This complaint belongs to a different department");
            }
        }

        ComplaintStatus newStatus;
        try {
            newStatus = ComplaintStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status value: " + request.getStatus() +
                    ". Valid values: PENDING, IN_PROGRESS, RESOLVED, REJECTED, CLOSED");
        }

        String oldStatus = complaint.getStatus().name();
        complaint.setStatus(newStatus);
        if (request.getRemarks() != null && !request.getRemarks().isBlank()) {
            complaint.setAdminRemarks(request.getRemarks());
        }
        if (newStatus == ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(LocalDateTime.now());
        }
        complaintRepository.save(complaint);

        // Record status change in history
        StatusHistory history = StatusHistory.builder()
                .complaint(complaint)
                .oldStatus(oldStatus)
                .newStatus(newStatus.name())
                .changedBy(admin)
                .remarks(request.getRemarks())
                .build();
        statusHistoryRepository.save(history);

        return mapToResponse(complaint);
    }

    @Override
    @Transactional
    public void deleteComplaint(Long complaintId, Long userId, String role) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint", complaintId));

        // Citizens can only delete their own complaints
        if ("ROLE_CITIZEN".equals(role) &&
                !complaint.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You cannot delete this complaint");
        }
        // Citizens can only delete PENDING complaints
        if ("ROLE_CITIZEN".equals(role) &&
                complaint.getStatus() != ComplaintStatus.PENDING) {
            throw new BadRequestException(
                    "Only PENDING complaints can be deleted. " +
                    "Current status: " + complaint.getStatus());
        }

        // Clean up uploaded images from disk
        List<ComplaintImage> images = complaintImageRepository
                .findByComplaintId(complaintId);
        images.forEach(img -> fileUploadService.deleteFile(img.getImagePath()));

        complaintRepository.delete(complaint);
        log.info("Complaint #{} deleted by user #{} (role: {})",
                complaintId, userId, role);
    }

    /**
     * Maps a Complaint entity to its response DTO.
     * Fetches images and status history via dedicated repository calls
     * (not through lazy collections) to avoid LazyInitializationException.
     */
    private ComplaintResponse mapToResponse(Complaint c) {
        // Fetch images
        List<ComplaintImage> images = complaintImageRepository
                .findByComplaintId(c.getId());
        List<String> imageUrls = images.stream()
                .map(img -> "/uploads/" + img.getImagePath())
                .collect(Collectors.toList());

        // Fetch status history in chronological order
        List<StatusHistory> history = statusHistoryRepository
                .findByComplaintIdOrderByChangedAtAsc(c.getId());
        List<StatusHistoryResponse> historyResponses = history.stream()
                .map(h -> StatusHistoryResponse.builder()
                        .id(h.getId())
                        .oldStatus(h.getOldStatus())
                        .newStatus(h.getNewStatus())
                        .changedBy(h.getChangedBy().getFullName())
                        .remarks(h.getRemarks())
                        .changedAt(h.getChangedAt())
                        .build())
                .collect(Collectors.toList());

        return ComplaintResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .description(c.getDescription())
                .location(c.getLocation())
                .status(c.getStatus().name())
                .priority(c.getPriority().name())
                .categoryId(c.getCategory().getId())
                .categoryName(c.getCategory().getName())
                .departmentId(c.getDepartment() != null ? c.getDepartment().getId() : null)
                .departmentName(c.getDepartment() != null ? c.getDepartment().getName() : null)
                .userId(c.getUser().getId())
                .userName(c.getUser().getFullName())
                .userEmail(c.getUser().getEmail())
                .adminRemarks(c.getAdminRemarks())
                .imageUrls(imageUrls)
                .statusHistory(historyResponses)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .resolvedAt(c.getResolvedAt())
                // GPS fields
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .gpsAccuracy(c.getGpsAccuracy())
                .build();
    }
}
