import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';
import type { CourseLevel } from '../../../core/services/course-api.service';

export interface Course {
  id: number;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  /** Niveau CECRL du cours (pour le verrou d’accès). */
  cefrLevel: CourseLevel;
  /** false si le cours est au-dessus du niveau de l’apprenant. */
  accessAllowed: boolean;
  lessons: number;
  duration: string;
  students: number;
  rating: number;
  icon: string;
  color: string;
  /** Séances à venir pour ce cours (affichées pour que l'étudiant choisisse un créneau) */
  upcomingSeances?: { title: string; date: string; time: string; durationMinutes: number }[];
}

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [NgClass, DecimalPipe],
  template: `
    <div class="course-card card" [class.locked]="!course.accessAllowed">
      <div class="card-header" [style.background]="course.color">
        <div class="card-icon">
          <span class="material-icons-round">{{ course.icon }}</span>
        </div>
        <span class="badge" [ngClass]="{
          'badge-beginner': course.level === 'Beginner',
          'badge-intermediate': course.level === 'Intermediate',
          'badge-advanced': course.level === 'Advanced'
        }">{{ course.level }}</span>
        @if (!course.accessAllowed) {
          <span class="badge badge-lock" title="Niveau du cours supérieur à votre niveau actuel">CECRL {{ course.cefrLevel }} · verrouillé</span>
        }
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
          @if (course.upcomingSeances && course.upcomingSeances.length > 0) {
            <div class="seances-block">
              <span class="seances-label">Séances à venir — choisissez un créneau :</span>
              <ul class="seances-list">
                @for (s of course.upcomingSeances; track s.date + s.time) {
                  <li>
                    <span class="material-icons-round seance-icon">schedule</span>
                    {{ s.date }} à {{ s.time }} — {{ s.durationMinutes }} min
                    @if (s.title) { <span class="seance-title">{{ s.title }}</span> }
                  </li>
                }
              </ul>
            </div>
          }
          <div class="card-actions">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              (click)="onResourcesClick($event)"
              [disabled]="!course.accessAllowed"
              title="Consulter les videos et podcasts du cours"
            >
              <span class="material-icons-round">subscriptions</span>
              Videos & Podcasts
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm coach-btn"
              (click)="onCoachClick($event)"
              [disabled]="!course.accessAllowed"
              title="Conseil personnalisé selon votre profil"
            >
              <span class="material-icons-round">auto_awesome</span>
              Coach IA
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              [disabled]="!course.accessAllowed"
              (click)="enroll.emit(course)"
            >
              {{ course.accessAllowed ? 'Enroll Now' : 'Niveau trop élevé' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './course-card.component.scss'
})
export class CourseCardComponent {
  @Input() course!: Course;
  @Output() enroll = new EventEmitter<Course>();
  @Output() coachAi = new EventEmitter<Course>();
  @Output() resources = new EventEmitter<Course>();

  onCoachClick(ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.coachAi.emit(this.course);
  }

  onResourcesClick(ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.resources.emit(this.course);
  }
}
