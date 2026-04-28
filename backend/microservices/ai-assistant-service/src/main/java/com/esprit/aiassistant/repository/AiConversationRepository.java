package com.esprit.aiassistant.repository;

import com.esprit.aiassistant.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {
    List<AiConversation> findByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<AiConversation> findByIdAndUserId(Long id, Long userId);

    long deleteByUserId(Long userId);
}
