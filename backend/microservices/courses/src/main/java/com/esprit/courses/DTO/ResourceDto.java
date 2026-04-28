package com.esprit.courses.DTO;

import com.esprit.courses.entities.enums.ResourceType;
import jakarta.validation.constraints.*;

public class ResourceDto {

    private Long id;

    @NotBlank(message = "Le titre de la ressource est obligatoire")
    @Size(min = 2, max = 255, message = "Le titre doit contenir entre 2 et 255 caractères")
    private String title;

    @NotNull(message = "Le type est obligatoire (PDF, VIDEO, AUDIO)")
    private ResourceType type;   // PDF / VIDEO / AUDIO

    @NotBlank(message = "L'URL est obligatoire")
    @Size(max = 500)
    @Pattern(regexp = "https?://.+", message = "L'URL doit commencer par http:// ou https://")
    private String url;

    // getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public ResourceType getType() { return type; }
    public void setType(ResourceType type) { this.type = type; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}