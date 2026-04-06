package com.esprit.courses.services;

import com.esprit.courses.Repositories.CourseRepository;
import com.esprit.courses.entities.Course;
import com.esprit.courses.entities.enums.CourseStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class CourseSchedulerService {

    private final CourseRepository courseRepository;

    public CourseSchedulerService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @Scheduled(fixedRate = 60000)
    public void updateCourseStatus() {
        List<Course> courses = courseRepository.findAll();
        LocalDate today = LocalDate.now();

        for (Course course : courses) {
            if (course.getStartDate() != null && course.getEndDate() != null) {

                if (today.isBefore(course.getStartDate())) {
                    course.setStatus(CourseStatus.PLANNED);
                } else if ((today.isEqual(course.getStartDate()) || today.isAfter(course.getStartDate()))
                        && (today.isEqual(course.getEndDate()) || today.isBefore(course.getEndDate()))) {
                    course.setStatus(CourseStatus.ACTIVE);
                } else if (today.isAfter(course.getEndDate())) {
                    course.setStatus(CourseStatus.FINISHED);
                }
            }
        }

        courseRepository.saveAll(courses);
    }
}
