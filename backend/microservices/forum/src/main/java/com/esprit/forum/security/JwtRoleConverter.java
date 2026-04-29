package com.esprit.forum.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

public class JwtRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Set<String> normalizedRoles = new HashSet<>();
        collectRealmRoles(jwt, normalizedRoles);
        collectClientRoles(jwt, normalizedRoles);

        List<GrantedAuthority> out = new ArrayList<>();
        for (String role : normalizedRoles) {
            out.add(new SimpleGrantedAuthority("ROLE_" + role));
        }
        return out;
    }

    private void collectRealmRoles(Jwt jwt, Set<String> rolesOut) {
        Object realmAccessObj = jwt.getClaim("realm_access");
        if (!(realmAccessObj instanceof Map<?, ?> realmAccess)) {
            return;
        }
        Object rolesObj = realmAccess.get("roles");
        addRoleCollection(rolesObj, rolesOut);
    }

    private void collectClientRoles(Jwt jwt, Set<String> rolesOut) {
        Object resourceAccessObj = jwt.getClaim("resource_access");
        if (!(resourceAccessObj instanceof Map<?, ?> resourceAccess)) {
            return;
        }
        for (Object clientValue : resourceAccess.values()) {
            if (clientValue instanceof Map<?, ?> clientMap) {
                Object rolesObj = clientMap.get("roles");
                addRoleCollection(rolesObj, rolesOut);
            }
        }
    }

    private void addRoleCollection(Object rolesObj, Set<String> rolesOut) {
        if (!(rolesObj instanceof Collection<?> roles)) {
            return;
        }
        for (Object roleObj : roles) {
            if (roleObj == null) {
                continue;
            }
            String role = roleObj.toString().trim().toUpperCase().replaceFirst("^ROLE_", "");
            if (!role.isEmpty()) {
                rolesOut.add(role);
            }
        }
    }
}
