package com.socialflow.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchResponse {
    private Long id;
    private String branchName;
    private String address;
    private String city;
    private String state;
    private String phone;
    private Long restaurantId;
    private String status;
    private LocalDateTime createdAt;
}
