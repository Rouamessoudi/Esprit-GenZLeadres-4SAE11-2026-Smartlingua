package com.esprit.messaging.repositories;

import com.esprit.messaging.entities.MessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {
    List<MessageEntity> findBySenderIdAndReceiverIdOrSenderIdAndReceiverIdOrderByTimestampAsc(
        Long senderA, Long receiverA, Long senderB, Long receiverB
    );

    List<MessageEntity> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    List<MessageEntity> findAllByOrderByCreatedAtDesc();
}
