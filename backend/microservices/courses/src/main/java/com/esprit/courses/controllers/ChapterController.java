package com.esprit.courses.controllers;

import com.esprit.courses.DTO.ChapterDto;
import com.esprit.courses.services.IChapterServices;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses/{courseId}/chapters")
@CrossOrigin(origins = "${cors.allowed-origins}")
public class ChapterController {

    private final IChapterServices chapterServices;

    public ChapterController(IChapterServices chapterServices) {
        this.chapterServices = chapterServices;
    }

    @GetMapping
    public List<ChapterDto> list(@PathVariable Long courseId) {
        return chapterServices.listChaptersByCourse(courseId);
    }
}
