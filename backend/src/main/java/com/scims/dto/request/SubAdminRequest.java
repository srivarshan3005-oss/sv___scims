package com.scims.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SubAdminRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    /**
     * Required when creating a new Sub Admin. Optional on update — leave
     * blank to keep the existing password (handled in the service layer).
     */
    @Size(min = 6, max = 40, message = "Password must be between 6 and 40 characters")
    @Pattern(regexp = "^$|^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
             message = "Password must contain at least one uppercase, one lowercase, and one digit")
    private String password;

    @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be 10 digits")
    private String phone;

    @Size(max = 500, message = "Address too long")
    private String address;

    @NotNull(message = "Department is required for a Sub Admin")
    private Long departmentId;
}
