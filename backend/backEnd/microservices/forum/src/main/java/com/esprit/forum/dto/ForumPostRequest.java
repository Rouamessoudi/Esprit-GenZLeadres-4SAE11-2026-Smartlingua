package com.esprit.forum.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ForumPostRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 200, message = "Title must be at least 3 characters")
    private String title;

    @NotBlank(message = "Content is required")
    @Size(min = 3, message = "Content must be at least 3 characters")
    private String content;

    @NotNull(message = "Author ID is required")
    private Long authorId;

    @NotBlank(message = "Category is required")
    @Size(min = 3, max = 100, message = "Category must be between 3 and 100 characters")
    private String category;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getAuthorId() {
        return authorId;
    }

    public void setAuthorId(Long authorId) {
        this.authorId = authorId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
