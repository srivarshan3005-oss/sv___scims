package com.scims.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ProfileUpdateRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100)
    private String fullName;

    @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be 10 digits")
    private String phone;

    @Size(max = 500)
    private String address;
}
