package com.esprit.aiassistant.repository;

import com.esprit.aiassistant.entity.ChatHistoryMirror;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatHistoryMirrorRepository extends JpaRepository<ChatHistoryMirror, Long> {
}
