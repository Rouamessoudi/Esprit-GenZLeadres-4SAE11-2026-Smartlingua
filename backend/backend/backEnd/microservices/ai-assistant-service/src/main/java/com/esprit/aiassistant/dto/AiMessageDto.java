package com.esprit.aiassistant.dto;

import com.esprit.aiassistant.entity.MessageSender;
import com.esprit.aiassistant.entity.MessageType;

import java.time.LocalDateTime;

public class AiMessageDto {
    private Long id;
    private MessageSender sender;
    private MessageType messageType;
    private String content;
    private String imageName;
    private String imageContentType;
    private Long imageSize;
    private LocalDateTime timestamp;

    public AiMessageDto() {
    }

    public AiMessageDto(
        Long id,
        MessageSender sender,
        MessageType messageType,
        String content,
        String imageName,
        String imageContentType,
        Long imageSize,
        LocalDateTime timestamp
    ) {
        this.id = id;
        this.sender = sender;
        this.messageType = messageType;
        this.content = content;
        this.imageName = imageName;
        this.imageContentType = imageContentType;
        this.imageSize = imageSize;
        this.timestamp = timestamp;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MessageSender getSender() {
        return sender;
    }

    public void setSender(MessageSender sender) {
        this.sender = sender;
    }

    public MessageType getMessageType() {
        return messageType;
    }

    public void setMessageType(MessageType messageType) {
        this.messageType = messageType;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getImageName() {
        return imageName;
    }

    public void setImageName(String imageName) {
        this.imageName = imageName;
    }

    public String getImageContentType() {
        return imageContentType;
    }

    public void setImageContentType(String imageContentType) {
        this.imageContentType = imageContentType;
    }

    public Long getImageSize() {
        return imageSize;
    }

    public void setImageSize(Long imageSize) {
        this.imageSize = imageSize;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
