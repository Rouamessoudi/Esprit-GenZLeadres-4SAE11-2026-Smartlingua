package com.esprit.messaging.repository;

import com.esprit.messaging.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByLevelIgnoreCaseOrderByCreatedAtDesc(String level);
    List<Resource> findByLevelIgnoreCaseAndCategoryIgnoreCaseOrderByCreatedAtDesc(String level, String category);
    Optional<Resource> findByUrl(String url);
}
