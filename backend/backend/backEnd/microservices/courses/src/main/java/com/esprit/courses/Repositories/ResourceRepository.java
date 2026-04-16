package com.esprit.courses.Repositories;

import com.esprit.courses.entities.Resource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource, Long> {

    // toutes les ressources d’un cours
    List<Resource> findByCourseId(Long courseId);

    long countByCourseId(Long courseId);
    void deleteByCourseId(Long courseId);

    long countByType(com.esprit.courses.entities.enums.ResourceType type);

    long countByCourseIdAndType(Long courseId, com.esprit.courses.entities.enums.ResourceType type);
}