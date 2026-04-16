import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { ForumService } from '../../../core/services/forum.service';
import { Announcement } from '../../../core/models/forum.model';

@Component({
  selector: 'app-announcement-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="announcement-form-page">
      <div class="container">
        <h1 class="page-title animate-fade-in-up">{{ pageTitle }}</h1>
        @if (error) {
          <div class="error animate-fade-in-up">{{ error }}</div>
        }
        <form (ngSubmit)="submit()" #announcementForm="ngForm" class="form animate-fade-in-up">
          <div class="form-group">
            <label for="title">Titre *</label>
            <input type="text" id="title" [(ngModel)]="announcement.title" name="title" #titleField="ngModel"
                   required minlength="3" maxlength="200" [pattern]="titlePattern" placeholder="Titre de l'annonce">
            @if (titleField.invalid && (titleField.touched || titleField.dirty)) {
              <span class="field-error">
                @if (titleField.errors?.['required']) { Le titre est obligatoire. }
                @if (titleField.errors?.['minlength']) { Le titre doit contenir au moins 3 caractères. }
                @if (titleField.errors?.['pattern']) { Le titre doit contenir au moins 3 lettres (A-Z). }
                @if (titleField.errors?.['maxlength']) { Le titre ne doit pas dépasser 200 caractères. }
              </span>
            }
          </div>
          <div class="form-group">
            <label for="content">Contenu *</label>
            <textarea id="content" [(ngModel)]="announcement.content" name="content" #contentField="ngModel"
                      rows="8" required minlength="3" maxlength="10000" placeholder="Contenu de l'annonce"></textarea>
            @if (contentField.invalid && (contentField.touched || contentField.dirty)) {
              <span class="field-error">
                @if (contentField.errors?.['required']) { Le contenu est obligatoire. }
                @if (contentField.errors?.['minlength']) { Le contenu doit contenir au moins 3 caractères. }
                @if (contentField.errors?.['maxlength']) { Le contenu ne doit pas dépasser 10 000 caractères. }
              </span>
            }
          </div>
          <div class="form-group" *ngIf="isEdit">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="announcement.isActive" name="isActive">
              Annonce active (visible par tous)
            </label>
          </div>
          <div class="form-actions">
            <a [routerLink]="isEdit ? ['/announcements', announcement.id] : ['/announcements']" class="btn btn-secondary">Annuler</a>
            <button type="submit" [disabled]="announcementForm.invalid || submitting" class="btn btn-primary">
              {{ submitting ? 'Enregistrement...' : (isEdit ? 'Enregistrer' : 'Publier') }}
            </button>
          </div>
        </form>
      </div>
    </section>
  `,
  styleUrl: './announcement-form.component.scss'
})
export class AnnouncementFormComponent implements OnInit {
  // Requires at least 3 alphabetic letters anywhere in the title.
  readonly titlePattern = '^(?=(?:.*[A-Za-z]){3,}).*$';

  announcement: Partial<Announcement> = {
    title: '',
    content: '',
    authorId: 1,
    isActive: true
  };
  isEdit = false;
  submitting = false;
  error = '';
  canManageAnnouncements = false;

  get pageTitle(): string {
    return this.isEdit ? 'Modifier une annonce' : 'Creer une nouvelle annonce';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authApiService: AuthApiService,
    private forumService: ForumService
  ) {}

  ngOnInit(): void {
    if (!this.authApiService.isAuthenticated()) {
      this.error = 'Veuillez vous connecter pour accéder à cette fonctionnalité';
      this.router.navigate(['/auth/login']);
      return;
    }
    const userId = this.authApiService.getSession()?.id;
    if (userId != null) {
      this.announcement.authorId = userId;
    }
    this.canManageAnnouncements = this.authApiService.isProf();
    if (!this.canManageAnnouncements) {
      this.error = 'Acces refuse : seul un utilisateur PROF peut ajouter une annonce.';
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.submitting = true;
      this.loadAnnouncement(+id);
    }
  }

  loadAnnouncement(id: number): void {
    this.forumService.getAnnouncement(id).subscribe({
      next: (data) => {
        this.announcement = { ...data };
        this.submitting = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err, 'Annonce introuvable');
        this.submitting = false;
      }
    });
  }

  submit(): void {
    if (!this.canManageAnnouncements) {
      this.error = 'Acces refuse : seul un utilisateur PROF peut ajouter une annonce.';
      return;
    }
    const t = this.announcement.title?.trim() ?? '';
    const c = this.announcement.content?.trim() ?? '';
    if (!t || !c) {
      this.error = 'Titre et contenu requis';
      return;
    }
    if (t.length < 3) {
      this.error = 'Le titre doit contenir au moins 3 caractères';
      return;
    }
    if (c.length < 3) {
      this.error = 'Le contenu doit contenir au moins 3 caractères';
      return;
    }
    if (t.length > 200) {
      this.error = 'Le titre ne doit pas dépasser 200 caractères';
      return;
    }
    if (!this.hasMinAlphabeticLetters(t)) {
      this.error = 'Le titre doit contenir au moins 3 lettres (A-Z).';
      return;
    }
    if (c.length > 10000) {
      this.error = 'Le contenu ne doit pas dépasser 10 000 caractères';
      return;
    }
    this.submitting = true;
    this.error = '';
    const obs = this.isEdit && this.announcement.id
      ? this.forumService.updateAnnouncement(this.announcement.id, this.announcement)
      : this.forumService.createAnnouncement(this.announcement);
    obs.subscribe({
      next: (created) => {
        this.router.navigate(['/announcements', created.id]);
        this.submitting = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err, 'Erreur lors de l\'enregistrement');
        this.submitting = false;
      }
    });
  }

  private extractApiError(err: any, fallback: string): string {
    if (err?.status === 0) {
      return 'Impossible de joindre le serveur forum (port 8090). Verifiez que le backend est demarre.';
    }
    const fieldErrors = err?.error?.errors;
    if (fieldErrors && typeof fieldErrors === 'object') {
      const firstMessage = Object.values(fieldErrors)[0];
      if (typeof firstMessage === 'string' && firstMessage.trim()) {
        return this.toFrenchMessage(firstMessage);
      }
    }
    const message = err?.error?.message;
    if (typeof message === 'string' && message.trim()) {
      return this.toFrenchMessage(message);
    }
    return fallback;
  }

  private toFrenchMessage(message: string): string {
    const map: Record<string, string> = {
      'Validation failed': 'Validation echouee',
      'Title is required': 'Le titre est obligatoire',
      'Content is required': 'Le contenu est obligatoire',
      'Author ID is required': 'L auteur est obligatoire',
      'Title must be at least 3 characters': 'Le titre doit contenir au moins 3 caracteres',
      'Content must be at least 3 characters': 'Le contenu doit contenir au moins 3 caracteres'
    };
    return map[message] ?? message;
  }

  private hasMinAlphabeticLetters(value: string): boolean {
    return /^(?=(?:.*[A-Za-z]){3,}).*$/.test(value);
  }
}
