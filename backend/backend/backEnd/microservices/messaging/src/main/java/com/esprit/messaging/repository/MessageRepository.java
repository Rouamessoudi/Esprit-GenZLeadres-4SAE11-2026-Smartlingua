package com.esprit.messaging.repository;

import com.esprit.messaging.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    // Récupérer tous les messages d'une conversation
    List<Message> findByConversationIdOrderByTimestampAsc(Long conversationId);
    
    Optional<Message> findTop1ByConversationIdOrderByTimestampDesc(Long conversationId);
    
    long countByConversationIdAndReceiverIdAndIsReadFalse(Long conversationId, Long receiverId);
    
    // Récupérer les messages entre deux utilisateurs
    @Query("SELECT m FROM Message m WHERE " +
           "(m.senderId = :userId1 AND m.receiverId = :userId2) OR " +
           "(m.senderId = :userId2 AND m.receiverId = :userId1) " +
           "ORDER BY m.timestamp ASC")
    List<Message> findMessagesBetweenUsers(@Param("userId1") Long userId1, 
                                           @Param("userId2") Long userId2);
    
    // Compter les messages non lus pour un utilisateur
    @Query("SELECT COUNT(m) FROM Message m WHERE m.receiverId = :userId AND m.isRead = false")
    Long countUnreadMessages(@Param("userId") Long userId);
    
    // Récupérer les messages non lus pour un utilisateur
    List<Message> findByReceiverIdAndIsReadFalseOrderByTimestampDesc(Long receiverId);
}
