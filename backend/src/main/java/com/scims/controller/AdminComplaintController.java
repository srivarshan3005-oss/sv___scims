package com.scims.controller;

import com.scims.dto.request.StatusUpdateRequest;
import com.scims.dto.response.*;
import com.scims.security.UserDetailsImpl;
import com.scims.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
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

    // GET ALL COMPLAINTS
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
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

    // GET BY ID
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<ComplaintResponse>> getComplaint(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl user) {

        ComplaintResponse response =
                complaintService.getComplaintById(id, user.getId(), "ROLE_ADMIN");

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // UPDATE STATUS (IMPORTANT FIXED PART)
    @PatchMapping(
            value = "/{id}/status",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<ApiResponse<ComplaintResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            @AuthenticationPrincipal UserDetailsImpl user) {

        ComplaintResponse response =
                complaintService.updateStatus(id, request, user.getId());

        return ResponseEntity.ok(ApiResponse.success("Status updated successfully", response));
    }

    // DELETE COMPLAINT
    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Void>> deleteComplaint(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl user) {

        complaintService.deleteComplaint(id, user.getId(), "ROLE_ADMIN");

        return ResponseEntity.ok(ApiResponse.success("Complaint deleted", null));
    }
}