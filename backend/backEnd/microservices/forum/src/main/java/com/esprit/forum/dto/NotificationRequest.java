package com.esprit.forum.dto;

import com.esprit.forum.entity.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Corps JSON pour POST /forum/notifications (creation manuelle ou interne). Validation Jakarta. */
public class NotificationRequest {

    @NotNull(message = "L'utilisateur est obligatoire.")
    private Long userId;

    @NotBlank(message = "Le titre est obligatoire.")
    @Size(min = 3, max = 120, message = "Le titre doit contenir entre 3 et 120 caracteres.")
    private String title;

    @NotBlank(message = "Le message est obligatoire.")
    @Size(min = 3, max = 1000, message = "Le message doit contenir entre 3 et 1000 caracteres.")
    private String message;

    @NotNull(message = "Le type de notification est obligatoire.")
    private NotificationType type;

    private String sourceType;
    private Long sourceId;
    private String priority;
    private String triggerType;
    private String actionUrl;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public Long getSourceId() { return sourceId; }
    public void setSourceId(Long sourceId) { this.sourceId = sourceId; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getTriggerType() { return triggerType; }
    public void setTriggerType(String triggerType) { this.triggerType = triggerType; }
    public String getActionUrl() { return actionUrl; }
    public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }
}
