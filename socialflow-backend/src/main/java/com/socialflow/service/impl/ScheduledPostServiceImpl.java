package com.socialflow.service.impl;

import com.socialflow.dto.ScheduleRequest;
import com.socialflow.dto.ScheduleResponse;
import com.socialflow.entity.*;
import com.socialflow.exception.BadRequestException;
import com.socialflow.exception.ResourceNotFoundException;
import com.socialflow.exception.UnauthorizedException;
import com.socialflow.repository.BranchRepository;
import com.socialflow.repository.PostRepository;
import com.socialflow.repository.RestaurantRepository;
import com.socialflow.repository.ScheduledPostRepository;
import com.socialflow.service.ScheduledPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduledPostServiceImpl implements ScheduledPostService {

    private final ScheduledPostRepository scheduledPostRepository;
    private final PostRepository postRepository;
    private final RestaurantRepository restaurantRepository;
    private final BranchRepository branchRepository;

    @Override
    public List<ScheduleResponse> getAllSchedules(String currentUserEmail, boolean isAdmin) {
        List<ScheduledPost> list;
        if (isAdmin) {
            list = scheduledPostRepository.findAll();
        } else {
            list = scheduledPostRepository.findByRestaurantOwnerEmail(currentUserEmail);
        }
        return list.stream().map(this::mapToScheduleResponse).collect(Collectors.toList());
    }

    @Override
    public ScheduleResponse getScheduleById(Long id, String currentUserEmail, boolean isAdmin) {
        ScheduledPost schedule = scheduledPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));

        if (!isAdmin && !schedule.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        return mapToScheduleResponse(schedule);
    }

    @Override
    @Transactional
    public ScheduleResponse createSchedule(ScheduleRequest request, String currentUserEmail, boolean isAdmin) {
        if (request.getRestaurantId() == null) {
            throw new BadRequestException("Restaurant ID is required");
        }
        if (request.getPlatform() == null) {
            throw new BadRequestException("Platform is required");
        }
        if (request.getScheduledDateTime() == null) {
            throw new BadRequestException("Scheduled date time is required");
        }
        if (request.getScheduledDateTime().isBefore(LocalDateTime.now().minusMinutes(1))) {
            throw new BadRequestException("Scheduled date and time must be in the future");
        }

        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + request.getRestaurantId()));

        if (!isAdmin && !restaurant.getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        Branch branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + request.getBranchId()));
            if (!branch.getRestaurant().getId().equals(restaurant.getId())) {
                throw new BadRequestException("Branch does not belong to the selected restaurant");
            }
        }

        Post post = null;
        if (request.getPostId() != null) {
            post = postRepository.findById(request.getPostId())
                    .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + request.getPostId()));
            if (!isAdmin && !post.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
                throw new UnauthorizedException("Not authorized to schedule this post");
            }
            post.setStatus(PostStatus.SCHEDULED);
            post.setScheduledAt(request.getScheduledDateTime());
            postRepository.save(post);
        }

        ScheduledPost schedule = ScheduledPost.builder()
                .post(post)
                .restaurant(restaurant)
                .branch(branch)
                .platform(request.getPlatform())
                .scheduledDateTime(request.getScheduledDateTime())
                .timezone(request.getTimezone() != null ? request.getTimezone() : "UTC")
                .status(request.getStatus() != null ? request.getStatus() : ScheduleStatus.SCHEDULED)
                .build();

        return mapToScheduleResponse(scheduledPostRepository.save(schedule));
    }

    @Override
    @Transactional
    public ScheduleResponse updateSchedule(Long id, ScheduleRequest request, String currentUserEmail, boolean isAdmin) {
        ScheduledPost schedule = scheduledPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));

        if (!isAdmin && !schedule.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        if (request.getRestaurantId() != null) {
            Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + request.getRestaurantId()));
            if (!isAdmin && !restaurant.getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
                throw new UnauthorizedException("Not authorized");
            }
            schedule.setRestaurant(restaurant);
        }

        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + request.getBranchId()));
            if (!branch.getRestaurant().getId().equals(schedule.getRestaurant().getId())) {
                throw new BadRequestException("Branch does not belong to the selected restaurant");
            }
            schedule.setBranch(branch);
        }

        if (request.getPlatform() != null) schedule.setPlatform(request.getPlatform());

        if (request.getScheduledDateTime() != null) {
            if (request.getScheduledDateTime().isBefore(LocalDateTime.now().minusMinutes(1))) {
                throw new BadRequestException("Scheduled date and time must be in the future");
            }
            schedule.setScheduledDateTime(request.getScheduledDateTime());
        }

        if (request.getTimezone() != null) schedule.setTimezone(request.getTimezone());
        if (request.getStatus() != null) schedule.setStatus(request.getStatus());

        ScheduledPost saved = scheduledPostRepository.save(schedule);

        if (saved.getPost() != null) {
            Post post = saved.getPost();
            if (saved.getStatus() == ScheduleStatus.SCHEDULED) {
                post.setStatus(PostStatus.SCHEDULED);
                post.setScheduledAt(saved.getScheduledDateTime());
            } else if (saved.getStatus() == ScheduleStatus.CANCELLED) {
                post.setStatus(PostStatus.CANCELLED);
            } else if (saved.getStatus() == ScheduleStatus.PUBLISHED) {
                post.setStatus(PostStatus.PUBLISHED);
            }
            postRepository.save(post);
        }

        return mapToScheduleResponse(saved);
    }

    @Override
    @Transactional
    public void deleteSchedule(Long id, String currentUserEmail, boolean isAdmin) {
        ScheduledPost schedule = scheduledPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));

        if (!isAdmin && !schedule.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        scheduledPostRepository.delete(schedule);
    }

    @Override
    @Transactional
    public ScheduleResponse cancelSchedule(Long id, String currentUserEmail, boolean isAdmin) {
        ScheduledPost schedule = scheduledPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));

        if (!isAdmin && !schedule.getRestaurant().getOwner().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new UnauthorizedException("Not authorized");
        }

        schedule.setStatus(ScheduleStatus.CANCELLED);
        ScheduledPost saved = scheduledPostRepository.save(schedule);

        if (saved.getPost() != null) {
            Post post = saved.getPost();
            post.setStatus(PostStatus.CANCELLED);
            postRepository.save(post);
        }

        return mapToScheduleResponse(saved);
    }

    private ScheduleResponse mapToScheduleResponse(ScheduledPost s) {
        return ScheduleResponse.builder()
                .id(s.getId())
                .postId(s.getPost() != null ? s.getPost().getId() : null)
                .postTitle(s.getPost() != null ? s.getPost().getTitle() : null)
                .restaurantId(s.getRestaurant().getId())
                .restaurantName(s.getRestaurant().getName())
                .branchId(s.getBranch() != null ? s.getBranch().getId() : null)
                .branchName(s.getBranch() != null ? s.getBranch().getBranchName() : null)
                .platform(s.getPlatform())
                .scheduledDateTime(s.getScheduledDateTime())
                .timezone(s.getTimezone())
                .status(s.getStatus())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
