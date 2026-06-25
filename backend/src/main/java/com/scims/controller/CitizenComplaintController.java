package com.scims.controller;

import com.scims.dto.request.ComplaintRequest;
import com.scims.dto.response.*;
import com.scims.security.UserDetailsImpl;
import com.scims.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/citizen/complaints")
@PreAuthorize("hasRole('CITIZEN')")
@RequiredArgsConstructor
public class CitizenComplaintController {

    private final ComplaintService complaintService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ComplaintResponse>> createComplaint(
            @Valid @RequestPart("complaint") ComplaintRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal UserDetailsImpl user) {
        ComplaintResponse response = complaintService.createComplaint(request, image, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Complaint submitted successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ComplaintResponse>>> getMyComplaints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetailsImpl user) {
        PageResponse<ComplaintResponse> response =
                complaintService.getComplaintsByUser(user.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ComplaintResponse>> getComplaint(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl user) {
        ComplaintResponse response = complaintService.getComplaintById(id, user.getId(), "ROLE_CITIZEN");
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComplaint(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl user) {
        complaintService.deleteComplaint(id, user.getId(), "ROLE_CITIZEN");
        return ResponseEntity.ok(ApiResponse.success("Complaint deleted", null));
    }
}
