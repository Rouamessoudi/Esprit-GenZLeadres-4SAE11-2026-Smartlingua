package com.esprit.adaptivelearning.integration;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Accès lecture à {@code app_user} (même base que le microservice users), sans Feign.
 */
@Component
public class AppUserLookup {

    @PersistenceContext
    private EntityManager entityManager;

    public boolean existsById(Long id) {
        if (id == null) {
            return false;
        }
        @SuppressWarnings("unchecked")
        var list = entityManager
                .createNativeQuery("SELECT 1 FROM app_user WHERE id = ?1")
                .setParameter(1, id)
                .setMaxResults(1)
                .getResultList();
        return !list.isEmpty();
    }

    public Optional<Long> findIdByKeycloakId(String keycloakId) {
        if (keycloakId == null || keycloakId.isBlank()) {
            return Optional.empty();
        }
        @SuppressWarnings("unchecked")
        var list = entityManager
                .createNativeQuery("SELECT id FROM app_user WHERE keycloak_id = ?1")
                .setParameter(1, keycloakId)
                .setMaxResults(1)
                .getResultList();
        if (list.isEmpty() || list.get(0) == null) {
            return Optional.empty();
        }
        Object v = list.get(0);
        if (v instanceof Number n) {
            return Optional.of(n.longValue());
        }
        return Optional.empty();
    }

    public LearnerIdentity findLearnerIdentity(Long userId) {
        if (userId == null) {
            return LearnerIdentity.empty();
        }
        @SuppressWarnings("unchecked")
        var list = entityManager
                .createNativeQuery(
                        "SELECT first_name, last_name, email FROM app_user WHERE id = ?1"
                )
                .setParameter(1, userId)
                .setMaxResults(1)
                .getResultList();
        if (list.isEmpty()) {
            return LearnerIdentity.empty();
        }
        Object row = list.get(0);
        if (row instanceof Object[] arr && arr.length >= 3) {
            String fn = arr[0] != null ? arr[0].toString().trim() : "";
            String ln = arr[1] != null ? arr[1].toString().trim() : "";
            String em = arr[2] != null ? arr[2].toString().trim() : "";
            String full = (fn + " " + ln).trim();
            if (full.isEmpty()) {
                full = "Apprenant";
            }
            return new LearnerIdentity(full, em);
        }
        return LearnerIdentity.empty();
    }

    @SuppressWarnings("unchecked")
    public List<LearnerPickerRow> listLearnersForPicker() {
        var list = entityManager
                .createNativeQuery(
                        "SELECT id, first_name, last_name, email FROM app_user ORDER BY COALESCE(last_name,''), COALESCE(first_name,'')"
                )
                .getResultList();
        List<LearnerPickerRow> out = new ArrayList<>();
        for (Object o : list) {
            if (o instanceof Object[] arr && arr.length >= 4 && arr[0] instanceof Number nid) {
                String fn = arr[1] != null ? arr[1].toString().trim() : "";
                String ln = arr[2] != null ? arr[2].toString().trim() : "";
                String em = arr[3] != null ? arr[3].toString().trim() : "";
                String full = (fn + " " + ln).trim();
                if (full.isEmpty()) {
                    full = "Utilisateur " + nid.longValue();
                }
                out.add(new LearnerPickerRow(nid.longValue(), full, em));
            }
        }
        return out;
    }
}
