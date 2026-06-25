package com.scims.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintResponse {
    private Long id;
    private String title;
    private String description;
    private String location;
    private String status;
    private String priority;
    private String categoryName;
    private Long categoryId;
    private Long userId;
    private String userName;
    private String userEmail;
    private String adminRemarks;
    private List<String> imageUrls;
    private List<StatusHistoryResponse> statusHistory;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
}
