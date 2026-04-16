package com.esprit.forum.entity;

/**
 * Types de notifications affiches et filtres cote Angular.
 * ANNOUNCEMENT / COMMENT / REPLY sont crees automatiquement par le metier ; SYSTEM / WARNING pour usages manuels ou futurs.
 */
public enum NotificationType {
    ANNOUNCEMENT,
    COMMENT,
    REPLY,
    SYSTEM,
    WARNING
}
