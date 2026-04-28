package com.esprit.users;

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

        Object realmAccessObj = jwt.getClaim("realm_access");
        if (realmAccessObj instanceof Map<?, ?> realmAccess) {
            Object rolesObj = realmAccess.get("roles");
            if (rolesObj instanceof Collection<?> roles) {
                for (Object roleObj : roles) {
                    if (roleObj == null) continue;
                    addNormalizedRole(roleObj.toString(), normalizedRoles);
                }
            }
        }

        Object resourceAccessObj = jwt.getClaim("resource_access");
        if (resourceAccessObj instanceof Map<?, ?> resourceAccess) {
            for (Object clientDataObj : resourceAccess.values()) {
                if (!(clientDataObj instanceof Map<?, ?> clientData)) continue;
                Object rolesObj = clientData.get("roles");
                if (rolesObj instanceof Collection<?> roles) {
                    for (Object roleObj : roles) {
                        if (roleObj == null) continue;
                        addNormalizedRole(roleObj.toString(), normalizedRoles);
                    }
                }
            }
        }

        List<GrantedAuthority> out = new ArrayList<>();
        for (String role : normalizedRoles) {
            out.add(new SimpleGrantedAuthority("ROLE_" + role));
        }
        return out;
    }

    private void addNormalizedRole(String rawRole, Set<String> rolesOut) {
        String role = rawRole.trim().toUpperCase().replaceFirst("^ROLE_", "");
        if (!role.isEmpty()) {
            rolesOut.add(role);
        }
    }
}
