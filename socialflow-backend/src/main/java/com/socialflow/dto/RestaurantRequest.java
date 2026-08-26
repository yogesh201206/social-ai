package com.socialflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantRequest {

    @NotBlank(message = "Restaurant name is required")
    private String name;

    private String category;
    private String businessType;
    private String description;
    private String phone;
    private String email;
    private String address;
    private String status;
}
