import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ForumService } from '../../../core/services/forum.service';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { Announcement } from '../../../core/models/forum.model';

@Component({
  selector: 'app-announcements-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="announcements-page">
      <div class="container">
        <div class="page-header animate-fade-in-up">
          <h1>Annonces</h1>
          <p>Restez informé des dernières actualités de SmartLingua.</p>
        </div>

        <div class="toolbar animate-fade-in-up">
          <button (click)="toggleShowAll()" class="btn btn-secondary">
            {{ showAll ? 'Actives uniquement' : 'Toutes' }}
          </button>
          @if (canCreateAnnouncement) {
            <a routerLink="/announcements/new" class="btn btn-primary">
              <span class="material-icons-round" style="font-size: 18px; vertical-align: middle; margin-right: 6px;">add</span>
              Nouvelle annonce
            </a>
          }
        </div>

        @if (loading) {
          <div class="loading">Chargement...</div>
        } @else if (error) {
          <div class="error">{{ error }}</div>
        } @else {
          <div class="announcements-list">
            @for (a of announcements; track a.id; let i = $index) {
              <a [routerLink]="['/announcements', a.id]" class="announcement-card animate-fade-in-up" [style.animation-delay]="(i * 0.05) + 's'">
                <h3>{{ a.title }}</h3>
                <p class="meta">{{ a.publishedAt | date:'medium' }}</p>
                <p class="content">{{ (a.content || '').slice(0, 150) }}{{ (a.content || '').length > 150 ? '...' : '' }}</p>
                @if (!a.isActive) {
                  <span class="badge inactive">Inactive</span>
                }
              </a>
            }
            @if (announcements.length === 0) {
              <div class="empty">
                <span class="material-icons-round empty-icon">campaign</span>
                <p>Aucune annonce pour le moment.</p>
                @if (canCreateAnnouncement) {
                  <a routerLink="/announcements/new" class="btn btn-primary">Créer une annonce</a>
                }
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './announcements-list.component.scss'
})
export class AnnouncementsListComponent implements OnInit {
  announcements: Announcement[] = [];
  loading = true;
  error = '';
  showAll = false;
  canCreateAnnouncement = false;
  isAuthenticated = false;

  constructor(
    private forumService: ForumService,
    private authApiService: AuthApiService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authApiService.isAuthenticated();
    this.canCreateAnnouncement = this.authApiService.isProf();
    this.loadAnnouncements();
  }

  loadAnnouncements(): void {
    if (!this.isAuthenticated) {
      this.error = 'Veuillez vous connecter pour accéder au contenu';
      this.announcements = [];
      this.loading = false;
      return;
    }
    this.loading = true;
    this.error = '';
    const obs = this.showAll
      ? this.forumService.getAnnouncements()
      : this.forumService.getActiveAnnouncements();
    obs.subscribe({
      next: (data) => {
        this.announcements = this.normalizeAnnouncements(data);
        this.loading = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err, 'Erreur lors du chargement');
        this.announcements = [];
        this.loading = false;
      }
    });
  }

  toggleShowAll(): void {
    this.showAll = !this.showAll;
    this.loadAnnouncements();
  }

  private normalizeAnnouncements(data: Announcement[] | null | undefined): Announcement[] {
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map((a) => ({
      ...a,
      title: a.title ?? '',
      content: a.content ?? '',
      isActive: a.isActive ?? true
    }));
  }

  private extractApiError(err: any, fallback: string): string {
    if (err?.status === 401) {
      return 'Veuillez vous connecter pour accéder au contenu';
    }
    if (err?.status === 403) {
      return 'Accès refusé à cette fonctionnalité';
    }
    if (err?.status === 0) {
      return 'Impossible de joindre le serveur forum (port 8090).';
    }
    const message = err?.error?.message;
    if (typeof message === 'string' && message.trim()) {
      return this.toFrenchMessage(message);
    }
    return fallback;
  }

  private toFrenchMessage(message: string): string {
    const map: Record<string, string> = {
      'Validation failed': 'Validation echouee'
    };
    return map[message] ?? message;
  }
}
