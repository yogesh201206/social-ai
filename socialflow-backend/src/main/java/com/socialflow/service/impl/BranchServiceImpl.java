package com.socialflow.service.impl;

import com.socialflow.dto.BranchRequest;
import com.socialflow.dto.BranchResponse;
import com.socialflow.entity.Branch;
import com.socialflow.exception.ResourceNotFoundException;
import com.socialflow.exception.UnauthorizedException;
import com.socialflow.repository.BranchRepository;
import com.socialflow.service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BranchServiceImpl implements BranchService {

    private final BranchRepository branchRepository;

    @Override
    @Transactional
    public BranchResponse updateBranch(Long branchId, BranchRequest request, String currentUserEmail, boolean isAdmin) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + branchId));

        if (!isAdmin && !branch.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        if (request.getBranchName() != null) branch.setBranchName(request.getBranchName());
        if (request.getAddress() != null) branch.setAddress(request.getAddress());
        if (request.getCity() != null) branch.setCity(request.getCity());
        if (request.getState() != null) branch.setState(request.getState());
        if (request.getPhone() != null) branch.setPhone(request.getPhone());
        if (request.getStatus() != null) branch.setStatus(request.getStatus());

        Branch updated = branchRepository.save(branch);
        return mapToBranchResponse(updated);
    }

    @Override
    @Transactional
    public void deleteBranch(Long branchId, String currentUserEmail, boolean isAdmin) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + branchId));

        if (!isAdmin && !branch.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        branchRepository.delete(branch);
    }

    private BranchResponse mapToBranchResponse(Branch b) {
        return BranchResponse.builder()
                .id(b.getId())
                .branchName(b.getBranchName())
                .address(b.getAddress())
                .city(b.getCity())
                .state(b.getState())
                .phone(b.getPhone())
                .restaurantId(b.getRestaurant().getId())
                .status(b.getStatus())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
