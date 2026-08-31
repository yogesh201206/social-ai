package com.socialflow.repository;

import com.socialflow.entity.Platform;
import com.socialflow.entity.SocialAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SocialAccountRepository extends JpaRepository<SocialAccount, Long> {

    List<SocialAccount> findByUserEmail(String email);

    List<SocialAccount> findByRestaurantOwnerEmail(String email);

    Optional<SocialAccount> findByRestaurantIdAndPlatform(Long restaurantId, Platform platform);

    List<SocialAccount> findByRestaurantId(Long restaurantId);

    Optional<SocialAccount> findByOauthState(String oauthState);
}
