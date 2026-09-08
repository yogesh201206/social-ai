package com.socialflow.repository;

import com.socialflow.entity.Platform;
import com.socialflow.entity.SocialActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SocialActivityRepository extends JpaRepository<SocialActivity, Long> {

    List<SocialActivity> findByPostIdOrderByCreatedAtDesc(Long postId);

    List<SocialActivity> findByPostIdAndPlatformOrderByCreatedAtDesc(Long postId, Platform platform);

    Optional<SocialActivity> findByPostIdAndPlatformAndPlatformActivityId(Long postId, Platform platform, String platformActivityId);

    boolean existsByPostIdAndPlatformAndPlatformActivityId(Long postId, Platform platform, String platformActivityId);

    void deleteByPostId(Long postId);
}
