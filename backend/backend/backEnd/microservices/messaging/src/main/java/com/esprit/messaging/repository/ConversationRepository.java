package com.esprit.messaging.repository;

import com.esprit.messaging.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    
    // Trouver une conversation entre deux utilisateurs
    @Query("SELECT c FROM Conversation c WHERE " +
           "(c.participant1Id = :userId1 AND c.participant2Id = :userId2) OR " +
           "(c.participant1Id = :userId2 AND c.participant2Id = :userId1)")
    Optional<Conversation> findConversationBetweenUsers(@Param("userId1") Long userId1, 
                                                         @Param("userId2") Long userId2);
    
    // Récupérer toutes les conversations d'un utilisateur
    @Query("SELECT c FROM Conversation c WHERE c.participant1Id = :userId OR c.participant2Id = :userId " +
           "ORDER BY c.updatedAt DESC")
    List<Conversation> findConversationsByUserId(@Param("userId") Long userId);
    
    // Vérifier si une conversation existe entre deux utilisateurs
    @Query("SELECT COUNT(c) > 0 FROM Conversation c WHERE " +
           "(c.participant1Id = :userId1 AND c.participant2Id = :userId2) OR " +
           "(c.participant1Id = :userId2 AND c.participant2Id = :userId1)")
    boolean existsConversationBetweenUsers(@Param("userId1") Long userId1, 
                                          @Param("userId2") Long userId2);
}
