package com.esprit.courses.config;

import com.esprit.courses.Repositories.ChapterRepository;
import com.esprit.courses.Repositories.CourseRepository;
import com.esprit.courses.entities.Chapter;
import com.esprit.courses.entities.ChapterContent;
import com.esprit.courses.entities.Course;
import com.esprit.courses.entities.enums.ChapterContentKind;
import com.esprit.courses.entities.enums.SkillType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Si un cours n’a aucun chapitre, crée 3 chapitres (Reading / Writing / Listening) avec une ressource indicative.
 * Désactiver : {@code courses.chapter.bootstrap=false}.
 */
@Component
@Order(50)
@ConditionalOnProperty(name = "courses.chapter.bootstrap", havingValue = "true", matchIfMissing = true)
public class DefaultChaptersBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DefaultChaptersBootstrap.class);

    private final CourseRepository courseRepository;
    private final ChapterRepository chapterRepository;

    public DefaultChaptersBootstrap(CourseRepository courseRepository, ChapterRepository chapterRepository) {
        this.courseRepository = courseRepository;
        this.chapterRepository = chapterRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (Course course : courseRepository.findAll()) {
            if (chapterRepository.countByCourseId(course.getId()) > 0) {
                continue;
            }
            addSkillChapter(course, 1, SkillType.READING, "Reading — overview", "Compréhension écrite et vocabulaire.");
            addSkillChapter(course, 2, SkillType.WRITING, "Writing — overview", "Production écrite guidée.");
            addSkillChapter(course, 3, SkillType.LISTENING, "Listening — overview", "Compréhension orale.");
            courseRepository.save(course);
            log.info("Chapitres par défaut créés pour le cours id={}", course.getId());
        }
    }

    private void addSkillChapter(Course course, int order, SkillType skill, String title, String description) {
        Chapter ch = new Chapter();
        ch.setCourse(course);
        ch.setTitle(title);
        ch.setDescription(description);
        ch.setSkillType(skill);
        ch.setOrderIndex(order);
        ch.setRequired(true);
        ChapterContent c = new ChapterContent();
        c.setChapter(ch);
        c.setType(ChapterContentKind.VIDEO);
        c.setTitle("Introduction (" + skill.name() + ")");
        c.setUrl("#");
        c.setRequired(true);
        ch.getContents().add(c);
        course.getChapters().add(ch);
    }
}
