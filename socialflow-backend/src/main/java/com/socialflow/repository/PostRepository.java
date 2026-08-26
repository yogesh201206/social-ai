package com.socialflow.repository;

import com.socialflow.entity.Post;
import com.socialflow.entity.PostStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByRestaurantId(Long restaurantId);
    List<Post> findByRestaurantOwnerId(Long ownerId);
    List<Post> findByRestaurantOwnerEmail(String email);
    List<Post> findByStatus(PostStatus status);
    List<Post> findByRestaurantOwnerEmailAndStatus(String email, PostStatus status);
}
