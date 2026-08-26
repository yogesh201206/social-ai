package com.socialflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchRequest {

    @NotBlank(message = "Branch name is required")
    private String branchName;

    private String address;
    private String city;
    private String state;
    private String phone;
    private String status;
}
