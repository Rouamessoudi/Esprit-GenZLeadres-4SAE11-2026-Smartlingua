package com.esprit.courses.services;

import com.esprit.courses.DTO.ResourceDto;
import com.esprit.courses.Repositories.CourseRepository;
import com.esprit.courses.Repositories.ResourceRepository;
import com.esprit.courses.entities.Course;
import com.esprit.courses.entities.Resource;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class IResourceServicesImp implements IResourceServices {

    private final CourseRepository courseRepository;
    private final ResourceRepository resourceRepository;

    public IResourceServicesImp(CourseRepository courseRepository,
                                ResourceRepository resourceRepository) {
        this.courseRepository = courseRepository;
        this.resourceRepository = resourceRepository;
    }

    @Override
    public ResourceDto addResourceToCourse(Long courseId, ResourceDto dto) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        Resource resource = toEntity(dto);
        resource.setCourse(course);
        Resource saved = resourceRepository.save(resource);
        return toDto(saved);
    }

    @Override
    public void deleteResource(Long resourceId) {
        resourceRepository.deleteById(resourceId);
    }

    @Override
    public List<ResourceDto> getResourcesByCourse(Long courseId) {
        return resourceRepository.findByCourseId(courseId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private Resource toEntity(ResourceDto dto) {
        Resource r = new Resource();
        r.setTitle(dto.getTitle());
        r.setType(dto.getType());
        r.setUrl(dto.getUrl());
        return r;
    }

    private ResourceDto toDto(Resource r) {
        ResourceDto dto = new ResourceDto();
        dto.setId(r.getId());
        dto.setTitle(r.getTitle());
        dto.setType(r.getType());
        dto.setUrl(r.getUrl());
        return dto;
    }
}
