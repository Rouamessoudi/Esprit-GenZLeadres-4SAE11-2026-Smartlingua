package com.esprit.messaging.repository;

import com.esprit.messaging.entity.TranslationHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TranslationHistoryRepository extends JpaRepository<TranslationHistory, Long> {
    List<TranslationHistory> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);
}
