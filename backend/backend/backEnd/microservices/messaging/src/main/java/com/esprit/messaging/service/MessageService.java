package com.esprit.messaging.service;

import com.esprit.messaging.dto.MessageDTO;
import com.esprit.messaging.entity.Conversation;
import com.esprit.messaging.entity.Message;
import com.esprit.messaging.repository.ConversationRepository;
import com.esprit.messaging.repository.MessageRepository;
import com.esprit.messaging.service.BadWordService.FilterResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@Transactional
public class MessageService {
    
    private static final Logger log = LoggerFactory.getLogger(MessageService.class);
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private BlockService blockService;

    @Autowired
    private BadWordService badWordService;
    
    /**
     * Envoyer un message entre deux utilisateurs.
     * La conversation doit exister (créée lorsqu'une invitation a été acceptée).
     */
    public MessageDTO sendMessage(Long senderId, Long receiverId, String content) {
        // Utilisateur banni : refuser l'envoi
        if (badWordService.isBanned(senderId)) {
            LocalDateTime until = badWordService.getBannedUntil(senderId);
            String untilStr = until == null ? "" : until.format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm", Locale.FRANCE));
            throw new RuntimeException("Vous êtes banni jusqu'au " + untilStr + ". Vous ne pouvez pas envoyer de messages.");
        }

        // Si le destinataire a bloqué l'expéditeur, refuser l'envoi
        if (blockService.isBlocked(receiverId, senderId)) {
            throw new RuntimeException("Vous ne pouvez pas envoyer de message à cet utilisateur.");
        }

        Conversation conversation = conversationRepository
            .findConversationBetweenUsers(senderId, receiverId)
            .orElseThrow(() -> new RuntimeException(
                "Aucune conversation avec ce destinataire. Il doit d'abord accepter votre invitation pour pouvoir échanger des messages."));

        // Filtrer les mots interdits sur le texte uniquement (pas les images en base64)
        String contentToSave = content;
        boolean hadBadWord = false;
        if (content != null && !content.startsWith("data:")) {
            FilterResult filtered = badWordService.filterContent(content);
            contentToSave = filtered.getContent();
            hadBadWord = filtered.hadBadWord();
            if (hadBadWord) {
                log.info("Message contenait un mot interdit: senderId={}, contenu filtré pour le destinataire", senderId);
            }
        }
        if (hadBadWord) {
            badWordService.banUser(senderId);
        }
        
        // Créer et sauvegarder le message (contenu déjà filtré pour le destinataire)
        Message message = new Message(senderId, receiverId, contentToSave);
        conversation.addMessage(message);
        message = messageRepository.save(message);
        
        return convertToDTO(message);
    }
    
    /**
     * Récupérer tous les messages d'une conversation
     */
    public List<MessageDTO> getConversationMessages(Long conversationId) {
        List<Message> messages = messageRepository
            .findByConversationIdOrderByTimestampAsc(conversationId);
        return messages.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Récupérer les messages entre deux utilisateurs
     */
    public List<MessageDTO> getMessagesBetweenUsers(Long userId1, Long userId2) {
        List<Message> messages = messageRepository
            .findMessagesBetweenUsers(userId1, userId2);
        return messages.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Marquer les messages comme lus
     */
    public void markMessagesAsRead(Long userId, Long conversationId) {
        List<Message> unreadMessages = messageRepository
            .findByConversationIdOrderByTimestampAsc(conversationId)
            .stream()
            .filter(m -> m.getReceiverId().equals(userId) && !m.getIsRead())
            .collect(Collectors.toList());
        
        unreadMessages.forEach(message -> message.setIsRead(true));
        messageRepository.saveAll(unreadMessages);
    }
    
    /**
     * Compter les messages non lus pour un utilisateur
     */
    public Long countUnreadMessages(Long userId) {
        return messageRepository.countUnreadMessages(userId);
    }
    
    /**
     * Récupérer les messages non lus pour un utilisateur
     */
    public List<MessageDTO> getUnreadMessages(Long userId) {
        List<Message> messages = messageRepository
            .findByReceiverIdAndIsReadFalseOrderByTimestampDesc(userId);
        return messages.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Convertir une entité Message en DTO
     */
    private MessageDTO convertToDTO(Message message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setSenderId(message.getSenderId());
        dto.setReceiverId(message.getReceiverId());
        dto.setContent(message.getContent());
        dto.setTimestamp(message.getTimestamp());
        dto.setIsRead(message.getIsRead());
        if (message.getConversation() != null) {
            dto.setConversationId(message.getConversation().getId());
        }
        return dto;
    }
}
