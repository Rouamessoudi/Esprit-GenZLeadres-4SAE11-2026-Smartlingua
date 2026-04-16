import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
                   required minlength="3" maxlength="200" placeholder="Titre de l'annonce">
            @if (titleField.invalid && (titleField.touched || titleField.dirty)) {
              <span class="field-error">
                @if (titleField.errors?.['required']) { Le titre est obligatoire. }
                @if (titleField.errors?.['minlength']) { Le titre doit contenir au moins 3 caractères. }
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
  announcement: Partial<Announcement> = {
    title: '',
    content: '',
    authorId: 1,
    isActive: true
  };
  isEdit = false;
  submitting = false;
  error = '';

  get pageTitle(): string {
    return this.isEdit ? 'Modifier une annonce' : 'Creer une nouvelle annonce';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.loadAnnouncement(+id);
    }
  }

  loadAnnouncement(id: number): void {
    this.forumService.getAnnouncement(id).subscribe({
      next: (data) => this.announcement = { ...data },
      error: (err) => this.error = err.error?.message || 'Annonce introuvable'
    });
  }

  submit(): void {
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
        this.error = err.error?.message || 'Erreur lors de l\'enregistrement';
        this.submitting = false;
      }
    });
  }
}
