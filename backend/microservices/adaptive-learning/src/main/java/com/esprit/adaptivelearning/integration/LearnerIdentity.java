package com.esprit.adaptivelearning.integration;

/**
 * Données affichables depuis {@code app_user} (même base que le microservice users).
 */
public record LearnerIdentity(
        String fullName,
        String email
) {
    public static LearnerIdentity empty() {
        return new LearnerIdentity("", "");
    }
}
