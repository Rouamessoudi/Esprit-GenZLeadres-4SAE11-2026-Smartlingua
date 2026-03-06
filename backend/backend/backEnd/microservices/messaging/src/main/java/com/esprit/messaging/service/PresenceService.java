package com.esprit.messaging.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Présence en mémoire : heartbeat enregistre l'utilisateur comme online,
 * un job nettoie les entrées trop anciennes.
 */
@Service
public class PresenceService {

    /** Durée en secondes après laquelle on considère offline (absence de heartbeat) */
    private static final int OFFLINE_THRESHOLD_SEC = 90;

    /** userId -> last heartbeat instant */
    private final Map<Long, Instant> presence = new ConcurrentHashMap<>();

    public void heartbeat(Long userId) {
        if (userId != null) {
            presence.put(userId, Instant.now());
        }
    }

    public List<Long> getOnlineUserIds() {
        evictStale();
        Instant cutoff = Instant.now().minusSeconds(OFFLINE_THRESHOLD_SEC);
        return presence.entrySet().stream()
            .filter(e -> e.getValue().isAfter(cutoff))
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
    }

    public boolean isOnline(Long userId) {
        if (userId == null) return false;
        Instant last = presence.get(userId);
        if (last == null) return false;
        return last.isAfter(Instant.now().minusSeconds(OFFLINE_THRESHOLD_SEC));
    }

    /** À appeler périodiquement pour nettoyer (ou via @Scheduled si activé) */
    public void evictStale() {
        Instant cutoff = Instant.now().minusSeconds(OFFLINE_THRESHOLD_SEC);
        presence.entrySet().removeIf(e -> e.getValue().isBefore(cutoff));
    }
}
