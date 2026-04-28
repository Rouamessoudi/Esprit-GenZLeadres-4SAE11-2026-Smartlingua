package com.esprit.messaging;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;

@Component
public class AuthContextService {

    public JwtAuthenticationToken jwtAuth() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof JwtAuthenticationToken jwtAuth)) {
            throw new IllegalStateException("Authenticated JWT required");
        }
        return jwtAuth;
    }

    public String keycloakSub() {
        Jwt jwt = jwtAuth().getToken();
        String sub = jwt.getClaimAsString("sub");
        if (sub == null || sub.isBlank()) {
            throw new IllegalStateException("JWT claim 'sub' is missing");
        }
        return sub;
    }

    public String username() {
        Jwt jwt = jwtAuth().getToken();
        String username = jwt.getClaimAsString("preferred_username");
        return username == null ? "" : username;
    }

    public boolean hasRole(String role) {
        String target = "ROLE_" + role.trim().toUpperCase().replaceFirst("^ROLE_", "");
        Collection<GrantedAuthority> authorities = jwtAuth().getAuthorities();
        return authorities.stream().anyMatch(a -> target.equals(a.getAuthority()));
    }

    public List<String> roles() {
        return jwtAuth()
            .getAuthorities()
            .stream()
            .map(GrantedAuthority::getAuthority)
            .map(r -> r.replaceFirst("^ROLE_", ""))
            .toList();
    }
}
