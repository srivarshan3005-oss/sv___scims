package com.scims.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @Size(max = 500, message = "Description too long")
    private String description;

    private Boolean isActive = true;

    @NotNull(message = "Department is required for a category")
    private Long departmentId;
}
