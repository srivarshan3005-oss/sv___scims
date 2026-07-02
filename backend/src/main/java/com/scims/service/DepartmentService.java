package com.scims.service;

import com.scims.dto.request.DepartmentRequest;
import com.scims.dto.response.DepartmentResponse;

import java.util.List;

public interface DepartmentService {
    List<DepartmentResponse> getAllDepartments();
    List<DepartmentResponse> getActiveDepartments();
    DepartmentResponse getDepartmentById(Long id);
    DepartmentResponse createDepartment(DepartmentRequest request);
    DepartmentResponse updateDepartment(Long id, DepartmentRequest request);
    void toggleDepartmentStatus(Long id);
    void deleteDepartment(Long id);
}
