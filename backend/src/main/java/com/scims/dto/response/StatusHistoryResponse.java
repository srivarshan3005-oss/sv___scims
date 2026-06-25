package com.scims.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusHistoryResponse {
    private Long id;
    private String oldStatus;
    private String newStatus;
    private String changedBy;
    private String remarks;
    private LocalDateTime changedAt;
}
