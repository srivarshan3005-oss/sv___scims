package com.scims.controller;

import com.scims.dto.request.DepartmentRequest;
import com.scims.dto.response.ApiResponse;
import com.scims.dto.response.DepartmentResponse;
import com.scims.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Department management — Super Admin only. Sub Admins are assigned to a
 * department via AdminSubAdminController and categories are routed to a
 * department via CategoryController; this controller only manages the
 * department records themselves.
 */
@RestController
@RequestMapping("/admin/departments")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminDepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> getAllDepartments() {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getAllDepartments()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> getActiveDepartments() {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getActiveDepartments()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentResponse>> getDepartment(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getDepartmentById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DepartmentResponse>> createDepartment(
            @Valid @RequestBody DepartmentRequest request) {
        DepartmentResponse response = departmentService.createDepartment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Department created", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentResponse>> updateDepartment(
            @PathVariable Long id, @Valid @RequestBody DepartmentRequest request) {
        DepartmentResponse response = departmentService.updateDepartment(id, request);
        return ResponseEntity.ok(ApiResponse.success("Department updated", response));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleStatus(@PathVariable Long id) {
        departmentService.toggleDepartmentStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Department status updated", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(ApiResponse.success("Department deleted", null));
    }
}
