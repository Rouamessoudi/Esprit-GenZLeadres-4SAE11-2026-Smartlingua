package com.esprit.messaging.service;

import com.esprit.messaging.dto.ConversationDTO;
import com.esprit.messaging.dto.MessageDTO;
import com.esprit.messaging.entity.Conversation;
import com.esprit.messaging.entity.Message;
import com.esprit.messaging.repository.ConversationRepository;
import com.esprit.messaging.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ConversationService {
    
    @Autowired
    private ConversationRepository conversationRepository;
    
    @Autowired
    private MessageRepository messageRepository;
    
    /**
     * Récupérer toutes les conversations d'un utilisateur
     */
    public List<ConversationDTO> getUserConversations(Long userId) {
        List<Conversation> conversations = conversationRepository
            .findConversationsByUserId(userId);
        
        return conversations.stream()
            .map(conv -> convertToListDTO(conv, userId))
            .collect(Collectors.toList());
    }
    
    /**
     * DTO pour la liste (dernier message + unread, sans charger tous les messages)
     */
    private ConversationDTO convertToListDTO(Conversation conversation, Long currentUserId) {
        ConversationDTO dto = new ConversationDTO();
        dto.setId(conversation.getId());
        dto.setParticipant1Id(conversation.getParticipant1Id());
        dto.setParticipant2Id(conversation.getParticipant2Id());
        dto.setCreatedAt(conversation.getCreatedAt());
        dto.setUpdatedAt(conversation.getUpdatedAt());
        dto.setMessages(null);
        
        messageRepository.findTop1ByConversationIdOrderByTimestampDesc(conversation.getId())
            .ifPresent(last -> {
                dto.setLastMessagePreview(last.getContent());
                dto.setLastMessageAt(last.getTimestamp());
            });
        
        long unread = messageRepository.countByConversationIdAndReceiverIdAndIsReadFalse(
            conversation.getId(), currentUserId);
        dto.setUnreadCount(unread);
        
        return dto;
    }
    
    /**
     * Récupérer une conversation spécifique avec ses messages
     */
    public ConversationDTO getConversationById(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new RuntimeException("Conversation non trouvée"));
        
        // Vérifier que l'utilisateur fait partie de la conversation
        if (!conversation.getParticipant1Id().equals(userId) && 
            !conversation.getParticipant2Id().equals(userId)) {
            throw new RuntimeException("Accès non autorisé à cette conversation");
        }
        
        return convertToDTO(conversation, userId);
    }
    
    /**
     * Récupérer une conversation entre deux utilisateurs (sans la créer).
     * Retourne empty si aucune conversation (invitation non acceptée).
     */
    public Optional<ConversationDTO> getConversationBetweenUsers(Long userId1, Long userId2) {
        return conversationRepository.findConversationBetweenUsers(userId1, userId2)
            .map(conv -> convertToDTO(conv, userId1));
    }
    
    /**
     * Récupérer une conversation entre deux utilisateurs.
     * Ne crée plus de conversation : une conversation n'existe qu'après acceptation d'une invitation.
     * @throws RuntimeException si aucune conversation n'existe
     */
    public ConversationDTO getOrCreateConversation(Long userId1, Long userId2) {
        Conversation conversation = conversationRepository
            .findConversationBetweenUsers(userId1, userId2)
            .orElseThrow(() -> new RuntimeException(
                "Aucune conversation. Envoyez une invitation et attendez que le destinataire l'accepte."));
        
        return convertToDTO(conversation, userId1);
    }
    
    /**
     * Convertir une entité Conversation en DTO
     */
    private ConversationDTO convertToDTO(Conversation conversation, Long currentUserId) {
        ConversationDTO dto = new ConversationDTO();
        dto.setId(conversation.getId());
        dto.setParticipant1Id(conversation.getParticipant1Id());
        dto.setParticipant2Id(conversation.getParticipant2Id());
        dto.setCreatedAt(conversation.getCreatedAt());
        dto.setUpdatedAt(conversation.getUpdatedAt());
        
        // Récupérer les messages de la conversation
        List<MessageDTO> messages = messageRepository
            .findByConversationIdOrderByTimestampAsc(conversation.getId())
            .stream()
            .map(msg -> {
                MessageDTO msgDto = new MessageDTO();
                msgDto.setId(msg.getId());
                msgDto.setSenderId(msg.getSenderId());
                msgDto.setReceiverId(msg.getReceiverId());
                msgDto.setContent(msg.getContent());
                msgDto.setTimestamp(msg.getTimestamp());
                msgDto.setIsRead(msg.getIsRead());
                msgDto.setConversationId(conversation.getId());
                return msgDto;
            })
            .collect(Collectors.toList());
        
        dto.setMessages(messages);
        
        // Compter les messages non lus pour l'utilisateur actuel
        Long unreadCount = messages.stream()
            .filter(msg -> msg.getReceiverId().equals(currentUserId) && !msg.getIsRead())
            .count();
        dto.setUnreadCount(unreadCount);
        
        return dto;
    }
}
