package com.socialflow.repository;

import com.socialflow.entity.EmailCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailCampaignRepository extends JpaRepository<EmailCampaign, Long> {
    List<EmailCampaign> findByRestaurantId(Long restaurantId);
    List<EmailCampaign> findByRestaurantOwnerId(Long ownerId);
    List<EmailCampaign> findByRestaurantOwnerEmail(String email);
}
