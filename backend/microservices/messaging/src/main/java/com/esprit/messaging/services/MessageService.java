package com.esprit.messaging.services;

import com.esprit.messaging.dto.MessageRequest;
import com.esprit.messaging.entities.MessageEntity;
import com.esprit.messaging.repositories.MessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MessageService {
    private static final Logger log = LoggerFactory.getLogger(MessageService.class);

    private final MessageRepository messageRepository;

    public MessageService(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    public MessageEntity createMessage(MessageRequest request) {
        if (request.getSenderId() == null || request.getReceiverId() == null) {
            throw new IllegalArgumentException("senderId and receiverId are required");
        }
        String content = request.getContent() == null ? "" : request.getContent().trim();
        if (content.isBlank()) {
            throw new IllegalArgumentException("content is required");
        }

        MessageEntity message = new MessageEntity();
        message.setSenderId(request.getSenderId());
        message.setReceiverId(request.getReceiverId());
        message.setContent(content);

        log.info("Saving message senderId={} receiverId={} content='{}'",
            message.getSenderId(), message.getReceiverId(), shorten(content, 120));
        MessageEntity saved = messageRepository.save(message);
        log.info("Saved message id={} timestamp={}", saved.getId(), saved.getTimestamp());
        return saved;
    }

    public List<MessageEntity> conversationMessages(Long userId, Long peerId) {
        if (userId == null || peerId == null) {
            throw new IllegalArgumentException("userId and peerId are required");
        }
        return messageRepository.findBySenderIdAndReceiverIdOrSenderIdAndReceiverIdOrderByTimestampAsc(
            userId, peerId, peerId, userId
        );
    }

    private String shorten(String value, int maxLen) {
        if (value == null) {
            return "";
        }
        return value.length() <= maxLen ? value : value.substring(0, maxLen);
    }
}
