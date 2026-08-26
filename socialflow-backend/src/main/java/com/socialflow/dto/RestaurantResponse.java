package com.socialflow.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantResponse {
    private Long id;
    private String name;
    private String category;
    private String businessType;
    private String description;
    private String phone;
    private String email;
    private String address;
    private Long ownerId;
    private String ownerName;
    private String status;
    private List<BranchResponse> branches;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
