package com.esprit.users.dto;

import com.esprit.users.entity.User;

import java.time.LocalDateTime;

public class AuthResponse {
    private boolean ok;
    private String message;
    private UserView user;

    public static AuthResponse success(User user, String message) {
        AuthResponse response = new AuthResponse();
        response.setOk(true);
        response.setMessage(message);
        response.setUser(UserView.from(user));
        return response;
    }

    public static AuthResponse failure(String message) {
        AuthResponse response = new AuthResponse();
        response.setOk(false);
        response.setMessage(message);
        response.setUser(null);
        return response;
    }

    public boolean isOk() {
        return ok;
    }

    public void setOk(boolean ok) {
        this.ok = ok;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public UserView getUser() {
        return user;
    }

    public void setUser(UserView user) {
        this.user = user;
    }

    public static class UserView {
        private Long id;
        private String username;
        private String email;
        private String fullName;
        private String role;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static UserView from(User user) {
            UserView view = new UserView();
            view.setId(user.getId());
            view.setUsername(user.getUsername());
            view.setEmail(user.getEmail());
            view.setFullName(user.getFullName());
            view.setRole(user.getRole());
            view.setCreatedAt(user.getCreatedAt());
            view.setUpdatedAt(user.getUpdatedAt());
            return view;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

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

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }

        public LocalDateTime getUpdatedAt() {
            return updatedAt;
        }

        public void setUpdatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
        }
    }
}
