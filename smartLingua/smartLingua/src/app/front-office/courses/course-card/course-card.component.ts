import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';

export interface Course {
  id: number;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons: number;
  duration: string;
  students: number;
  rating: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [NgClass, DecimalPipe],
  template: `
    <div class="course-card card">
      <div class="card-header" [style.background]="course.color">
        <div class="card-icon">
          <span class="material-icons-round">{{ course.icon }}</span>
        </div>
        <span class="badge" [ngClass]="{
          'badge-beginner': course.level === 'Beginner',
          'badge-intermediate': course.level === 'Intermediate',
          'badge-advanced': course.level === 'Advanced'
        }">{{ course.level }}</span>
      </div>
      <div class="card-body">
        <h3>{{ course.title }}</h3>
        <p>{{ course.description }}</p>
        <div class="card-meta">
          <div class="meta-item">
            <span class="material-icons-round">menu_book</span>
            <span>{{ course.lessons }} lessons</span>
          </div>
          <div class="meta-item">
            <span class="material-icons-round">schedule</span>
            <span>{{ course.duration }}</span>
          </div>
        </div>
        <div class="card-footer">
          <div class="card-stats">
            <div class="rating">
              <span class="material-icons-round star">star</span>
              <span>{{ course.rating }}</span>
            </div>
            <span class="students">{{ course.students | number }} students</span>
          </div>
          <button class="btn btn-primary btn-sm" (click)="enroll.emit(course)">
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './course-card.component.scss'
})
export class CourseCardComponent {
  @Input() course!: Course;
  @Output() enroll = new EventEmitter<Course>();
}
