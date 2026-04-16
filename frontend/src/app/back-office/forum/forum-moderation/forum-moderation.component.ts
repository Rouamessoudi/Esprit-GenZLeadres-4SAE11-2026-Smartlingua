import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ForumService } from '../../../core/services/forum.service';
import { ForumPost } from '../../../core/models/forum.model';

@Component({
  selector: 'app-forum-moderation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="moderation-page">
      <div class="page-header">
        <h1>Modération du Forum</h1>
        <p>Posts signalés par les utilisateurs - Approuver ou supprimer</p>
      </div>

      @if (loading) {
        <div class="loading">Chargement...</div>
      } @else if (error) {
        <div class="error">{{ error }}</div>
      } @else if (posts.length === 0) {
        <div class="empty">
          <span class="material-icons-round empty-icon">check_circle</span>
          <p>Aucun post signalé pour le moment.</p>
        </div>
      } @else {
        <div class="posts-list">
          @for (post of posts; track post.id) {
            <div class="post-card">
              <div class="post-content">
                <h3>{{ post.title }}</h3>
                <p class="post-meta">
                  @if (post.category) {
                    <span class="category">{{ post.category }}</span>
                  }
                  <span class="date">{{ post.createdAt | date:'short' }}</span>
                  <span class="badge-flagged">Signalé</span>
                </p>
                <p class="post-body">{{ (post.content || '').slice(0, 300) }}{{ (post.content || '').length > 300 ? '...' : '' }}</p>
                <div class="post-stats">
                  <span>{{ post.likesCount ?? 0 }} likes</span>
                </div>
              </div>
              <div class="post-actions">
                <a [routerLink]="['/forum', post.id]" class="btn btn-sm btn-outline" target="_blank">
                  <span class="material-icons-round">visibility</span> Voir
                </a>
                <button type="button" class="btn btn-sm btn-success" (click)="approve(post)" [disabled]="actionLoading === post.id">
                  <span class="material-icons-round">check_circle</span> Approuver
                </button>
                <button type="button" class="btn btn-sm btn-danger" (click)="remove(post)" [disabled]="actionLoading === post.id">
                  <span class="material-icons-round">delete</span> Supprimer
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './forum-moderation.component.scss'
})
export class ForumModerationComponent implements OnInit {
  posts: ForumPost[] = [];
  loading = true;
  error = '';
  actionLoading: number | null = null;

  constructor(private forumService: ForumService) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading = true;
    this.error = '';
    this.forumService.getFlaggedPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement';
        this.loading = false;
      }
    });
  }

  approve(post: ForumPost): void {
    if (!post.id || this.actionLoading) return;
    this.actionLoading = post.id;
    this.forumService.moderatePostStatus(post.id, 'ACTIVE').subscribe({
      next: () => {
        this.posts = this.posts.filter(p => p.id !== post.id);
        this.actionLoading = null;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur';
        this.actionLoading = null;
      }
    });
  }

  remove(post: ForumPost): void {
    if (!post.id || this.actionLoading || !confirm('Supprimer définitivement ce post ?')) return;
    this.actionLoading = post.id;
    this.forumService.moderatePostStatus(post.id, 'REMOVED').subscribe({
      next: () => {
        this.posts = this.posts.filter(p => p.id !== post.id);
        this.actionLoading = null;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur';
        this.actionLoading = null;
      }
    });
  }
}
