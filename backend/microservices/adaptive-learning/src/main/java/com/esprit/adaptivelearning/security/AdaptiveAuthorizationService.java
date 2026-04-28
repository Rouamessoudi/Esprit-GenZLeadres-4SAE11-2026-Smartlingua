package com.esprit.adaptivelearning.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Contrôle d'accès par identifiant étudiant : JWT (claims) ou mode relâché pour démo locale.
 */
@Component("adaptiveAuth")
public class AdaptiveAuthorizationService {

    @Value("${adaptive.security.relaxed-student-check:true}")
    private boolean relaxedStudentCheck;

    public boolean canAccessStudent(Long studentId, Authentication authentication) {
        if (studentId == null || authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        if (isStaff(authentication)) {
            return true;
        }
        if (relaxedStudentCheck) {
            // Mode démo local: tout utilisateur authentifié peut accéder au flux étudiant.
            return true;
        }
        Long tokenStudentId = extractStudentId(authentication);
        return tokenStudentId != null && tokenStudentId.equals(studentId);
    }

    public boolean isStaff(Authentication authentication) {
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream().anyMatch(a -> isStaffAuthority(a.getAuthority()));
    }

    private boolean hasStudentRole(Authentication authentication) {
        return authentication.getAuthorities().stream().anyMatch(a -> {
            String auth = a.getAuthority();
            if (auth == null) {
                return false;
            }
            String u = auth.toUpperCase();
            return u.contains("STUDENT") || u.contains("ETUDIANT") || u.contains("ELEVE");
        });
    }

    private static boolean isStaffAuthority(String auth) {
        if (auth == null) {
            return false;
        }
        String u = auth.toUpperCase();
        return u.contains("TEACHER") || u.contains("ENSEIGNANT") || u.contains("FORMATEUR")
                || u.contains("ADMIN");
    }

    private static Long extractStudentId(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof Jwt jwt)) {
            return null;
        }
        for (String claim : List.of("student_id", "studentId", "user_id", "userId")) {
            Object v = jwt.getClaim(claim);
            if (v instanceof Number n) {
                return n.longValue();
            }
            if (v instanceof String s) {
                try {
                    return Long.parseLong(s);
                } catch (NumberFormatException ignored) {
                    /* next claim */
                }
            }
        }
        String sub = jwt.getSubject();
        if (sub == null) {
            return null;
        }
        try {
            return Long.parseLong(sub);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
