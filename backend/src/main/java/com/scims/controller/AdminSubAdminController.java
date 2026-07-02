package com.scims.controller;

import com.scims.dto.request.SubAdminRequest;
import com.scims.dto.response.ApiResponse;
import com.scims.dto.response.PageResponse;
import com.scims.dto.response.SubAdminResponse;
import com.scims.service.SubAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Sub Admin account management — Super Admin only. The Super Admin can
 * create, edit, activate/deactivate, reassign (change department), and
 * delete (deactivate) any Sub Admin. Unlimited Sub Admins per department.
 */
@RestController
@RequestMapping("/admin/subadmins")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminSubAdminController {

    private final SubAdminService subAdminService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<SubAdminResponse>>> getAllSubAdmins(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<SubAdminResponse> response =
                subAdminService.getAllSubAdmins(departmentId, search, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SubAdminResponse>> getSubAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(subAdminService.getSubAdminById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SubAdminResponse>> createSubAdmin(
            @Valid @RequestBody SubAdminRequest request) {
        SubAdminResponse response = subAdminService.createSubAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Sub Admin created", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SubAdminResponse>> updateSubAdmin(
            @PathVariable Long id, @Valid @RequestBody SubAdminRequest request) {
        SubAdminResponse response = subAdminService.updateSubAdmin(id, request);
        return ResponseEntity.ok(ApiResponse.success("Sub Admin updated", response));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<SubAdminResponse>> toggleStatus(@PathVariable Long id) {
        SubAdminResponse response = subAdminService.toggleSubAdminStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Sub Admin status updated", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSubAdmin(@PathVariable Long id) {
        subAdminService.deleteSubAdmin(id);
        return ResponseEntity.ok(ApiResponse.success("Sub Admin deactivated", null));
    }
}
