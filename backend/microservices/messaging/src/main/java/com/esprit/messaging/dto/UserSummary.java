package com.esprit.messaging.dto;

public record UserSummary(
    Long id,
    String keycloakId,
    String username,
    String email,
    String firstName,
    String lastName,
    String role
) {
    public String normalizedRole() {
        if (role == null || role.isBlank()) return "STUDENT";
        return role.trim().toUpperCase().replaceFirst("^ROLE_", "");
    }

    public String displayName() {
        String fullName = ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
        if (!fullName.isBlank()) return fullName;
        if (username != null && !username.isBlank()) return username;
        return email == null ? "unknown" : email;
    }
}
