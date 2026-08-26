package com.socialflow.repository;

import com.socialflow.entity.Analytics;
import com.socialflow.entity.Platform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalyticsRepository extends JpaRepository<Analytics, Long> {
    List<Analytics> findByRestaurantId(Long restaurantId);
    List<Analytics> findByRestaurantOwnerEmail(String email);
    List<Analytics> findByRestaurantIdAndPlatform(Long restaurantId, Platform platform);
}
