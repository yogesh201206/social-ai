package com.socialflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocialAccountCallbackResult {
    private SocialAccountResponse account;
    private boolean requiresPageSelection;
    private String selectionToken;
    private List<FacebookPageCandidateDto> candidatePages;

    public static SocialAccountCallbackResult connected(SocialAccountResponse account) {
        return SocialAccountCallbackResult.builder()
                .account(account)
                .requiresPageSelection(false)
                .build();
    }

    public static SocialAccountCallbackResult selectPage(String selectionToken, List<FacebookPageCandidateDto> candidatePages) {
        return SocialAccountCallbackResult.builder()
                .requiresPageSelection(true)
                .selectionToken(selectionToken)
                .candidatePages(candidatePages)
                .build();
    }
}
