package com.esprit.aiassistant.repository;

import com.esprit.aiassistant.entity.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {
    List<AiMessage> findByConversationIdOrderByTimestampAsc(Long conversationId);
}
