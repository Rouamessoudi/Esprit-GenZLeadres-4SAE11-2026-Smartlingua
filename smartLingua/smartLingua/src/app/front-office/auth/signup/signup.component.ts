import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserApiService } from '../../../core/user-api.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="signup-page">
      <div class="signup-card">
        <h1>Créer un compte</h1>
        <p class="subtitle">Votre compte sera enregistré dans la base commune du projet.</p>

        @if (successMessage) {
          <div class="alert success">{{ successMessage }}</div>
          <p class="back-link"><a routerLink="/">Retour à l'accueil</a></p>
        } @else {
          @if (errorMessage) {
            <div class="alert error">{{ errorMessage }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="email">Email</label>
              <input id="email" type="email" formControlName="email" placeholder="vous@exemple.com" />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <span class="error-text">Email requis et valide.</span>
              }
            </div>
            <div class="form-group">
              <label for="username">Nom d'utilisateur</label>
              <input id="username" type="text" formControlName="username" placeholder="johndoe" />
              @if (form.get('username')?.invalid && form.get('username')?.touched) {
                <span class="error-text">2 à 50 caractères.</span>
              }
            </div>
            <div class="form-group">
              <label for="password">Mot de passe</label>
              <input id="password" type="password" formControlName="password" placeholder="••••••••" />
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <span class="error-text">Minimum 6 caractères.</span>
              }
            </div>
            <div class="form-group">
              <label for="confirmPassword">Confirmer le mot de passe</label>
              <input id="confirmPassword" type="password" formControlName="confirmPassword" placeholder="••••••••" />
              @if (form.get('confirmPassword')?.touched && form.hasError('mismatch')) {
                <span class="error-text">Les mots de passe ne correspondent pas.</span>
              }
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">Prénom</label>
                <input id="firstName" type="text" formControlName="firstName" placeholder="Jean" />
              </div>
              <div class="form-group">
                <label for="lastName">Nom</label>
                <input id="lastName" type="text" formControlName="lastName" placeholder="Dupont" />
              </div>
            </div>
            <button type="submit" class="btn-submit" [disabled]="form.invalid || loading">
              {{ loading ? 'Création...' : 'Créer mon compte' }}
            </button>
          </form>

          <p class="login-link">Déjà un compte ? <a routerLink="/" (click)="goLogin()">Se connecter (Sign In)</a></p>
        }
      </div>
    </div>
  `,
  styles: [`
    .signup-page {
      min-height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .signup-card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: 2.5rem;
      max-width: 420px;
      width: 100%;
    }
    .signup-card h1 {
      font-size: 1.5rem;
      color: var(--bg-dark);
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: var(--text-light);
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.35rem;
      color: var(--text);
    }
    .form-group input {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 1rem;
    }
    .form-group input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.2);
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .error-text {
      font-size: 0.8rem;
      color: var(--danger);
      margin-top: 0.25rem;
      display: block;
    }
    .alert {
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      margin-bottom: 1rem;
    }
    .alert.success {
      background: rgba(0, 184, 148, 0.15);
      color: var(--success);
    }
    .alert.error {
      background: rgba(225, 112, 85, 0.15);
      color: var(--danger);
    }
    .btn-submit {
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--gradient-primary);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      margin-top: 0.5rem;
    }
    .btn-submit:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .login-link, .back-link {
      margin-top: 1.25rem;
      text-align: center;
      font-size: 0.9rem;
      color: var(--text-light);
    }
    .login-link a, .back-link a {
      color: var(--primary);
      font-weight: 500;
    }
  `]
})
export class SignupComponent {
  form: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private userApi: UserApiService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      firstName: [''],
      lastName: ['']
    }, { validators: this.passwordMatch });
  }

  passwordMatch(g: FormGroup) {
    const p = g.get('password')?.value;
    const c = g.get('confirmPassword')?.value;
    return p === c ? null : { mismatch: true };
  }

  onSubmit() {
    this.errorMessage = '';
    if (this.form.invalid) return;
    this.loading = true;
    const value = this.form.value;
    this.userApi.register({
      email: value.email,
      username: value.username,
      password: value.password,
      firstName: value.firstName || undefined,
      lastName: value.lastName || undefined
    }).subscribe({
      next: () => {
        this.successMessage = 'Compte créé. Vous pouvez maintenant vous connecter avec Sign In.';
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Erreur lors de la création du compte.';
      }
    });
  }

  goLogin() {
    // Keycloak login will be triggered by the navbar Sign In; just navigate home
    this.router.navigate(['/']);
  }
}
