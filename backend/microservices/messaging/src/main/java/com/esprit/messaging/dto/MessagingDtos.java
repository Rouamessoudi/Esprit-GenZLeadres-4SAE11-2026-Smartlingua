package com.esprit.messaging.dto;

import java.time.LocalDateTime;
import java.util.List;

public class MessagingDtos {

    public record ParticipantDto(
        Long id,
        String username,
        String displayName,
        String role
    ) {}

    public record ConversationDto(
        Long id,
        Long teacherId,
        Long studentId,
        String teacherName,
        String studentName,
        String lastMessagePreview,
        LocalDateTime updatedAt
    ) {}

    public record MessageDto(
        Long id,
        Long conversationId,
        Long senderId,
        Long receiverId,
        String content,
        LocalDateTime createdAt,
        boolean read
    ) {}

    public record SendMessageRequest(
        String content
    ) {}

    public record CreateConversationRequest(
        Long participantId
    ) {}

    public record RoleSnapshotDto(
        String sub,
        String username,
        List<String> roles
    ) {}
}
