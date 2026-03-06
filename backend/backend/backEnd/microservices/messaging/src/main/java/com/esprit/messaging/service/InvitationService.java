package com.esprit.messaging.service;

import com.esprit.messaging.dto.InvitationDTO;
import com.esprit.messaging.entity.Conversation;
import com.esprit.messaging.entity.Invitation;
import com.esprit.messaging.repository.ConversationRepository;
import com.esprit.messaging.repository.InvitationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class InvitationService {
    
    @Autowired
    private InvitationRepository invitationRepository;

    @Autowired
    private ConversationRepository conversationRepository;
    
    /**
     * Créer une nouvelle invitation (ou retourner l'existante si déjà PENDING, pour éviter doublon).
     * L'appelant enverra la notif WebSocket au destinataire dans les deux cas.
     */
    public InvitationDTO createInvitation(Long senderId, Long receiverId,
                                         String message, String invitationType) {
        if (invitationType == null || invitationType.isBlank()) {
            invitationType = "DISCUSSION";
        }
        List<Invitation> existing = invitationRepository.findPendingBySenderAndReceiver(senderId, receiverId);
        if (!existing.isEmpty()) {
            return convertToDTO(existing.get(0));
        }
        Invitation invitation = new Invitation(senderId, receiverId, message, invitationType);
        invitation = invitationRepository.save(invitation);
        invitationRepository.flush();
        if (invitation.getCreatedAt() == null) {
            invitation.setCreatedAt(java.time.LocalDateTime.now());
        }
        if (invitation.getInvitationType() == null || invitation.getInvitationType().isBlank()) {
            invitation.setInvitationType("DISCUSSION");
        }
        return convertToDTO(invitation);
    }
    
    /**
     * Récupérer toutes les invitations reçues par un utilisateur
     */
    public List<InvitationDTO> getReceivedInvitations(Long userId) {
        List<Invitation> invitations = invitationRepository
            .findByReceiverIdOrderByCreatedAtDesc(userId);
        return invitations.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Récupérer toutes les invitations envoyées par un utilisateur
     */
    public List<InvitationDTO> getSentInvitations(Long userId) {
        List<Invitation> invitations = invitationRepository
            .findBySenderIdOrderByCreatedAtDesc(userId);
        return invitations.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Récupérer les invitations en attente pour un utilisateur
     */
    public List<InvitationDTO> getPendingInvitations(Long userId) {
        List<Invitation> invitations = invitationRepository
            .findByReceiverIdAndStatusOrderByCreatedAtDesc(userId, "PENDING");
        return invitations.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Accepter une invitation : met à jour le statut et crée la conversation
     * entre l'expéditeur et le destinataire (si elle n'existe pas encore).
     * Sans cette acceptation, aucun message ne peut être envoyé.
     */
    public InvitationDTO acceptInvitation(Long invitationId) {
        Invitation invitation = invitationRepository.findById(invitationId)
            .orElseThrow(() -> new RuntimeException("Invitation non trouvée"));
        
        if (!invitation.getStatus().equals("PENDING")) {
            throw new RuntimeException("Cette invitation a déjà été traitée");
        }
        
        invitation.setStatus("ACCEPTED");
        invitation = invitationRepository.save(invitation);

        // Créer la conversation pour permettre l'échange de messages
        Long senderId = invitation.getSenderId();
        Long receiverId = invitation.getReceiverId();
        conversationRepository.findConversationBetweenUsers(senderId, receiverId)
            .orElseGet(() -> {
                Conversation conv = new Conversation(senderId, receiverId);
                return conversationRepository.save(conv);
            });

        return convertToDTO(invitation);
    }
    
    /**
     * Rejeter une invitation
     */
    public InvitationDTO rejectInvitation(Long invitationId) {
        Invitation invitation = invitationRepository.findById(invitationId)
            .orElseThrow(() -> new RuntimeException("Invitation non trouvée"));
        
        if (!invitation.getStatus().equals("PENDING")) {
            throw new RuntimeException("Cette invitation a déjà été traitée");
        }
        
        invitation.setStatus("REJECTED");
        invitation = invitationRepository.save(invitation);
        return convertToDTO(invitation);
    }
    
    /**
     * Compter les invitations en attente pour un utilisateur
     */
    public Long countPendingInvitations(Long userId) {
        return invitationRepository.countPendingInvitations(userId);
    }
    
    /**
     * Convertir une entité Invitation en DTO
     */
    private InvitationDTO convertToDTO(Invitation invitation) {
        InvitationDTO dto = new InvitationDTO();
        dto.setId(invitation.getId());
        dto.setSenderId(invitation.getSenderId());
        dto.setReceiverId(invitation.getReceiverId());
        dto.setMessage(invitation.getMessage());
        dto.setInvitationType(invitation.getInvitationType());
        dto.setStatus(invitation.getStatus());
        dto.setCreatedAt(invitation.getCreatedAt());
        dto.setRespondedAt(invitation.getRespondedAt());
        return dto;
    }
}
