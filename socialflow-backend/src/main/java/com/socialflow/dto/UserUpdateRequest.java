package com.socialflow.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserUpdateRequest {
    private String name;
    private String phone;
    private String businessName;
    private String businessType;
    private String plan;
}
