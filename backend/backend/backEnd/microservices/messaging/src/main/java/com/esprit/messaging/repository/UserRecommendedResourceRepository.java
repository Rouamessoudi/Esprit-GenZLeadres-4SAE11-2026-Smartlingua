package com.esprit.messaging.repository;

import com.esprit.messaging.entity.UserRecommendedResource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRecommendedResourceRepository extends JpaRepository<UserRecommendedResource, Long> {
    List<UserRecommendedResource> findTop50ByUserIdOrderByRecommendedAtDesc(Long userId);
    boolean existsByUserIdAndResource_Id(Long userId, Long resourceId);
}
