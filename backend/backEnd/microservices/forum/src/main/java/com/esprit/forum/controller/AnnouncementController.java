package com.esprit.forum.controller;

import com.esprit.forum.dto.AnnouncementRequest;
import com.esprit.forum.entity.Announcement;
import com.esprit.forum.service.AnnouncementService;
import com.esprit.forum.service.RoleAccessService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/forum/announcements")
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final RoleAccessService roleAccessService;

    public AnnouncementController(AnnouncementService announcementService, RoleAccessService roleAccessService) {
        this.announcementService = announcementService;
        this.roleAccessService = roleAccessService;
    }

    @GetMapping
    public ResponseEntity<List<Announcement>> getAllAnnouncements(
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader) {
        roleAccessService.assertAuthenticated(userIdHeader);
        return ResponseEntity.ok(announcementService.findAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Announcement>> getActiveAnnouncements(
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader) {
        roleAccessService.assertAuthenticated(userIdHeader);
        return ResponseEntity.ok(announcementService.findActiveAnnouncements());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Announcement> getAnnouncementById(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader) {
        roleAccessService.assertAuthenticated(userIdHeader);
        return announcementService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Announcement> createAnnouncement(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @Valid @RequestBody AnnouncementRequest request) {
        roleAccessService.assertAuthenticated(userIdHeader);
        roleAccessService.assertAnnouncementManageRole(role);
        Announcement announcement = new Announcement();
        announcement.setTitle(request.getTitle());
        announcement.setContent(request.getContent());
        announcement.setAuthorId(request.getAuthorId());
        announcement.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        Announcement created = announcementService.create(announcement);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Announcement> updateAnnouncement(@PathVariable Long id,
                                                           @RequestHeader(value = "X-User-Role", required = false) String role,
                                                           @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
                                                           @Valid @RequestBody AnnouncementRequest request) {
        roleAccessService.assertAuthenticated(userIdHeader);
        roleAccessService.assertAnnouncementManageRole(role);
        try {
            Announcement announcement = new Announcement();
            announcement.setTitle(request.getTitle());
            announcement.setContent(request.getContent());
            announcement.setAuthorId(request.getAuthorId());
            announcement.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
            Announcement updated = announcementService.update(id, announcement);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnnouncement(@PathVariable Long id,
                                                   @RequestHeader(value = "X-User-Role", required = false) String role,
                                                   @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader) {
        roleAccessService.assertAuthenticated(userIdHeader);
        roleAccessService.assertAnnouncementManageRole(role);
        try {
            announcementService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

}
