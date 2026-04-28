package com.esprit.adaptivelearning.repositories;

import com.esprit.adaptivelearning.entities.StudentCourseEnrollment;
import com.esprit.adaptivelearning.entities.enums.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StudentCourseEnrollmentRepository extends JpaRepository<StudentCourseEnrollment, Long> {

    Optional<StudentCourseEnrollment> findByStudentIdAndCourseIdAndStatus(
            Long studentId, Long courseId, EnrollmentStatus status);

    Optional<StudentCourseEnrollment> findFirstByStudentIdAndStatusOrderByEnrolledAtDesc(Long studentId, EnrollmentStatus status);

    List<StudentCourseEnrollment> findByStudentIdAndStatus(Long studentId, EnrollmentStatus status);

    long countByStatus(EnrollmentStatus status);

    @Query(value = """
        SELECT DATE_FORMAT(enrolled_at, '%Y-%m') as month, COUNT(*) as count
        FROM student_course_enrollment
        WHERE status = 'ACTIVE'
        GROUP BY DATE_FORMAT(enrolled_at, '%Y-%m')
        ORDER BY month
    """, nativeQuery = true)
    List<EnrollmentMonthCount> countActiveByMonth();

    interface EnrollmentMonthCount {
        String getMonth();
        long getCount();
    }
}
