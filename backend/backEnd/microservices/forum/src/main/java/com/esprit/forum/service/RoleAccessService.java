package com.esprit.forum.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Set;

@Service
public class RoleAccessService {

    private static final Set<String> ALLOWED_ROLES = Set.of("administrator", "teacher", "student");

    public void assertForumAccess(String roleHeader) {
        if (roleHeader == null || roleHeader.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Authentification requise.");
        }
        String normalizedRole = roleHeader.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_ROLES.contains(normalizedRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Acces refuse: role non autorise.");
        }
    }

    public void assertAuthenticated(Long userIdHeader) {
        if (userIdHeader == null || userIdHeader <= 0) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Authentification requise.");
        }
    }

    public void assertAuthenticatedForumAccess(Long userIdHeader, String roleHeader) {
        assertAuthenticated(userIdHeader);
        assertForumAccess(roleHeader);
    }

    public void assertAnnouncementManageRole(String roleHeader) {
        if (roleHeader == null || roleHeader.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Authentification requise.");
        }
        String normalizedRole = roleHeader.trim().toUpperCase(Locale.ROOT);
        if (!"PROF".equals(normalizedRole) && !"ADMIN".equals(normalizedRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Acces refuse: seuls PROF et ADMIN peuvent gerer les annonces.");
        }
    }
}
