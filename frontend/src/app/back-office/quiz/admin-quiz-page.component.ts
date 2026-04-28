import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-quiz-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="admin-quiz-page">
      <p>La gestion des quiz et des questions est assurée par l'équipe quiz.</p>
      <a routerLink="/admin" class="btn btn-outline btn-sm">Retour au Dashboard</a>
    </div>
  `,
  styles: [`
    .admin-quiz-page { padding: 2rem; text-align: center; }
    .admin-quiz-page p { color: var(--text-light); margin-bottom: 1rem; }
  `]
})
export class AdminQuizPageComponent {}
