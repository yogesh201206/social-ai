package com.socialflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload when a user selects a specific Facebook Page to connect.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SelectFacebookPageRequest {

    @NotBlank(message = "Selection token is required")
    private String selectionToken;

    @NotBlank(message = "Facebook Page ID is required")
    private String pageId;
}
