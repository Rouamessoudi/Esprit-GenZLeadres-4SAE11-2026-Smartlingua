package com.esprit.forum.dto;

import com.esprit.forum.entity.PostStatus;
import jakarta.validation.constraints.NotNull;

public class ModerateRequest {

    @NotNull(message = "Status is required")
    private PostStatus status;

    public PostStatus getStatus() {
        return status;
    }

    public void setStatus(PostStatus status) {
        this.status = status;
    }
}
