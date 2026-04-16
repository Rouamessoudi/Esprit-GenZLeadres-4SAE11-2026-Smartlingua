package com.esprit.messaging.dto;

public class ResourceDto {
    private Long id;
    private String title;
    private String description;
    private String level;
    private String category;
    private String url;

    public ResourceDto() {}

    public ResourceDto(Long id, String title, String description, String level, String category, String url) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.level = level;
        this.category = category;
        this.url = url;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getLevel() {
        return level;
    }

    public String getCategory() {
        return category;
    }

    public String getUrl() {
        return url;
    }
}
