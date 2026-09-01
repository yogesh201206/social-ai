package com.socialflow.repository;

import com.socialflow.entity.ScheduleStatus;
import com.socialflow.entity.ScheduledPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScheduledPostRepository extends JpaRepository<ScheduledPost, Long> {
    List<ScheduledPost> findByRestaurantId(Long restaurantId);
    List<ScheduledPost> findByRestaurantOwnerId(Long ownerId);
    List<ScheduledPost> findByRestaurantOwnerEmail(String email);
    List<ScheduledPost> findByStatus(ScheduleStatus status);
    List<ScheduledPost> findByPostId(Long postId);
    void deleteByPostId(Long postId);

    @Query("""
        SELECT sp
        FROM ScheduledPost sp
        JOIN FETCH sp.post p
        JOIN FETCH sp.restaurant r
        WHERE sp.status = :status
          AND sp.scheduledDateTime <= :dateTime
    """)
    List<ScheduledPost> findByStatusAndScheduledDateTimeBefore(
            @Param("status") ScheduleStatus status,
            @Param("dateTime") LocalDateTime dateTime);
}
