import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { forumGatewayPrefix } from '../../core/api-gateway-urls';
import { CommunityDataService } from '../community/community-data.service';

@Component({
  selector: 'app-announcement-new',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="form-wrap">
      <h2>Créer une nouvelle annonce</h2>
      <form (ngSubmit)="submit()">
        <label>Titre *</label>
        <input [(ngModel)]="title" name="title" required />
        <label>Contenu *</label>
        <textarea [(ngModel)]="content" name="content" rows="6" required></textarea>
        <p *ngIf="error" class="error">{{ error }}</p>
        <div class="actions">
          <button type="button" class="ghost" (click)="cancel()">Annuler</button>
          <button type="submit">Publier</button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .form-wrap { background:#fff; border:1px solid #e8edff; border-radius:14px; padding:18px; max-width:760px; }
    h2 { margin-top:0; }
    form { display:grid; gap:8px; }
    input, textarea { border:1px solid #dce4ff; border-radius:10px; padding:10px; font:inherit; }
    .error { margin: 0; color: #b00020; }
    .actions { display:flex; gap:10px; margin-top:8px; }
    button { background:#6a69ff; color:#fff; border:none; border-radius:10px; padding:9px 14px; font-weight:600; cursor:pointer; }
    .ghost { background:#fff; color:#5a61a0; border:1px solid #cfd7ff; }
  `]
})
export class AnnouncementNewComponent {
  title = '';
  content = '';
  error = '';
  private announcementBasePath = '/student/announcements';

  constructor(private http: HttpClient, private router: Router, private authService: AuthService, private community: CommunityDataService) {
    this.announcementBasePath = this.authService.isAdmin()
      ? '/admin/announcements'
      : (this.authService.isTeacher() ? '/teacher/announcements' : '/student/announcements');
    if (!this.authService.isTeacher() && !this.authService.isAdmin()) {
      void this.router.navigate(['/student/announcements']);
    }
  }

  submit(): void {
    const titleError = this.validateTitle(this.title);
    if (titleError) {
      this.error = titleError;
      return;
    }
    const contentError = this.validateContent(this.content);
    if (contentError) {
      this.error = contentError;
      return;
    }
    const primaryUrl = `${forumGatewayPrefix()}/api/announcements`;
    const legacyUrl = `${forumGatewayPrefix()}/forum/announcements`;
    this.http.post(primaryUrl, { title: this.title, content: this.content }).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          return this.http.post(legacyUrl, { title: this.title, content: this.content });
        }
        return throwError(() => err);
      })
    ).subscribe({
      next: () => {
        this.community.addInfoNotification("Annonce publiee avec succes.", 'INFO');
        this.error = '';
        void this.router.navigate([this.announcementBasePath]);
      },
      error: (err: HttpErrorResponse) => this.handlePublishError(err)
    });
  }

  private handlePublishError(error: HttpErrorResponse): void {
    if (error.status === 403) {
      this.error = "Acces refuse (403): role TEACHER ou ADMIN requis cote backend.";
      return;
    }
    if (error.status === 401) {
      this.error = "Non authentifie (401): reconnectez-vous puis reessayez.";
      return;
    }
    if (error.status === 0) {
      this.error = "Service forum indisponible. Verifiez le microservice forum.";
      return;
    }
    const message = typeof error.error === 'string' ? error.error : error.error?.message;
    this.error = `Impossible de publier l'annonce (${error.status || 'erreur'}).${message ? ' ' + message : ''}`;
  }

  cancel(): void {
    void this.router.navigate([this.announcementBasePath]);
  }

  private validateTitle(value: string): string | null {
    const title = (value ?? '').trim();
    if (!title) {
      return 'Le titre est obligatoire.';
    }
    if (title.length < 4) {
      return 'Le titre doit contenir au moins 4 caracteres.';
    }
    if (/\d/.test(title)) {
      return 'Le titre ne doit pas contenir de chiffres.';
    }
    return null;
  }

  private validateContent(value: string): string | null {
    const content = (value ?? '').trim();
    if (!content) {
      return 'Le contenu est obligatoire.';
    }
    if (content.length < 4) {
      return 'Le contenu doit contenir au moins 4 caracteres.';
    }
    return null;
  }
}
