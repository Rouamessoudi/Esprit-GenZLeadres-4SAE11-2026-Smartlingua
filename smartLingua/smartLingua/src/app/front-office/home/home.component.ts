import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseCardComponent, Course } from '../courses/course-card/course-card.component';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterLink, CourseCardComponent],
    template: `
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-bg">
        <div class="hero-shape hero-shape-1"></div>
        <div class="hero-shape hero-shape-2"></div>
        <div class="hero-shape hero-shape-3"></div>
        <div class="hero-grid-pattern"></div>
      </div>
      <div class="container hero-content">
        <div class="hero-text animate-fade-in-up">
          <span class="hero-badge">
            <span class="material-icons-round">auto_awesome</span>
            #1 English Learning Platform
          </span>
          <h1>Master English with <span class="gradient-text">SmartLingua</span></h1>
          <p>Unlock your full potential with interactive courses, AI-powered quizzes, and personalized learning paths crafted by language experts worldwide.</p>
          <div class="hero-actions">
            <a routerLink="/auth/register" class="btn btn-primary btn-lg">
              <span>Start Learning Free</span>
              <span class="material-icons-round">arrow_forward</span>
            </a>
            <a routerLink="/courses" class="btn btn-secondary btn-lg">
              <span>Browse Courses</span>
            </a>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <span class="stat-value">50K+</span>
              <span class="stat-label">Active Students</span>
            </div>
            <div class="hero-stat-divider"></div>
            <div class="hero-stat">
              <span class="stat-value">200+</span>
              <span class="stat-label">Expert Courses</span>
            </div>
            <div class="hero-stat-divider"></div>
            <div class="hero-stat">
              <span class="stat-value">4.9★</span>
              <span class="stat-label">User Rating</span>
            </div>
          </div>
        </div>
        <div class="hero-visual animate-fade-in">
          <div class="hero-card-stack">
            <div class="floating-card fc-1">
              <span class="material-icons-round">school</span>
              <div>
                <strong>Live Classes</strong>
                <small>Join expert sessions</small>
              </div>
            </div>
            <div class="floating-card fc-2">
              <span class="material-icons-round">quiz</span>
              <div>
                <strong>Smart Quizzes</strong>
                <small>Test your knowledge</small>
              </div>
            </div>
            <div class="floating-card fc-3">
              <span class="material-icons-round">trending_up</span>
              <div>
                <strong>Progress Tracking</strong>
                <small>Monitor your growth</small>
              </div>
            </div>
            <div class="hero-main-card">
              <div class="main-card-header">
                <span class="material-icons-round">translate</span>
                <span>SmartLingua</span>
              </div>
              <div class="main-card-body">
                <div class="progress-ring">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="rgba(108,92,231,0.15)" stroke-width="8" fill="none" />
                    <circle cx="50" cy="50" r="40" stroke="url(#gradient)" stroke-width="8" fill="none"
                            stroke-dasharray="220" stroke-dashoffset="55" stroke-linecap="round"
                            transform="rotate(-90 50 50)" />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#6C5CE7" />
                        <stop offset="100%" stop-color="#00cec9" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div class="progress-text">
                    <span class="progress-value">75%</span>
                    <span class="progress-label">Complete</span>
                  </div>
                </div>
                <div class="main-card-info">
                  <h4>Business English</h4>
                  <p>Lesson 18 of 24</p>
                  <div class="mini-progress">
                    <div class="mini-bar" style="width: 75%"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features section" id="features">
      <div class="container">
        <div class="section-header animate-fade-in-up">
          <h2>Why Choose SmartLingua?</h2>
          <p>Everything you need to master English — all in one powerful platform</p>
        </div>
        <div class="features-grid">
          @for (feature of features; track feature.title; let i = $index) {
            <div class="feature-card card animate-fade-in-up" [style.animation-delay]="(i * 0.1) + 's'">
              <div class="feature-icon" [style.background]="feature.color">
                <span class="material-icons-round">{{ feature.icon }}</span>
              </div>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Popular Courses Section -->
    <section class="popular-courses section">
      <div class="container">
        <div class="section-header animate-fade-in-up">
          <h2>Popular Courses</h2>
          <p>Our most loved courses by learners across the globe</p>
        </div>
        <div class="courses-preview-grid">
          @for (course of popularCourses; track course.id; let i = $index) {
            <div class="animate-fade-in-up" [style.animation-delay]="(i * 0.1) + 's'">
              <app-course-card [course]="course" (enroll)="onEnroll($event)"></app-course-card>
            </div>
          }
        </div>
        <div class="courses-cta animate-fade-in-up">
          <a routerLink="/courses" class="btn btn-secondary btn-lg">
            <span>View All Courses</span>
            <span class="material-icons-round">arrow_forward</span>
          </a>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-card animate-fade-in-up">
          <div class="cta-content">
            <h2>Ready to Start Your English Journey?</h2>
            <p>Join thousands of learners who've accelerated their English proficiency with SmartLingua's innovative approach.</p>
            <div class="cta-actions">
              <a routerLink="/auth/register" class="btn btn-primary btn-lg">
                <span>Join SmartLingua Free</span>
                <span class="material-icons-round">arrow_forward</span>
              </a>
            </div>
          </div>
          <div class="cta-shapes">
            <div class="cta-shape cta-shape-1"></div>
            <div class="cta-shape cta-shape-2"></div>
          </div>
        </div>
      </div>
    </section>
  `,
    styleUrl: './home.component.scss'
})
export class HomeComponent {
    features = [
        {
            icon: 'school',
            title: 'Expert-Led Courses',
            description: 'Learn from certified English instructors with years of teaching experience.',
            color: 'linear-gradient(135deg, #6C5CE7, #a29bfe)'
        },
        {
            icon: 'quiz',
            title: 'Interactive Quizzes',
            description: 'Test your knowledge with AI-powered quizzes that adapt to your learning pace.',
            color: 'linear-gradient(135deg, #00cec9, #81ecec)'
        },
        {
            icon: 'trending_up',
            title: 'Progress Tracking',
            description: 'Monitor your improvement with detailed analytics and personalized dashboards.',
            color: 'linear-gradient(135deg, #00b894, #55efc4)'
        },
        {
            icon: 'groups',
            title: 'Community Learning',
            description: 'Connect with fellow learners, join study groups, and practice together.',
            color: 'linear-gradient(135deg, #e17055, #fdcb6e)'
        },
        {
            icon: 'devices',
            title: 'Learn Anywhere',
            description: 'Access your courses from any device — desktop, tablet, or mobile phone.',
            color: 'linear-gradient(135deg, #0984e3, #74b9ff)'
        },
        {
            icon: 'workspace_premium',
            title: 'Certificates',
            description: 'Earn recognized certificates upon completion to boost your professional profile.',
            color: 'linear-gradient(135deg, #fdcb6e, #f39c12)'
        }
    ];

    popularCourses: Course[] = [
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
            title: 'IELTS Preparation',
            description: 'Comprehensive preparation for the IELTS exam covering all four test sections.',
            level: 'Advanced',
            lessons: 36,
            duration: '14 weeks',
            students: 9870,
            rating: 4.9,
            icon: 'emoji_events',
            color: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)'
        }
    ];

    onEnroll(course: Course) {
        console.log('Enroll:', course.title);
    }
}
