package com.esprit.messaging.repository;

import com.esprit.messaging.entity.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, Long> {
    
    // Récupérer toutes les invitations reçues par un utilisateur
    List<Invitation> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);
    
    // Récupérer toutes les invitations envoyées par un utilisateur
    List<Invitation> findBySenderIdOrderByCreatedAtDesc(Long senderId);
    
    // Récupérer les invitations en attente pour un utilisateur
    List<Invitation> findByReceiverIdAndStatusOrderByCreatedAtDesc(Long receiverId, String status);
    
    // Compter les invitations en attente pour un utilisateur
    @Query("SELECT COUNT(i) FROM Invitation i WHERE i.receiverId = :userId AND i.status = 'PENDING'")
    Long countPendingInvitations(@Param("userId") Long userId);

    // Invitation en attente déjà envoyée (éviter doublon, ré-envoyer la notif WS si besoin)
    @Query("SELECT i FROM Invitation i WHERE i.senderId = :senderId AND i.receiverId = :receiverId AND i.status = 'PENDING' ORDER BY i.createdAt DESC")
    List<Invitation> findPendingBySenderAndReceiver(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);
}
