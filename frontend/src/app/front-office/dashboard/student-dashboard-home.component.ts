import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-student-dashboard-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="cards">
      <a class="card" routerLink="/student/courses">
        <span class="material-icons-round">menu_book</span>
        <h3>Courses</h3>
        <p>Access your learning catalog and enrolled content.</p>
      </a>
      <a class="card" routerLink="/student/forum">
        <span class="material-icons-round">forum</span>
        <h3>Forum</h3>
        <p>Join community discussions and ask questions.</p>
      </a>
      <a class="card" routerLink="/student/quiz">
        <span class="material-icons-round">quiz</span>
        <h3>Quiz</h3>
        <p>Practice with assessments and adaptive quizzes.</p>
      </a>
      <a class="card" routerLink="/student/messaging">
        <span class="material-icons-round">chat</span>
        <h3>Messaging</h3>
        <p>Collaborate with teammates and instructors.</p>
      </a>
    </section>
  `,
  styleUrl: './student-dashboard-home.component.scss'
})
export class StudentDashboardHomeComponent {}
