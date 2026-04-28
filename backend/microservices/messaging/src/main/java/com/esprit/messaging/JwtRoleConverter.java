package com.esprit.messaging;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

public class JwtRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        List<GrantedAuthority> out = new ArrayList<>();
        Object realmAccessObj = jwt.getClaim("realm_access");
        if (realmAccessObj instanceof Map<?, ?> realmAccess) {
            Object rolesObj = realmAccess.get("roles");
            if (rolesObj instanceof Collection<?> roles) {
                for (Object roleObj : roles) {
                    if (roleObj == null) continue;
                    String role = roleObj.toString().trim().toUpperCase().replaceFirst("^ROLE_", "");
                    if (!role.isEmpty()) {
                        out.add(new SimpleGrantedAuthority("ROLE_" + role));
                    }
                }
            }
        }
        return out;
    }
}
