package com.scims.controller;

import com.scims.dto.request.StatusUpdateRequest;
import com.scims.dto.response.*;
import com.scims.exception.BadRequestException;
import com.scims.security.UserDetailsImpl;
import com.scims.service.ComplaintService;
import com.scims.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Complaint management scoped to the logged-in Sub Admin's own department.
 * A Sub Admin can view and update the status of complaints in their
 * department, but cannot see or touch complaints belonging to any other
 * department — every query here is filtered by user.departmentId taken
 * from the JWT principal, never from a client-supplied value.
 */
@RestController
@RequestMapping("/subadmin")
@PreAuthorize("hasRole('SUB_ADMIN')")
@RequiredArgsConstructor
public class SubAdminComplaintController {

    private final ComplaintService complaintService;
    private final UserService userService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard(
            @AuthenticationPrincipal UserDetailsImpl user) {
        Long departmentId = requireDepartment(user);
        return ResponseEntity.ok(ApiResponse.success(userService.getSubAdminDashboard(departmentId)));
    }

    @GetMapping("/complaints")
    public ResponseEntity<ApiResponse<PageResponse<ComplaintResponse>>> getDepartmentComplaints(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long departmentId = requireDepartment(user);
        PageResponse<ComplaintResponse> response = complaintService.getComplaintsByDepartment(
                departmentId, status, categoryId, search, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/complaints/{id}")
    public ResponseEntity<ApiResponse<ComplaintResponse>> getComplaint(
            @PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl user) {
        ComplaintResponse response = complaintService.getComplaintById(id, user.getId(), "ROLE_SUB_ADMIN");
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/complaints/{id}/status")
    public ResponseEntity<ApiResponse<ComplaintResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            @AuthenticationPrincipal UserDetailsImpl user) {
        // updateStatus() itself re-checks the department match server-side,
        // this call just supplies the Sub Admin's own id as the actor.
        ComplaintResponse response = complaintService.updateStatus(id, request, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Status updated successfully", response));
    }

    private Long requireDepartment(UserDetailsImpl user) {
        if (user.getDepartmentId() == null) {
            throw new BadRequestException("This Sub Admin account is not assigned to a department");
        }
        return user.getDepartmentId();
    }
}
