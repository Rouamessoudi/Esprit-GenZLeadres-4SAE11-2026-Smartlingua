import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthApiService } from '../../core/services/auth-api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1>Créer un compte</h1>
        <p class="subtitle">Nom d'utilisateur, email et mot de passe.</p>
        <form (ngSubmit)="onSubmit()">
          <label>Nom d'utilisateur</label>
          <input type="text" [(ngModel)]="username" name="username" placeholder="ex. Marie" required />
          <label>Email</label>
          <input type="email" [(ngModel)]="email" name="email" placeholder="ex. marie@email.com" required />
          <label>Mot de passe</label>
          <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required minlength="4" />
          <label>Confirmer le mot de passe</label>
          <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="••••••••" required />
          <label>Rôle</label>
          <div class="role-options">
            <label class="radio-label">
              <input type="radio" [(ngModel)]="role" name="role" value="student" />
              Étudiant (Student)
            </label>
            <label class="radio-label">
              <input type="radio" [(ngModel)]="role" name="role" value="teacher" />
              Enseignant (Teacher)
            </label>
          </div>
          @if (errorMessage) {
            <p class="error">{{ errorMessage }}</p>
          }
          @if (successMessage) {
            <p class="success">{{ successMessage }}</p>
          }
          <button type="submit" class="btn-primary" [disabled]="loading">Créer mon compte</button>
        </form>
        <p class="link">Déjà un compte ? <a routerLink="/login">Se connecter</a></p>
        <p class="back"><a routerLink="/">← Retour à l'accueil</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .auth-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 2rem; max-width: 400px; width: 100%; }
    h1 { margin: 0 0 0.5rem; font-size: 1.5rem; color: #1a1a2e; }
    .subtitle { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }
    label { display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem; color: #334155; }
    input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; margin-bottom: 1rem; box-sizing: border-box; }
    .error { color: #dc2626; font-size: 0.9rem; margin: -0.5rem 0 1rem; }
    .success { color: #059669; font-size: 0.95rem; font-weight: 600; margin: -0.5rem 0 1rem; }
    .btn-primary { width: 100%; padding: 0.75rem 1rem; background: #6c5ce7; color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 0.5rem; }
    .btn-primary:hover:not(:disabled) { background: #5b4cdb; }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    .link { margin-top: 1rem; text-align: center; font-size: 0.9rem; color: #64748b; }
    .link a { color: #6c5ce7; font-weight: 600; }
    .back { margin-top: 1rem; text-align: center; font-size: 0.9rem; }
    .back a { color: #64748b; text-decoration: none; }
    .back a:hover { text-decoration: underline; }
    .role-options { margin-bottom: 1rem; }
    .radio-label { display: flex; align-items: center; gap: 0.5rem; font-weight: 500; margin-bottom: 0.5rem; cursor: pointer; }
    .radio-label input { width: auto; margin: 0; }
  `]
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  role: 'student' | 'teacher' = 'student';
  errorMessage = '';
  successMessage = '';
  loading = false;

  constructor(private router: Router, private authApi: AuthApiService) {}

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    const user = this.username?.trim();
    const em = this.email?.trim();
    const pwd = this.password;
    if (!user || !em || !pwd) {
      this.errorMessage = 'Remplis tous les champs.';
      return;
    }
    if (pwd.length < 4) {
      this.errorMessage = 'Le mot de passe doit faire au moins 4 caractères.';
      return;
    }
    if (pwd !== this.confirmPassword) {
      this.errorMessage = 'Les deux mots de passe ne correspondent pas.';
      return;
    }
    if (this.role !== 'student' && this.role !== 'teacher') {
      this.errorMessage = 'Choisis un rôle : Étudiant ou Enseignant.';
      return;
    }
    this.loading = true;
    this.authApi.register(user, em, pwd, this.role).subscribe((res) => {
      this.loading = false;
      if (res.ok) {
        this.authApi.setSession(res.user);
        this.successMessage = 'Compte créé avec succès ! Redirection…';
        setTimeout(() => this.router.navigate(['/chat']), 1500);
      } else {
        this.errorMessage = res.message || 'Cet email est déjà utilisé.';
      }
    });
  }
}
