package com.esprit.forum.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AnnouncementRequest(
    @NotBlank(message = "Title is required")
    @Size(min = 4, max = 200, message = "Title length must be between 4 and 200")
    @Pattern(regexp = ".*\\D.*", message = "Title must not be only digits")
    String title,
    @NotBlank(message = "Content is required")
    @Size(min = 4, max = 2000, message = "Content length must be between 4 and 2000")
    String content
) {}
