package com.esprit.users;

import com.esprit.users.dto.UserSyncDto;
import com.esprit.users.entities.User;
import com.esprit.users.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:4200}")
public class UsersController {

    private final UserService userService;

    public UsersController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public String sayHello() {
        return "Hello from Users service";
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable Long id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/all")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.findAll());
    }

    @GetMapping("/keycloak/{keycloakId}")
    public ResponseEntity<User> getByKeycloakId(@PathVariable String keycloakId) {
        return userService.findByKeycloakId(keycloakId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Synchronise l'utilisateur connecté (Keycloak) dans notre base.
     * Appelé après inscription ou connexion pour enregistrer l'étudiant en base.
     */
    @PostMapping("/sync")
    public ResponseEntity<User> syncUser(@RequestBody UserSyncDto dto) {
        User user = userService.syncUser(dto);
        return ResponseEntity.ok(user);
    }
}
