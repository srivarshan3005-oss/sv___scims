package com.scims.service.impl;

import com.scims.dto.request.CategoryRequest;
import com.scims.dto.response.CategoryResponse;
import com.scims.entity.Category;
import com.scims.entity.Department;
import com.scims.exception.BadRequestException;
import com.scims.exception.ResourceNotFoundException;
import com.scims.repository.CategoryRepository;
import com.scims.repository.DepartmentRepository;
import com.scims.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getActiveCategories() {
        return categoryRepository.findByIsActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        return mapToResponse(categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id)));
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new BadRequestException("Category already exists: " + request.getName());
        }
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", request.getDepartmentId()));
        Category cat = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .isActive(Boolean.TRUE.equals(request.getIsActive()) || request.getIsActive() == null)
                .department(department)
                .build();
        return mapToResponse(categoryRepository.save(cat));
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        if (!cat.getName().equals(request.getName()) &&
            categoryRepository.existsByName(request.getName())) {
            throw new BadRequestException("Category name already exists: " + request.getName());
        }
        cat.setName(request.getName());
        cat.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            cat.setIsActive(request.getIsActive());
        }
        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", request.getDepartmentId()));
            cat.setDepartment(department);
        }
        return mapToResponse(categoryRepository.save(cat));
    }

    @Override
    @Transactional
    public void toggleCategoryStatus(Long id) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        cat.setIsActive(!cat.getIsActive());
        categoryRepository.save(cat);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        // Use count query instead of accessing lazy collection
        long complaintCount = categoryRepository.countComplaintsByCategoryId(id);
        if (complaintCount > 0) {
            throw new BadRequestException(
                "Cannot delete category '" + cat.getName() +
                "' — it has " + complaintCount + " existing complaint(s)");
        }
        categoryRepository.delete(cat);
    }

    /**
     * mapToResponse now uses the repository count query instead of
     * cat.getComplaints().size() which caused LazyInitializationException
     * when called outside a transaction context.
     */
    private CategoryResponse mapToResponse(Category c) {
        long count = categoryRepository.countComplaintsByCategoryId(c.getId());
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .isActive(c.getIsActive())
                .departmentId(c.getDepartment() != null ? c.getDepartment().getId() : null)
                .departmentName(c.getDepartment() != null ? c.getDepartment().getName() : null)
                .complaintCount(count)
                .createdAt(c.getCreatedAt())
                .build();
    }
}
