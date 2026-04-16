import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ForumService } from '../../../core/services/forum.service';
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
          <a routerLink="/announcements/new" class="btn btn-primary">
            <span class="material-icons-round" style="font-size: 18px; vertical-align: middle; margin-right: 6px;">add</span>
            Nouvelle annonce
          </a>
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
                <a routerLink="/announcements/new" class="btn btn-primary">Créer une annonce</a>
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

  constructor(private forumService: ForumService) {}

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  loadAnnouncements(): void {
    this.loading = true;
    this.error = '';
    const obs = this.showAll
      ? this.forumService.getAnnouncements()
      : this.forumService.getActiveAnnouncements();
    obs.subscribe({
      next: (data) => {
        this.announcements = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement';
        this.loading = false;
      }
    });
  }

  toggleShowAll(): void {
    this.showAll = !this.showAll;
    this.loadAnnouncements();
  }
}
