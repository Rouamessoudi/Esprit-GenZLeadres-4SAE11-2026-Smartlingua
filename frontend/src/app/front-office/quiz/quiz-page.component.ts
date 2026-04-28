import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-quiz-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="quiz-page">
      <div class="container">
        <p class="quiz-msg">
          Le quiz de niveau et le paiement sont gérés par l'équipe quiz. Vous serez redirigé ici pour passer le quiz ; après le quiz et le paiement, vous pourrez accéder aux cours.
        </p>
        <a routerLink="/" class="btn btn-outline btn-sm">Retour à l'accueil</a>
      </div>
    </section>
  `,
  styles: [`
    .quiz-page { padding: 40px 0; text-align: center; }
    .quiz-msg { max-width: 520px; margin: 0 auto 1rem; color: var(--text-light, #666); }
  `]
})
export class QuizPageComponent {}
