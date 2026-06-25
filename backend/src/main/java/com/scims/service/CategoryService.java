package com.scims.service;

import com.scims.dto.request.CategoryRequest;
import com.scims.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllCategories();
    List<CategoryResponse> getActiveCategories();
    CategoryResponse getCategoryById(Long id);
    CategoryResponse createCategory(CategoryRequest request);
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    void toggleCategoryStatus(Long id);
    void deleteCategory(Long id);
}
