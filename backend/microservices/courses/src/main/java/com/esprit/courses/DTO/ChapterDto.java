package com.esprit.courses.DTO;

import com.esprit.courses.entities.enums.SkillType;

import java.util.ArrayList;
import java.util.List;

public class ChapterDto {
    private Long id;
    private String title;
    private String description;
    private SkillType skillType;
    private Integer orderIndex;
    private boolean required;
    private List<ChapterContentDto> contents = new ArrayList<>();

    public ChapterDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public SkillType getSkillType() {
        return skillType;
    }

    public void setSkillType(SkillType skillType) {
        this.skillType = skillType;
    }

    public Integer getOrderIndex() {
        return orderIndex;
    }

    public void setOrderIndex(Integer orderIndex) {
        this.orderIndex = orderIndex;
    }

    public boolean isRequired() {
        return required;
    }

    public void setRequired(boolean required) {
        this.required = required;
    }

    public List<ChapterContentDto> getContents() {
        return contents;
    }

    public void setContents(List<ChapterContentDto> contents) {
        this.contents = contents;
    }
}
