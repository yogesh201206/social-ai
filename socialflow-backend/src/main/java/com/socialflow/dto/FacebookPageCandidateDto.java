package com.socialflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Safe DTO for candidate Facebook Pages returned to the user when multiple Pages exist.
 * Access tokens are NEVER included in this DTO.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacebookPageCandidateDto {
    private String id;
    private String name;
    private String category;
}
