package com.esprit.adaptivelearning.repositories;

import com.esprit.adaptivelearning.entities.StudentCourseEnrollment;
import com.esprit.adaptivelearning.entities.enums.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentCourseEnrollmentRepository extends JpaRepository<StudentCourseEnrollment, Long> {

    Optional<StudentCourseEnrollment> findByStudentIdAndCourseIdAndStatus(
            Long studentId, Long courseId, EnrollmentStatus status);

    Optional<StudentCourseEnrollment> findFirstByStudentIdAndStatusOrderByEnrolledAtDesc(Long studentId, EnrollmentStatus status);

    List<StudentCourseEnrollment> findByStudentIdAndStatus(Long studentId, EnrollmentStatus status);
}
