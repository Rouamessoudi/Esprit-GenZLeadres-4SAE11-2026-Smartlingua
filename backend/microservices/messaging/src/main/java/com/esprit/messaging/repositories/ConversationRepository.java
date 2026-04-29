package com.esprit.messaging.repositories;

import com.esprit.messaging.entities.ConversationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<ConversationEntity, Long> {
    Optional<ConversationEntity> findByTeacherIdAndStudentId(Long teacherId, Long studentId);
    List<ConversationEntity> findByTeacherIdOrderByCreatedAtDesc(Long teacherId);
    List<ConversationEntity> findByStudentIdOrderByCreatedAtDesc(Long studentId);
}
