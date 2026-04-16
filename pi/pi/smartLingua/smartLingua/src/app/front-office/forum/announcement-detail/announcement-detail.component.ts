import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ForumService } from '../../../core/services/forum.service';
import { Announcement } from '../../../core/models/forum.model';

@Component({
  selector: 'app-announcement-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="announcement-detail" *ngIf="announcement">
      <div class="container">
        <a routerLink="/announcements" class="btn-back">
          <span class="material-icons-round">arrow_back</span> Retour aux annonces
        </a>

        <article class="announcement-card detail animate-fade-in-up">
          @if (!announcement.isActive) {
            <span class="badge inactive">Inactive</span>
          }
          <h1>{{ announcement.title }}</h1>
          <p class="meta">
            <span class="material-icons-round">schedule</span>
            {{ announcement.publishedAt | date:'medium' }}
          </p>
          <div class="content">{{ announcement.content }}</div>
          <div class="actions" *ngIf="canEdit">
            <a [routerLink]="['/announcements', announcement.id, 'edit']" class="btn btn-secondary">Modifier</a>
            <button (click)="delete()" class="btn btn-danger">Supprimer</button>
          </div>
        </article>
      </div>
    </section>
    @if (loading) {
      <div class="loading">Chargement...</div>
    }
    @if (error && !announcement) {
      <div class="error">{{ error }}</div>
    }
  `,
  styleUrl: './announcement-detail.component.scss'
})
export class AnnouncementDetailComponent implements OnInit {
  announcement: Announcement | null = null;
  loading = true;
  error = '';
  canEdit = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.loadAnnouncement(+id);
    }
  }

  loadAnnouncement(id: number): void {
    this.forumService.getAnnouncement(id).subscribe({
      next: (data) => {
        this.announcement = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Annonce introuvable';
        this.loading = false;
      }
    });
  }

  delete(): void {
    if (!this.announcement?.id || !confirm('Supprimer cette annonce ?')) return;
    this.forumService.deleteAnnouncement(this.announcement.id).subscribe({
      next: () => this.router.navigate(['/announcements']),
      error: (err) => this.error = err.error?.message || 'Erreur lors de la suppression'
    });
  }
}
