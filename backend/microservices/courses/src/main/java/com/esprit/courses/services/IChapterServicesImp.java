package com.esprit.courses.services;

import com.esprit.courses.DTO.ChapterContentDto;
import com.esprit.courses.DTO.ChapterDto;
import com.esprit.courses.Repositories.ChapterRepository;
import com.esprit.courses.Repositories.CourseRepository;
import com.esprit.courses.entities.Chapter;
import com.esprit.courses.entities.ChapterContent;
import com.esprit.courses.entities.Course;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class IChapterServicesImp implements IChapterServices {

    private final ChapterRepository chapterRepository;
    private final CourseRepository courseRepository;

    public IChapterServicesImp(ChapterRepository chapterRepository, CourseRepository courseRepository) {
        this.chapterRepository = chapterRepository;
        this.courseRepository = courseRepository;
    }

    @Override
    public List<ChapterDto> listChaptersByCourse(Long courseId) {
        courseRepository.findById(courseId).orElseThrow(() -> new RuntimeException("Course not found"));
        return chapterRepository.findByCourseIdOrderByOrderIndexAsc(courseId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private ChapterDto toDto(Chapter ch) {
        ChapterDto dto = new ChapterDto();
        dto.setId(ch.getId());
        dto.setTitle(ch.getTitle());
        dto.setDescription(ch.getDescription());
        dto.setSkillType(ch.getSkillType());
        dto.setOrderIndex(ch.getOrderIndex());
        dto.setRequired(ch.isRequired());
        dto.setContents(ch.getContents().stream().map(this::contentToDto).collect(Collectors.toList()));
        return dto;
    }

    private ChapterContentDto contentToDto(ChapterContent c) {
        return new ChapterContentDto(c.getId(), c.getType(), c.getTitle(), c.getUrl(), c.isRequired());
    }
}
