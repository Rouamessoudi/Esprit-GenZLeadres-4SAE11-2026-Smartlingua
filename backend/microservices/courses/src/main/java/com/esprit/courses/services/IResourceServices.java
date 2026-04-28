package com.esprit.courses.services;

import com.esprit.courses.DTO.ResourceDto;

import java.util.List;

public interface IResourceServices {

    ResourceDto addResourceToCourse(Long courseId, ResourceDto dto);

    void deleteResource(Long resourceId);

    List<ResourceDto> getResourcesByCourse(Long courseId);
}
