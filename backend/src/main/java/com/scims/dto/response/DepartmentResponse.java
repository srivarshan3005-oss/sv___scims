package com.scims.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentResponse {
    private Long id;
    private String name;
    private String description;
    private Boolean isActive;
    private long categoryCount;
    private long subAdminCount;
    private long complaintCount;
    private LocalDateTime createdAt;
}
