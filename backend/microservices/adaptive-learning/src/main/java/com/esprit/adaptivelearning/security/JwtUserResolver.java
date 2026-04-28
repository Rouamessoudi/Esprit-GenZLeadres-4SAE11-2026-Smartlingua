package com.esprit.adaptivelearning.security;

import com.esprit.adaptivelearning.integration.AppUserLookup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Optional;

/**
 * Résout l'identifiant {@code app_user.id} à partir du JWT Keycloak (claim {@code sub}).
 * <p>
 * Option dev de secours (désactivée par défaut) :
 * {@code adaptive.me.allow-dev-fallback=true} + {@code adaptive.me.dev-fallback-student-id>0}.
 * Sans cette double activation, aucun fallback n'est appliqué pour éviter les mélanges de comptes.
 */
@Component
public class JwtUserResolver {

    private final AppUserLookup appUserLookup;

    @Value("${adaptive.me.dev-fallback-student-id:0}")
    private long devFallbackStudentId;

    @Value("${adaptive.me.allow-dev-fallback:false}")
    private boolean allowDevFallback;

    @Value("${spring.profiles.active:}")
    private String activeProfiles;

    public JwtUserResolver(AppUserLookup appUserLookup) {
        this.appUserLookup = appUserLookup;
    }

    /**
     * @throws IllegalStateException si JWT absent ou utilisateur non résolvable.
     */
    public long requireAppUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new IllegalStateException("JWT manquant");
        }
        String sub = jwt.getSubject();
        return appUserLookup.findIdByKeycloakId(sub)
                .or(() -> devFallback())
                .orElseThrow(() -> new IllegalStateException(
                        "Profil applicatif introuvable. Appelez POST /api/users/sync après connexion, "
                                + "ou définissez adaptive.me.dev-fallback-student-id pour la démo locale."));
    }

    private Optional<Long> devFallback() {
        if (!allowDevFallback || devFallbackStudentId <= 0) {
            return Optional.empty();
        }
        boolean isDevProfile = Arrays.stream(activeProfiles.split(","))
                .map(String::trim)
                .anyMatch(p -> p.equalsIgnoreCase("dev") || p.equalsIgnoreCase("local"));
        if (!isDevProfile) {
            return Optional.empty();
        }
        if (appUserLookup.existsById(devFallbackStudentId)) {
            return Optional.of(devFallbackStudentId);
        }
        return Optional.empty();
    }
}
