import { Component } from '@angular/core';
import { CourseCardComponent, Course } from '../course-card/course-card.component';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-course-list',
    standalone: true,
    imports: [CourseCardComponent, FormsModule],
    template: `
    <section class="courses-page">
      <div class="container">
        <div class="page-header animate-fade-in-up">
          <h1>Explore Our Courses</h1>
          <p>Discover expert-crafted English courses designed to take you from beginner to fluent speaker.</p>
        </div>

        <div class="filters animate-fade-in-up">
          <div class="search-box">
            <span class="material-icons-round">search</span>
            <input type="text" placeholder="Search courses..." [(ngModel)]="searchTerm">
          </div>
          <div class="filter-chips">
            @for (level of levels; track level) {
              <button class="chip" [class.active]="activeLevel === level" (click)="filterByLevel(level)">
                {{ level }}
              </button>
            }
          </div>
        </div>

        <div class="courses-grid">
          @for (course of filteredCourses; track course.id; let i = $index) {
            <div class="animate-fade-in-up" [style.animation-delay]="(i * 0.1) + 's'">
              <app-course-card [course]="course" (enroll)="onEnroll($event)"></app-course-card>
            </div>
          }
        </div>
      </div>
    </section>
  `,
    styleUrl: './course-list.component.scss'
})
export class CourseListComponent {
    searchTerm = '';
    activeLevel = 'All';
    levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

    courses: Course[] = [
        {
            id: 1,
            title: 'English Foundations',
            description: 'Build a solid foundation in English grammar, vocabulary, and basic communication skills.',
            level: 'Beginner',
            lessons: 24,
            duration: '8 weeks',
            students: 12450,
            rating: 4.8,
            icon: 'auto_stories',
            color: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)'
        },
        {
            id: 2,
            title: 'Conversational English',
            description: 'Master everyday conversations with native-like fluency and confidence.',
            level: 'Intermediate',
            lessons: 32,
            duration: '10 weeks',
            students: 8920,
            rating: 4.9,
            icon: 'forum',
            color: 'linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)'
        },
        {
            id: 3,
            title: 'Business English',
            description: 'Professional English for workplace communication, presentations, and negotiations.',
            level: 'Advanced',
            lessons: 28,
            duration: '12 weeks',
            students: 6340,
            rating: 4.7,
            icon: 'business_center',
            color: 'linear-gradient(135deg, #e17055 0%, #fdcb6e 100%)'
        },
        {
            id: 4,
            title: 'Grammar Mastery',
            description: 'Deep dive into English grammar rules, tenses, and sentence structures.',
            level: 'Beginner',
            lessons: 20,
            duration: '6 weeks',
            students: 15680,
            rating: 4.6,
            icon: 'spellcheck',
            color: 'linear-gradient(135deg, #0984e3 0%, #74b9ff 100%)'
        },
        {
            id: 5,
            title: 'IELTS Preparation',
            description: 'Comprehensive preparation for the IELTS exam covering all four test sections.',
            level: 'Advanced',
            lessons: 36,
            duration: '14 weeks',
            students: 9870,
            rating: 4.9,
            icon: 'emoji_events',
            color: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)'
        },
        {
            id: 6,
            title: 'Vocabulary Builder',
            description: 'Expand your English vocabulary with themed lessons and spaced repetition techniques.',
            level: 'Intermediate',
            lessons: 40,
            duration: '8 weeks',
            students: 11230,
            rating: 4.8,
            icon: 'text_fields',
            color: 'linear-gradient(135deg, #00cec9 0%, #6C5CE7 100%)'
        }
    ];

    get filteredCourses(): Course[] {
        return this.courses.filter(c => {
            const matchesLevel = this.activeLevel === 'All' || c.level === this.activeLevel;
            const matchesSearch = !this.searchTerm || c.title.toLowerCase().includes(this.searchTerm.toLowerCase());
            return matchesLevel && matchesSearch;
        });
    }

    filterByLevel(level: string) {
        this.activeLevel = level;
    }

    onEnroll(course: Course) {
        console.log('Enroll:', course.title);
    }
}
