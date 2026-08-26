package com.socialflow.repository;

import com.socialflow.entity.ScheduleStatus;
import com.socialflow.entity.ScheduledPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduledPostRepository extends JpaRepository<ScheduledPost, Long> {
    List<ScheduledPost> findByRestaurantId(Long restaurantId);
    List<ScheduledPost> findByRestaurantOwnerId(Long ownerId);
    List<ScheduledPost> findByRestaurantOwnerEmail(String email);
    List<ScheduledPost> findByStatus(ScheduleStatus status);
}
