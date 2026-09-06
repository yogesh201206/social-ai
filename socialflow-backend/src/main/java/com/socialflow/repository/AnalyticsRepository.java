package com.socialflow.repository;

import com.socialflow.entity.Analytics;
import com.socialflow.entity.Platform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnalyticsRepository extends JpaRepository<Analytics, Long> {
    List<Analytics> findByRestaurantId(Long restaurantId);
    List<Analytics> findByRestaurantOwnerEmail(String email);
    List<Analytics> findByRestaurantIdAndPlatform(Long restaurantId, Platform platform);
    Optional<Analytics> findByRestaurantIdAndPlatformAndDate(Long restaurantId, Platform platform, LocalDate date);
}
