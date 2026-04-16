import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService, AuthResponse } from '../../../core/services/auth-api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="login-page">
      <div class="container">
        <div class="auth-card">
          <h1>Se connecter</h1>
          <p class="subtitle">Entrez votre email et votre mot de passe.</p>

          @if (errorMessage) {
            <p class="error">{{ errorMessage }}</p>
          }

          <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
            <label for="email">Email</label>
            <input id="email" type="email" [(ngModel)]="email" name="email" required />

            <label for="password">Mot de passe</label>
            <input id="password" type="password" [(ngModel)]="password" name="password" required />

            <button type="submit" class="btn btn-primary" [disabled]="loginForm.invalid || loading">
              {{ loading ? 'Connexion...' : 'Se connecter' }}
            </button>
          </form>

          <p class="back-link"><a routerLink="/auth/register">Creer un compte</a></p>
          <p class="back-link"><a routerLink="/">Retour a l'accueil</a></p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .login-page { padding: 40px 0; }
    .auth-card { max-width: 520px; margin: 0 auto; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 24px; }
    h1 { margin: 0 0 8px; }
    .subtitle { color: var(--text-light); margin-bottom: 16px; }
    label { display: block; margin: 8px 0 6px; font-weight: 600; }
    input { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); }
    button { margin-top: 12px; }
    .error { color: #dc2626; margin: 0 0 12px; }
    .back-link { margin-top: 12px; text-align: center; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(
    private authApiService: AuthApiService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.errorMessage = '';
    const email = this.email.trim().toLowerCase();
    const password = this.password;
    if (!email || !password) {
      this.errorMessage = 'Veuillez renseigner l email et le mot de passe.';
      return;
    }

    this.loading = true;
    this.authApiService.login({ email, password }).subscribe({
      next: (res: AuthResponse) => {
        this.loading = false;
        if (!res.ok || !res.user) {
          this.errorMessage = this.toFrenchMessage(res.message || 'Email ou mot de passe incorrect.');
          return;
        }
        this.authApiService.setSession(res.user);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        const message = err?.error?.message;
        if (typeof message === 'string' && message.trim()) {
          this.errorMessage = this.toFrenchMessage(message);
        } else {
          this.errorMessage = 'Erreur de connexion. Veuillez reessayer.';
        }
      }
    });
  }

  private toFrenchMessage(message: string): string {
    const map: Record<string, string> = {
      'Email ou mot de passe incorrect.': 'Email ou mot de passe incorrect.',
      'Compte non configure pour la connexion locale.': 'Ce compte ne peut pas se connecter avec email/mot de passe.',
      "L'email est obligatoire.": 'L email est obligatoire.',
      'Le mot de passe est obligatoire.': 'Le mot de passe est obligatoire.',
      'Format d email invalide.': 'Format d email invalide.'
    };
    return map[message] ?? message;
  }
}
