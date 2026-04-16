package com.esprit.forum.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler metier du Smart Notification System.
 * - Rappels d'inactivite pour utilisateurs sans activite forum recente.
 * - Desactivable en configuration pour rester safe en prod.
 */
@Component
public class NotificationSmartScheduler {

    private final NotificationService notificationService;

    @Value("${notifications.inactivity.enabled:true}")
    private boolean inactivityEnabled;

    public NotificationSmartScheduler(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /** Par defaut: tous les jours a 09:00 serveur. */
    @Scheduled(cron = "${notifications.inactivity-cron:0 0 9 * * *}")
    public void runInactivityReminders() {
        if (!inactivityEnabled) {
            return;
        }
        notificationService.createInactivityReminders();
    }
}
