package com.esprit.forum.service;

import com.esprit.forum.entity.Announcement;
import com.esprit.forum.entity.NotificationType;
import com.esprit.forum.repository.AnnouncementRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final NotificationService notificationService;

    public AnnouncementService(AnnouncementRepository announcementRepository, NotificationService notificationService) {
        this.announcementRepository = announcementRepository;
        this.notificationService = notificationService;
    }

    public List<Announcement> findAll() {
        return announcementRepository.findAll();
    }

    public List<Announcement> findActiveAnnouncements() {
        return announcementRepository.findByIsActiveTrueOrderByPublishedAtDesc();
    }

    public Optional<Announcement> findById(Long id) {
        return announcementRepository.findById(id);
    }

    public Announcement create(Announcement announcement) {
        Announcement created = announcementRepository.save(announcement);
        // Module Notifications : alerte tous les comptes utilisateurs (sauf l'auteur), via liste users + persistance MySQL.
        notificationService.notifyAllUsersExcept(
                created.getAuthorId(),
                "Nouvelle annonce",
                created.getTitle(),
                NotificationType.ANNOUNCEMENT,
                "ANNOUNCEMENT",
                created.getId(),
                "/announcements/" + created.getId()
        );
        return created;
    }

    public Announcement update(Long id, Announcement announcementDetails) {
        return announcementRepository.findById(id)
                .map(existing -> {
                    existing.setTitle(announcementDetails.getTitle());
                    existing.setContent(announcementDetails.getContent());
                    if (announcementDetails.getIsActive() != null) {
                        existing.setIsActive(announcementDetails.getIsActive());
                    }
                    if (announcementDetails.getPublishedAt() != null) {
                        existing.setPublishedAt(announcementDetails.getPublishedAt());
                    }
                    return announcementRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Announcement not found with id: " + id));
    }

    public void delete(Long id) {
        announcementRepository.deleteById(id);
    }
}
