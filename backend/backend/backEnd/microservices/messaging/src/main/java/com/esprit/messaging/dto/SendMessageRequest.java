package com.esprit.messaging.dto;

public class SendMessageRequest {
    private Long receiverId;
    private String content;
    
    // Constructeurs
    public SendMessageRequest() {
    }
    
    public SendMessageRequest(Long receiverId, String content) {
        this.receiverId = receiverId;
        this.content = content;
    }
    
    // Getters et Setters
    public Long getReceiverId() {
        return receiverId;
    }
    
    public void setReceiverId(Long receiverId) {
        this.receiverId = receiverId;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
}
