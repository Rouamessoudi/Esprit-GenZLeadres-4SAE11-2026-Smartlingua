package com.esprit.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class SignupRequest {

    @NotBlank(message = "Le nom d'utilisateur est obligatoire.")
    @Size(min = 2, max = 80, message = "Le nom d'utilisateur doit contenir entre 2 et 80 caracteres.")
    private String username;

    @NotBlank(message = "L'email est obligatoire.")
    @Email(message = "Format d'email invalide.")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire.")
    @Size(min = 4, max = 100, message = "Le mot de passe doit contenir entre 4 et 100 caracteres.")
    private String password;

    @NotBlank(message = "Le role est obligatoire.")
    @Pattern(regexp = "(?i)student|teacher|prof", message = "Le role doit etre STUDENT ou PROF.")
    private String role;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
