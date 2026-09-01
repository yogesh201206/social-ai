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
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduledPostServiceImpl implements ScheduledPostService {

    private final ScheduledPostRepository scheduledPostRepository;
    private final PostRepository postRepository;
    private final RestaurantRepository restaurantRepository;
    private final BranchRepository branchRepository;

    private LocalDateTime convertToUtc(LocalDateTime localDateTime, String timezone) {
        if (localDateTime == null) return null;
        String tz = (timezone != null && !timezone.isBlank()) ? timezone : "Asia/Kolkata";
        ZoneId zoneId;
        try {
            zoneId = ZoneId.of(tz);
        } catch (Exception e) {
            zoneId = ZoneId.of("Asia/Kolkata");
        }
        ZonedDateTime userZoned = localDateTime.atZone(zoneId);
        return userZoned.withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
    }

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

        String tzStr = (request.getTimezone() != null && !request.getTimezone().isBlank())
                ? request.getTimezone()
                : "Asia/Kolkata";
        LocalDateTime utcDateTime = convertToUtc(request.getScheduledDateTime(), tzStr);

        if (utcDateTime.isBefore(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1))) {
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
            post.setScheduledAt(utcDateTime);
            post.setTimezone(tzStr);
            postRepository.save(post);
        }

        ScheduledPost schedule = ScheduledPost.builder()
                .post(post)
                .restaurant(restaurant)
                .branch(branch)
                .platform(request.getPlatform())
                .scheduledDateTime(utcDateTime)
                .timezone(tzStr)
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

        String tzStr = (request.getTimezone() != null && !request.getTimezone().isBlank())
                ? request.getTimezone()
                : (schedule.getTimezone() != null ? schedule.getTimezone() : "Asia/Kolkata");

        if (request.getScheduledDateTime() != null) {
            LocalDateTime utcDateTime = convertToUtc(request.getScheduledDateTime(), tzStr);
            if (utcDateTime.isBefore(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1))) {
                throw new BadRequestException("Scheduled date and time must be in the future");
            }
            schedule.setScheduledDateTime(utcDateTime);
        }

        if (request.getTimezone() != null) schedule.setTimezone(tzStr);
        if (request.getStatus() != null) schedule.setStatus(request.getStatus());

        ScheduledPost saved = scheduledPostRepository.save(schedule);

        if (saved.getPost() != null) {
            Post post = saved.getPost();
            if (saved.getStatus() == ScheduleStatus.SCHEDULED) {
                post.setStatus(PostStatus.SCHEDULED);
                post.setScheduledAt(saved.getScheduledDateTime());
                post.setTimezone(saved.getTimezone());
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
