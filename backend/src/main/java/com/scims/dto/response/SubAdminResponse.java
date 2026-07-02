package com.scims.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubAdminResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String profileImage;
    private Boolean isActive;
    private Long departmentId;
    private String departmentName;
    private LocalDateTime createdAt;
    private long complaintsHandled;
}
