package com.esprit.messaging.controllers;

import com.esprit.messaging.dto.MessagingDtos;
import com.esprit.messaging.services.MessagingRelationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/messaging")
public class MessagingRelationController {

    private final MessagingRelationService relationService;

    public MessagingRelationController(MessagingRelationService relationService) {
        this.relationService = relationService;
    }

    @GetMapping("/me")
    public ResponseEntity<MessagingDtos.RoleSnapshotDto> me() {
        return ResponseEntity.ok(relationService.roleSnapshot());
    }

    @GetMapping("/teacher/students")
    public ResponseEntity<List<MessagingDtos.ParticipantDto>> teacherStudents() {
        return ResponseEntity.ok(relationService.teacherStudents());
    }

    @GetMapping("/student/teacher")
    public ResponseEntity<MessagingDtos.ParticipantDto> studentTeacher() {
        return ResponseEntity.ok(relationService.studentTeacher());
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<MessagingDtos.ConversationDto>> conversations() {
        return ResponseEntity.ok(relationService.conversationsForCurrentUser());
    }

    @PostMapping("/conversations")
    public ResponseEntity<MessagingDtos.ConversationDto> createConversation(
        @RequestBody MessagingDtos.CreateConversationRequest request
    ) {
        return ResponseEntity.ok(relationService.createConversationForCurrentUser(request));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<MessagingDtos.MessageDto>> messages(@PathVariable("id") Long id) {
        return ResponseEntity.ok(relationService.conversationMessages(id));
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<MessagingDtos.MessageDto> send(
        @PathVariable("id") Long id,
        @RequestBody MessagingDtos.SendMessageRequest request
    ) {
        return ResponseEntity.ok(relationService.sendMessage(id, request));
    }

    @PostMapping("/teacher/students/{studentId}/messages")
    public ResponseEntity<MessagingDtos.MessageDto> sendTeacherToStudent(
        @PathVariable("studentId") Long studentId,
        @RequestBody MessagingDtos.SendMessageRequest request
    ) {
        return ResponseEntity.ok(relationService.sendTeacherMessageToStudent(studentId, request));
    }

    @DeleteMapping("/admin/messages/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMessageAsAdmin(@PathVariable("id") Long id) {
        relationService.deleteMessageForAdmin(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/conversations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MessagingDtos.ConversationDto>> adminConversations() {
        return ResponseEntity.ok(relationService.adminSupervisedConversations());
    }

    @GetMapping("/admin/conversations/{teacherId}/{studentId}/messages")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MessagingDtos.MessageDto>> adminConversationMessages(
        @PathVariable("teacherId") Long teacherId,
        @PathVariable("studentId") Long studentId
    ) {
        return ResponseEntity.ok(relationService.adminConversationMessages(teacherId, studentId));
    }
}
