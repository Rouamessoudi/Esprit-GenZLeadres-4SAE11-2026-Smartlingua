package com.esprit.forum.controller;

import com.esprit.forum.dto.NotificationRequest;
import com.esprit.forum.entity.Notification;
import com.esprit.forum.entity.NotificationType;
import com.esprit.forum.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * API REST du module Notifications (microservice forum, port 8090).
 * Securite simple : header {@code X-User-Id} doit egaler {@code userId} en query (sinon 403).
 * Le front envoie l'id de la session locale (AuthApiService).
 */
@RestController
@RequestMapping("/forum/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    public ResponseEntity<Notification> create(@Valid @RequestBody NotificationRequest request) {
        Notification created = notificationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getByUser(
            @RequestParam Long userId,
            @RequestParam(required = false) Boolean unreadOnly,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) String priority,
            @RequestHeader(value = "X-User-Id", required = false) Long requesterId
    ) {
        ensureSelf(userId, requesterId);
        return ResponseEntity.ok(notificationService.getNotifications(userId, unreadOnly, type, priority));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @RequestParam Long userId,
            @RequestHeader(value = "X-User-Id", required = false) Long requesterId
    ) {
        ensureSelf(userId, requesterId);
        long count = notificationService.countUnread(userId);
        Map<String, Long> response = new HashMap<>();
        response.put("unreadCount", count);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestHeader(value = "X-User-Id", required = false) Long requesterId
    ) {
        ensureSelf(userId, requesterId);
        return ResponseEntity.ok(notificationService.markAsRead(id, userId));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllAsRead(
            @RequestParam Long userId,
            @RequestHeader(value = "X-User-Id", required = false) Long requesterId
    ) {
        ensureSelf(userId, requesterId);
        int updated = notificationService.markAllAsRead(userId);
        Map<String, Integer> response = new HashMap<>();
        response.put("updated", updated);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestHeader(value = "X-User-Id", required = false) Long requesterId
    ) {
        ensureSelf(userId, requesterId);
        notificationService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    /** Un utilisateur ne peut lire/modifier que SES notifications (pas celles d'un autre id). */
    private void ensureSelf(Long userId, Long requesterId) {
        if (requesterId == null || !requesterId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acces non autorise aux notifications.");
        }
    }
}
