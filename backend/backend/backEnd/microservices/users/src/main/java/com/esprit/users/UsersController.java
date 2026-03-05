package com.esprit.users;

import com.esprit.users.dto.RegisterRequest;
import com.esprit.users.entity.UserEntity;
import com.esprit.users.service.RegisterService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Contrôleur du microservice users.
 * - POST /users/register : créer un compte (enregistré en base MySQL commune).
 * - GET /users/me : profil de l'utilisateur connecté (JWT Keycloak).
 */
@RestController
@RequestMapping("/users")
public class UsersController {

    private final RegisterService registerService;

    public UsersController(RegisterService registerService) {
        this.registerService = registerService;
    }

    @GetMapping
    public String sayHello() {
        return "Hello from Users service";
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        UserEntity user = registerService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", user.getId(),
            "email", user.getEmail(),
            "username", user.getUsername(),
            "message", "Compte créé. Vous pouvez vous connecter avec Sign In."
        ));
    }

    /**
     * Retourne le profil (sub, preferred_username, email, roles) à partir du JWT.
     * Le front envoie le token via Authorization: Bearer <token> (KeycloakBearerInterceptor).
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(401).build();
        }
        Map<String, Object> profile = new java.util.HashMap<>(Map.of(
            "sub", jwt.getSubject(),
            "preferred_username", jwt.getClaimAsString("preferred_username") != null ? jwt.getClaimAsString("preferred_username") : jwt.getSubject(),
            "email", jwt.getClaimAsString("email") != null ? jwt.getClaimAsString("email") : ""
        ));
        if (jwt.getClaim("realm_access") != null && jwt.getClaim("realm_access") instanceof Map) {
            var realmAccess = (Map<?, ?>) jwt.getClaim("realm_access");
            if (realmAccess.get("roles") instanceof Iterable) {
                var roles = ((Iterable<?>) realmAccess.get("roles")).stream()
                    .map(Object::toString)
                    .collect(Collectors.toList());
                profile.put("roles", roles);
            }
        }
        return ResponseEntity.ok(profile);
    }
}
