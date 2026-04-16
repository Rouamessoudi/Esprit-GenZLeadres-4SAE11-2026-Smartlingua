import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService, AuthResponse } from '../../../core/services/auth-api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="register-page">
      <div class="container">
        <div class="auth-card">
          <h1>Creer un compte</h1>
          <p class="subtitle">Inscris-toi pour acceder a la plateforme.</p>

          @if (errorMessage) {
            <p class="error">{{ errorMessage }}</p>
          }
          @if (successMessage) {
            <p class="success">{{ successMessage }}</p>
          }

          <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
            <label for="username">Nom d'utilisateur</label>
            <input id="username" type="text" [(ngModel)]="username" name="username" required minlength="2" maxlength="80" />

            <label for="email">Email</label>
            <input id="email" type="email" [(ngModel)]="email" name="email" required />

            <label for="password">Mot de passe</label>
            <input id="password" type="password" [(ngModel)]="password" name="password" required minlength="4" maxlength="100" />

            <label for="confirmPassword">Confirmer le mot de passe</label>
            <input id="confirmPassword" type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required />

            <label>Role</label>
            <div class="role-options">
              <label class="radio-label">
                <input type="radio" [(ngModel)]="role" name="role" value="student" />
                Etudiant
              </label>
              <label class="radio-label">
                <input type="radio" [(ngModel)]="role" name="role" value="prof" />
                PROF
              </label>
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="registerForm.invalid || loading">
              {{ loading ? 'Inscription...' : 'Creer mon compte' }}
            </button>
          </form>

          <p class="back-link"><a routerLink="/auth/login">J ai deja un compte</a></p>
          <p class="back-link"><a routerLink="/">Retour a l'accueil</a></p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .register-page { padding: 40px 0; }
    .auth-card { max-width: 520px; margin: 0 auto; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 24px; }
    h1 { margin: 0 0 8px; }
    .subtitle { color: var(--text-light); margin-bottom: 16px; }
    label { display: block; margin: 8px 0 6px; font-weight: 600; }
    input { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .role-options { display: flex; gap: 16px; margin-bottom: 12px; }
    .radio-label { display: inline-flex; align-items: center; gap: 8px; font-weight: 500; }
    .error { color: #dc2626; margin: 0 0 12px; }
    .success { color: #059669; margin: 0 0 12px; }
    .back-link { margin-top: 12px; text-align: center; }
  `]
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  role: 'student' | 'prof' = 'student';
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authApiService: AuthApiService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const username = this.username.trim();
    const email = this.email.trim().toLowerCase();
    if (!username || !email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }
    if (username.length < 2) {
      this.errorMessage = 'Le nom d utilisateur doit contenir au moins 2 caracteres.';
      return;
    }
    if (this.password.length < 4) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 4 caracteres.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.loading = true;
    this.authApiService.signup({
      username,
      email,
      password: this.password,
      role: this.role
    }).subscribe({
      next: (res: AuthResponse) => {
        this.loading = false;
        if (res.ok) {
          this.successMessage = res.message || 'Compte cree avec succes. Vous pouvez maintenant vous connecter.';
          setTimeout(() => this.router.navigate(['/auth/login']), 1200);
          return;
        }
        this.errorMessage = this.toFrenchMessage(res.message || 'Erreur lors de l inscription.');
      },
      error: (err) => {
        this.loading = false;
        const message = err?.error?.message;
        if (typeof message === 'string' && message.trim()) {
          this.errorMessage = this.toFrenchMessage(message);
        } else {
          this.errorMessage = 'Erreur lors de l inscription. Veuillez reessayer.';
        }
      }
    });
  }

  private toFrenchMessage(message: string): string {
    const map: Record<string, string> = {
      'Email already exists.': 'Cet email est deja utilise.',
      'Cet email est deja utilise.': 'Cet email est deja utilise.',
      'Le role doit etre STUDENT ou PROF.': 'Le role doit etre Etudiant ou PROF.',
      "L'email est obligatoire.": 'L email est obligatoire.',
      "Le nom d'utilisateur est obligatoire.": 'Le nom d utilisateur est obligatoire.',
      'Le mot de passe est obligatoire.': 'Le mot de passe est obligatoire.'
    };
    return map[message] ?? message;
  }
}
