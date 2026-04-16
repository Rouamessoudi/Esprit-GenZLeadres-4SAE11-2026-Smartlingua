package com.esprit.messaging.repository;

import com.esprit.messaging.entity.ChatHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatHistoryRepository extends JpaRepository<ChatHistory, Long> {
    List<ChatHistory> findTop30ByUserIdOrderByCreatedAtDesc(Long userId);
}
