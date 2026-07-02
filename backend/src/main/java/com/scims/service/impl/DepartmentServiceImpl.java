package com.scims.service.impl;

import com.scims.dto.request.DepartmentRequest;
import com.scims.dto.response.DepartmentResponse;
import com.scims.entity.Department;
import com.scims.exception.BadRequestException;
import com.scims.exception.ResourceNotFoundException;
import com.scims.repository.DepartmentRepository;
import com.scims.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getActiveDepartments() {
        return departmentRepository.findByIsActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentResponse getDepartmentById(Long id) {
        return mapToResponse(departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id)));
    }

    @Override
    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest request) {
        if (departmentRepository.existsByName(request.getName())) {
            throw new BadRequestException("Department already exists: " + request.getName());
        }
        Department dept = Department.builder()
                .name(request.getName())
                .description(request.getDescription())
                .isActive(Boolean.TRUE.equals(request.getIsActive()) || request.getIsActive() == null)
                .build();
        return mapToResponse(departmentRepository.save(dept));
    }

    @Override
    @Transactional
    public DepartmentResponse updateDepartment(Long id, DepartmentRequest request) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
        if (!dept.getName().equals(request.getName()) &&
            departmentRepository.existsByName(request.getName())) {
            throw new BadRequestException("Department name already exists: " + request.getName());
        }
        dept.setName(request.getName());
        dept.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            dept.setIsActive(request.getIsActive());
        }
        return mapToResponse(departmentRepository.save(dept));
    }

    @Override
    @Transactional
    public void toggleDepartmentStatus(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
        dept.setIsActive(!dept.getIsActive());
        departmentRepository.save(dept);
    }

    @Override
    @Transactional
    public void deleteDepartment(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
        long categoryCount = departmentRepository.countCategoriesByDepartmentId(id);
        long subAdminCount = departmentRepository.countSubAdminsByDepartmentId(id);
        if (categoryCount > 0 || subAdminCount > 0) {
            throw new BadRequestException(
                "Cannot delete department '" + dept.getName() + "' — it has " +
                categoryCount + " category(ies) and " + subAdminCount +
                " sub admin(s) assigned. Reassign or remove them first.");
        }
        departmentRepository.delete(dept);
    }

    private DepartmentResponse mapToResponse(Department d) {
        return DepartmentResponse.builder()
                .id(d.getId())
                .name(d.getName())
                .description(d.getDescription())
                .isActive(d.getIsActive())
                .categoryCount(departmentRepository.countCategoriesByDepartmentId(d.getId()))
                .subAdminCount(departmentRepository.countSubAdminsByDepartmentId(d.getId()))
                .complaintCount(departmentRepository.countComplaintsByDepartmentId(d.getId()))
                .createdAt(d.getCreatedAt())
                .build();
    }
}
