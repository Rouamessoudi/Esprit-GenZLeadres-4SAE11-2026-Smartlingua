package com.esprit.adaptivelearning.feign;

import com.esprit.adaptivelearning.dto.external.ChapterExternalDto;
import com.esprit.adaptivelearning.dto.external.CourseExternalDto;
import com.esprit.adaptivelearning.dto.external.ResourceExternalDto;
import com.esprit.adaptivelearning.dto.external.SeanceExternalDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "courses", configuration = FeignClientJacksonConfig.class)
public interface CoursesClient {

    @GetMapping("/api/courses")
    List<CourseExternalDto> getAllCourses(@RequestParam(value = "level", required = false) String level);

    @GetMapping("/api/courses/{courseId}")
    CourseExternalDto getCourseById(@PathVariable("courseId") Long courseId);

    @GetMapping("/api/courses/{courseId}/resources")
    List<ResourceExternalDto> getResourcesByCourse(@PathVariable("courseId") Long courseId);

    @GetMapping("/api/courses/{courseId}/seances")
    List<SeanceExternalDto> getSeancesByCourse(@PathVariable("courseId") Long courseId);

    @GetMapping("/api/courses/{courseId}/chapters")
    List<ChapterExternalDto> getChaptersByCourse(@PathVariable("courseId") Long courseId);
}
