package com.socialflow.service;

import com.socialflow.dto.BranchRequest;
import com.socialflow.dto.BranchResponse;

public interface BranchService {
    BranchResponse updateBranch(Long branchId, BranchRequest request, String currentUserEmail, boolean isAdmin);
    void deleteBranch(Long branchId, String currentUserEmail, boolean isAdmin);
}
