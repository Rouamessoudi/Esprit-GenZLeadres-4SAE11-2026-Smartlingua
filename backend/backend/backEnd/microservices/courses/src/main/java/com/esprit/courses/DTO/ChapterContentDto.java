package com.esprit.courses.DTO;

import com.esprit.courses.entities.enums.ChapterContentKind;

public class ChapterContentDto {
    private Long id;
    private ChapterContentKind type;
    private String title;
    private String url;
    private boolean required;

    public ChapterContentDto() {}

    public ChapterContentDto(Long id, ChapterContentKind type, String title, String url, boolean required) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.url = url;
        this.required = required;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ChapterContentKind getType() {
        return type;
    }

    public void setType(ChapterContentKind type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public boolean isRequired() {
        return required;
    }

    public void setRequired(boolean required) {
        this.required = required;
    }
}
