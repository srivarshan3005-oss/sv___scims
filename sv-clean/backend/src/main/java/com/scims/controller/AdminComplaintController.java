package com.scims.controller;

import com.scims.dto.request.StatusUpdateRequest;
import com.scims.dto.response.*;
import com.scims.security.UserDetailsImpl;
import com.scims.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/complaints")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminComplaintController {

    private final ComplaintService complaintService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ComplaintResponse>>> getAllComplaints(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<ComplaintResponse> response =
                complaintService.getAllComplaints(status, categoryId, search, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ComplaintResponse>> getComplaint(@PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl user) {
        ComplaintResponse response = complaintService.getComplaintById(id, user.getId(), "ROLE_ADMIN");
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ComplaintResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            @AuthenticationPrincipal UserDetailsImpl user) {
        ComplaintResponse response = complaintService.updateStatus(id, request, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Status updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComplaint(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl user) {
        complaintService.deleteComplaint(id, user.getId(), "ROLE_ADMIN");
        return ResponseEntity.ok(ApiResponse.success("Complaint deleted", null));
    }
}
