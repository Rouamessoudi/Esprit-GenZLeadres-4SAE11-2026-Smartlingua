package com.esprit.messaging.config;

import com.esprit.messaging.entity.Resource;
import com.esprit.messaging.repository.ResourceRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class ResourceSeedConfig {

    @Bean
    public CommandLineRunner seedResources(ResourceRepository resourceRepository) {
        return args -> {
            seedYoutube(resourceRepository,
                "A1 Beginner English Playlist",
                "Basic English (alphabet, greetings, simple sentences)",
                "A1",
                "https://www.youtube.com/watch?v=J7vceGl12zo");

            seedYoutube(resourceRepository,
                "A2 English Listening & Vocabulary",
                "Daily conversations and vocabulary",
                "A2",
                "https://www.youtube.com/watch?v=Nabzr_uWWwk");

            seedYoutube(resourceRepository,
                "B1 Intermediate English Course",
                "Intermediate grammar and conversation",
                "B1",
                "https://www.youtube.com/watch?v=aikaFsrWzAI");

            seedYoutube(resourceRepository,
                "B2 Upper Intermediate English",
                "Advanced speaking and listening",
                "B2",
                "https://www.youtube.com/watch?v=VWuAG8unBF4");

            seedYoutube(resourceRepository,
                "C1 Advanced English Lessons",
                "Professional English and fluency",
                "C1",
                "https://www.youtube.com/watch?v=_VSdmsVmhpo");

            seedYoutube(resourceRepository,
                "C2 Master English Level",
                "Native-level English and advanced topics",
                "C2",
                "https://www.youtube.com/watch?v=1q--DNhu0gU");
        };
    }

    private void seedYoutube(ResourceRepository repo, String title, String description, String level, String url) {
        List<Resource> existingByLevel = repo.findByLevelIgnoreCaseAndCategoryIgnoreCaseOrderByCreatedAtDesc(level, "youtube");
        if (!existingByLevel.isEmpty()) {
            // Keep existing rows and update URLs/titles so old links are migrated in DB.
            for (Resource existing : existingByLevel) {
                existing.setTitle(title);
                existing.setDescription(description);
                existing.setUrl(url);
                existing.setSource("preload");
                repo.save(existing);
            }
            return;
        }

        if (repo.findByUrl(url).isPresent()) return;

        Resource r = new Resource();
        r.setTitle(title);
        r.setDescription(description);
        r.setLevel(level);
        r.setCategory("youtube");
        r.setUrl(url);
        r.setSource("preload");
        repo.save(r);
    }
}
