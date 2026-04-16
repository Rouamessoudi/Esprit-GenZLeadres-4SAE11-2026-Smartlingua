package com.esprit.forum.service;

import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class ContentModerationService {

    // Placeholder moderation list for basic offensive/spam patterns.
    private static final Set<String> BLOCKED_TERMS = Set.of(
            "spam",
            "scam",
            "hate",
            "insult"
    );

    public ModerationResult moderate(String rawContent) {
        if (rawContent == null) {
            return new ModerationResult("", false);
        }
        String normalized = rawContent.toLowerCase();
        boolean flagged = BLOCKED_TERMS.stream().anyMatch(normalized::contains);
        return new ModerationResult(rawContent.trim(), flagged);
    }

    public record ModerationResult(String sanitizedContent, boolean flagged) {
    }
}
