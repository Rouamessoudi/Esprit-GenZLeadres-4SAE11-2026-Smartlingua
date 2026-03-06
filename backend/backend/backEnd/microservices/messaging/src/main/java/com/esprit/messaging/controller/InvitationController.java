package com.esprit.messaging.controller;

import com.esprit.messaging.dto.CreateInvitationRequest;
import com.esprit.messaging.dto.InvitationDTO;
import com.esprit.messaging.entity.Conversation;
import com.esprit.messaging.entity.User;
import com.esprit.messaging.service.InvitationService;
import com.esprit.messaging.repository.ConversationRepository;
import com.esprit.messaging.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/messaging/invitations")
public class InvitationController {

    private static final Logger log = LoggerFactory.getLogger(InvitationController.class);
    
    @Autowired
    private InvitationService invitationService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private UserRepository userRepository;
    
    /**
     * Créer une nouvelle invitation
     * POST /messaging/invitations/create
     */
    @PostMapping("/create")
    public ResponseEntity<?> createInvitation(@RequestBody CreateInvitationRequest request) {
        if (request == null || request.getSenderId() == null || request.getReceiverId() == null) {
            log.warn("[invitation] create: missing senderId or receiverId");
            return ResponseEntity.badRequest().body(Map.of("message", "senderId et receiverId requis."));
        }
        if (request.getSenderId().equals(request.getReceiverId())) {
            log.warn("[invitation] create: self-invite not allowed senderId={}", request.getSenderId());
            return ResponseEntity.badRequest().body(Map.of("message", "Vous ne pouvez pas vous envoyer une invitation à vous-même."));
        }
        if (!userRepository.existsById(request.getReceiverId())) {
            log.warn("[invitation] create: receiverId {} does not exist", request.getReceiverId());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Utilisateur destinataire introuvable."));
        }
        String message = request.getMessage() != null ? request.getMessage().trim() : "";
        String invitationType = request.getInvitationType();
        if (invitationType == null || invitationType.isBlank()) {
            invitationType = "DISCUSSION";
        } else {
            invitationType = invitationType.trim();
        }
        try {
            log.info("[invitation] create: senderId={} receiverId={}", request.getSenderId(), request.getReceiverId());
            InvitationDTO invitation = invitationService.createInvitation(
                request.getSenderId(),
                request.getReceiverId(),
                message,
                invitationType
            );
            Map<String, Object> payload = new HashMap<>();
            payload.put("id", invitation.getId());
            payload.put("senderId", invitation.getSenderId());
            payload.put("receiverId", invitation.getReceiverId());
            payload.put("message", invitation.getMessage());
            payload.put("invitationType", invitation.getInvitationType());
            payload.put("status", invitation.getStatus());
            payload.put("createdAt", invitation.getCreatedAt() != null ? invitation.getCreatedAt().toString() : null);
            String destination = "/queue/invitations/" + request.getReceiverId();
            messagingTemplate.convertAndSend(destination, (Object) payload);
            log.info("[invitation] create: id={} WS sent to {}", invitation.getId(), destination);
            return ResponseEntity.status(HttpStatus.CREATED).body(invitation);
        } catch (jakarta.persistence.PersistenceException e) {
            log.error("[invitation] create persistence error", e);
            String msg = "Données invalides pour l'invitation.";
            if (e.getCause() != null && e.getCause().getMessage() != null) {
                String cause = e.getCause().getMessage();
                if (cause.contains("invitationType") || cause.contains("invitation_type")) {
                    msg = "Type d'invitation manquant ou invalide.";
                }
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", msg));
        } catch (Exception e) {
            log.error("[invitation] create error", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Erreur lors de la création de l'invitation."));
        }
    }
    
    /**
     * Récupérer toutes les invitations reçues par un utilisateur
     * GET /messaging/invitations/received/{userId}
     */
    @GetMapping("/received/{userId}")
    public ResponseEntity<List<InvitationDTO>> getReceivedInvitations(
            @PathVariable Long userId) {
        List<InvitationDTO> invitations = invitationService.getReceivedInvitations(userId);
        return ResponseEntity.ok(invitations);
    }
    
    /**
     * Récupérer toutes les invitations envoyées par un utilisateur
     * GET /messaging/invitations/sent/{userId}
     */
    @GetMapping("/sent/{userId}")
    public ResponseEntity<List<InvitationDTO>> getSentInvitations(
            @PathVariable Long userId) {
        List<InvitationDTO> invitations = invitationService.getSentInvitations(userId);
        return ResponseEntity.ok(invitations);
    }
    
    /**
     * Récupérer les invitations en attente pour un utilisateur
     * GET /messaging/invitations/pending/{userId}
     */
    @GetMapping("/pending/{userId}")
    public ResponseEntity<List<InvitationDTO>> getPendingInvitations(
            @PathVariable Long userId) {
        List<InvitationDTO> invitations = invitationService.getPendingInvitations(userId);
        return ResponseEntity.ok(invitations);
    }
    
    /**
     * Accepter une invitation
     * PUT /messaging/invitations/{invitationId}/accept
     * Notifie l'expéditeur en temps réel via WebSocket pour qu'il puisse démarrer la conversation.
     */
    @PutMapping("/{invitationId}/accept")
    public ResponseEntity<?> acceptInvitation(@PathVariable Long invitationId) {
        try {
            InvitationDTO invitation = invitationService.acceptInvitation(invitationId);
            Long senderId = invitation.getSenderId();
            Long acceptedByUserId = invitation.getReceiverId();
            conversationRepository.findConversationBetweenUsers(senderId, acceptedByUserId)
                .ifPresent(conv -> {
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("conversationId", conv.getId());
                    payload.put("acceptedByUserId", acceptedByUserId);
                    userRepository.findById(acceptedByUserId)
                        .map(User::getUsername)
                        .ifPresent(name -> payload.put("acceptedByUsername", name));
                    String destination = "/queue/invitation-accepted/" + senderId;
                    messagingTemplate.convertAndSend(destination, (Object) payload);
                });
            return ResponseEntity.ok(invitation);
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Erreur lors de l'acceptation.";
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", msg));
        }
    }
    
    /**
     * Rejeter une invitation
     * PUT /messaging/invitations/{invitationId}/reject
     * Notifie l'expéditeur en temps réel via WebSocket.
     */
    @PutMapping("/{invitationId}/reject")
    public ResponseEntity<?> rejectInvitation(@PathVariable Long invitationId) {
        try {
            InvitationDTO invitation = invitationService.rejectInvitation(invitationId);
            String destination = "/queue/invitation-rejected/" + invitation.getSenderId();
            Map<String, Object> payload = new HashMap<>();
            payload.put("invitationId", invitation.getId());
            payload.put("status", invitation.getStatus());
            payload.put("receiverId", invitation.getReceiverId());
            messagingTemplate.convertAndSend(destination, (Object) payload);
            return ResponseEntity.ok(invitation);
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Erreur lors du rejet.";
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", msg));
        }
    }
    
    /**
     * Compter les invitations en attente pour un utilisateur
     * GET /messaging/invitations/pending-count/{userId}
     */
    @GetMapping("/pending-count/{userId}")
    public ResponseEntity<Long> getPendingCount(@PathVariable Long userId) {
        Long count = invitationService.countPendingInvitations(userId);
        return ResponseEntity.ok(count);
    }
}
