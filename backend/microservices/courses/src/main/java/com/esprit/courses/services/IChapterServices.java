package com.esprit.courses.services;

import com.esprit.courses.DTO.ChapterDto;

import java.util.List;

public interface IChapterServices {
    List<ChapterDto> listChaptersByCourse(Long courseId);
}
