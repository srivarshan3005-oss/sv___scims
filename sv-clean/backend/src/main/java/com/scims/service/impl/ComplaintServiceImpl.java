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
import java.util.List;
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

    // ================= CREATE =================
    @Override
    @Transactional
    public ComplaintResponse createComplaint(ComplaintRequest request,
                                             MultipartFile image,
                                             Long userId) {

        if (request == null) {
            throw new BadRequestException("Complaint request is missing");
        }

        if (request.getCategoryId() == null) {
            throw new BadRequestException("categoryId is required");
        }

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BadRequestException("title is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));

        // safe priority
        Priority priority = Priority.MEDIUM;
        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            try {
                priority = Priority.valueOf(request.getPriority().toUpperCase());
            } catch (Exception e) {
                priority = Priority.MEDIUM;
            }
        }

        Complaint complaint = Complaint.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .status(ComplaintStatus.PENDING)
                .priority(priority)
                .user(user)
                .category(category)
                .build();

        Complaint saved = complaintRepository.save(complaint);

        // image upload safe
        if (image != null && !image.isEmpty()) {
            try {
                String imagePath = fileUploadService.uploadImage(image, "complaints");

                ComplaintImage ci = ComplaintImage.builder()
                        .complaint(saved)
                        .imagePath(imagePath)
                        .originalName(image.getOriginalFilename())
                        .build();

                complaintImageRepository.save(ci);
            } catch (Exception e) {
                log.error("Image upload failed", e);
                throw new BadRequestException("Image upload failed");
            }
        }

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

    // ================= GET BY ID =================
    @Override
    public ComplaintResponse getComplaintById(Long id, Long requestingUserId, String role) {

        Complaint c = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint", id));

        if ("ROLE_CITIZEN".equals(role)
                && !c.getUser().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("Not allowed");
        }

        return mapToResponse(c);
    }

    // ================= GET USER =================
    @Override
    public PageResponse<ComplaintResponse> getComplaintsByUser(Long userId, int page, int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Complaint> complaints = complaintRepository.findByUserId(userId, pageable);

        return PageResponse.from(complaints.map(this::mapToResponse));
    }

    // ================= GET ALL =================
    @Override
    public PageResponse<ComplaintResponse> getAllComplaints(String status,
                                                            Long categoryId,
                                                            String search,
                                                            int page,
                                                            int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        ComplaintStatus cs = null;
        if (status != null && !status.isBlank()) {
            try {
                cs = ComplaintStatus.valueOf(status.toUpperCase());
            } catch (Exception ignored) {}
        }

        String searchTerm = (search != null && !search.isBlank()) ? search : null;
        Long catId = (categoryId != null && categoryId > 0) ? categoryId : null;

        Page<Complaint> complaints =
                complaintRepository.findAllWithFilters(cs, catId, searchTerm, pageable);

        return PageResponse.from(complaints.map(this::mapToResponse));
    }

    // ================= UPDATE STATUS =================
    @Override
    @Transactional
    public ComplaintResponse updateStatus(Long complaintId,
                                         StatusUpdateRequest request,
                                         Long adminId) {

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint", complaintId));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin", adminId));

        ComplaintStatus newStatus;
        try {
            newStatus = ComplaintStatus.valueOf(request.getStatus().toUpperCase());
        } catch (Exception e) {
            throw new BadRequestException("Invalid status");
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

    // ================= DELETE =================
    @Override
    @Transactional
    public void deleteComplaint(Long complaintId, Long userId, String role) {

        Complaint c = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint", complaintId));

        if ("ROLE_CITIZEN".equals(role)
                && !c.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Not allowed");
        }

        if ("ROLE_CITIZEN".equals(role)
                && c.getStatus() != ComplaintStatus.PENDING) {
            throw new BadRequestException("Only PENDING allowed");
        }

        List<ComplaintImage> images =
                complaintImageRepository.findByComplaintId(complaintId);

        images.forEach(img -> fileUploadService.deleteFile(img.getImagePath()));

        complaintRepository.delete(c);
    }

    // ================= MAPPER (FULL SAFE) =================
    private ComplaintResponse mapToResponse(Complaint c) {

        List<ComplaintImage> images =
                complaintImageRepository.findByComplaintId(c.getId());

        List<String> imageUrls = images.stream()
                .map(ComplaintImage::getImagePath)
                .collect(Collectors.toList());

        List<StatusHistory> history =
                statusHistoryRepository.findByComplaintIdOrderByChangedAtAsc(c.getId());

        List<StatusHistoryResponse> historyResponses = history.stream()
                .map(h -> StatusHistoryResponse.builder()
                        .id(h.getId())
                        .oldStatus(h.getOldStatus())
                        .newStatus(h.getNewStatus())
                        .changedBy(h.getChangedBy() != null
                                ? h.getChangedBy().getFullName()
                                : "SYSTEM")
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
                .categoryId(c.getCategory() != null ? c.getCategory().getId() : null)
                .categoryName(c.getCategory() != null ? c.getCategory().getName() : null)
                .userId(c.getUser() != null ? c.getUser().getId() : null)
                .userName(c.getUser() != null ? c.getUser().getFullName() : null)
                .userEmail(c.getUser() != null ? c.getUser().getEmail() : null)
                .adminRemarks(c.getAdminRemarks())
                .imageUrls(imageUrls)
                .statusHistory(historyResponses)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .resolvedAt(c.getResolvedAt())
                .build();
    }
}