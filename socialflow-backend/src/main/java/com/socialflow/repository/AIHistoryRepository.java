package com.socialflow.repository;

import com.socialflow.entity.AIHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIHistoryRepository extends JpaRepository<AIHistory, Long> {
    List<AIHistory> findByUserId(Long userId);
    List<AIHistory> findByUserEmail(String email);
}
