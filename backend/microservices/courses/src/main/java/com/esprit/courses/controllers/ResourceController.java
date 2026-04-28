package com.esprit.courses.controllers;

import com.esprit.courses.DTO.ResourceDto;
import com.esprit.courses.services.IResourceServices;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses/{courseId}/resources")
@CrossOrigin(origins = "${cors.allowed-origins}")
public class ResourceController {

    private final IResourceServices resourceServices;

    public ResourceController(IResourceServices resourceServices) {
        this.resourceServices = resourceServices;
    }

    @PostMapping
    public ResourceDto add(@PathVariable Long courseId, @Valid @RequestBody ResourceDto dto) {
        return resourceServices.addResourceToCourse(courseId, dto);
    }

    @GetMapping
    public List<ResourceDto> list(@PathVariable Long courseId) {
        return resourceServices.getResourcesByCourse(courseId);
    }

    @DeleteMapping("/{resourceId}")
    public void delete(@PathVariable Long resourceId) {
        resourceServices.deleteResource(resourceId);
    }
}
