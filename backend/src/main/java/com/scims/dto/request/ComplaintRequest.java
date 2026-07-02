package com.scims.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ComplaintRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 200, message = "Title must be between 5 and 200 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
    private String description;

    @NotBlank(message = "Location is required")
    @Size(min = 3, max = 255, message = "Location must be between 3 and 255 characters")
    private String location;

    @NotNull(message = "Category is required")
    private Long categoryId;

    private String priority = "MEDIUM";

    // GPS fields — optional (citizen may deny location permission)
    private Double latitude;
    private Double longitude;
    // Accuracy radius in metres from navigator.geolocation API (coords.accuracy)
    private Double gpsAccuracy;
}
