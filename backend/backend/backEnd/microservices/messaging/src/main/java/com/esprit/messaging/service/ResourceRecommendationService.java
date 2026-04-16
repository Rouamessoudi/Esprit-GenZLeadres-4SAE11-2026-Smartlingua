package com.esprit.messaging.service;

import com.esprit.messaging.dto.ResourceDto;
import com.esprit.messaging.entity.Resource;
import com.esprit.messaging.entity.UserRecommendedResource;
import com.esprit.messaging.repository.ResourceRepository;
import com.esprit.messaging.repository.UserRecommendedResourceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ResourceRecommendationService {
    private final ResourceRepository resourceRepository;
    private final UserRecommendedResourceRepository userRecommendedResourceRepository;

    public ResourceRecommendationService(
        ResourceRepository resourceRepository,
        UserRecommendedResourceRepository userRecommendedResourceRepository
    ) {
        this.resourceRepository = resourceRepository;
        this.userRecommendedResourceRepository = userRecommendedResourceRepository;
    }

    public List<ResourceDto> getResourcesByLevel(String level) {
        return resourceRepository.findByLevelIgnoreCaseOrderByCreatedAtDesc(level).stream()
            .map(this::toDto)
            .toList();
    }

    public Resource saveResource(Resource resource) {
        return resourceRepository.save(resource);
    }

    public void saveRecommendationsForUser(Long userId, List<Resource> resources) {
        for (Resource resource : resources) {
            saveRecommendation(userId, resource.getId());
        }
    }

    public void saveRecommendation(Long userId, Long resourceId) {
        if (userRecommendedResourceRepository.existsByUserIdAndResource_Id(userId, resourceId)) {
            return;
        }
        Resource resource = resourceRepository.findById(resourceId)
            .orElseThrow(() -> new IllegalArgumentException("Resource not found"));
        UserRecommendedResource relation = new UserRecommendedResource();
        relation.setUserId(userId);
        relation.setResource(resource);
        relation.setStatus("saved");
        userRecommendedResourceRepository.save(relation);
    }

    public List<ResourceDto> getUserResources(Long userId) {
        return userRecommendedResourceRepository.findTop50ByUserIdOrderByRecommendedAtDesc(userId).stream()
            .map(UserRecommendedResource::getResource)
            .map(this::toDto)
            .toList();
    }

    public List<Resource> pickResources(String level, String message) {
        List<Resource> byLevel = resourceRepository.findByLevelIgnoreCaseOrderByCreatedAtDesc(level);
        if (byLevel.isEmpty()) {
            return byLevel;
        }
        String text = message == null ? "" : message.toLowerCase();
        if (text.contains("youtube") || text.contains("playlist") || text.contains("video")) {
            List<Resource> onlyYoutube = byLevel.stream()
                .filter(r -> "youtube".equalsIgnoreCase(r.getCategory()))
                .toList();
            if (!onlyYoutube.isEmpty()) {
                return onlyYoutube;
            }
        }
        return byLevel;
    }

    private ResourceDto toDto(Resource r) {
        return new ResourceDto(r.getId(), r.getTitle(), r.getDescription(), r.getLevel(), r.getCategory(), r.getUrl());
    }
}
