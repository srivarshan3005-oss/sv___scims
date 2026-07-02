package com.scims.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class StatusUpdateRequest {

    /**
     * Status must be one of the valid ComplaintStatus enum values.
     * The Pattern constraint prevents invalid values from reaching the service
     * layer, returning HTTP 400 before any service logic is attempted.
     */
    @NotBlank(message = "Status is required")
    @Pattern(
        regexp = "PENDING|IN_PROGRESS|RESOLVED|REJECTED|CLOSED",
        message = "Status must be one of: PENDING, IN_PROGRESS, RESOLVED, REJECTED, CLOSED"
    )
    private String status;

    private String remarks;
}
