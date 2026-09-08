package com.socialflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileUpdateRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String name;

    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    private String phone;

    @Size(max = 150, message = "Business name must not exceed 150 characters")
    private String businessName;

    @Size(max = 100, message = "Business type must not exceed 100 characters")
    private String businessType;
}
