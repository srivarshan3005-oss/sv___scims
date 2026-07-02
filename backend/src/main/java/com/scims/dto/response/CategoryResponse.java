package com.scims.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private Long id;
    private String name;
    private String description;
    private Boolean isActive;
    private Long departmentId;
    private String departmentName;
    private long complaintCount;
    private LocalDateTime createdAt;
}
