import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../../../core/services/forum.service';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { ForumPost } from '../../../core/models/forum.model';

@Component({
  selector: 'app-forum-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="forum-page">
      <div class="container">
        <div class="page-header animate-fade-in-up">
          <h1>Forum - Discussions</h1>
          <p>Partagez vos questions et échangez avec la communauté SmartLingua.</p>
        </div>

        <div class="filters animate-fade-in-up">
          <div class="search-box">
            <span class="material-icons-round">category</span>
            <input type="text" placeholder="Filtrer par catégorie..." [(ngModel)]="categoryFilter" (keyup.enter)="loadPosts()">
          </div>
          <label class="checkbox-wrap">
            <input type="checkbox" [(ngModel)]="prioritizeByLikes" (change)="loadPosts()">
            Prioriser par likes
          </label>
          <button class="btn btn-primary" (click)="loadPosts()">Filtrer</button>
          @if (isAuthenticated) {
            <a routerLink="/forum/new" class="btn btn-primary">
              <span class="material-icons-round" style="font-size: 18px; vertical-align: middle; margin-right: 6px;">add</span>
              Nouveau post
            </a>
          }
        </div>

        @if (!isAuthenticated) {
          <div class="error">Veuillez vous connecter pour accéder au contenu</div>
        }

        @if (isAuthenticated && engagementScore !== null) {
          <div class="engagement-card animate-fade-in-up">
            <span class="material-icons-round">insights</span>
            <p>Votre score d'engagement: <strong>{{ engagementScore }}</strong></p>
          </div>
        }

        @if (isAuthenticated && recommendations.length > 0) {
          <div class="recommendations animate-fade-in-up">
            <h3>Suggestions basées sur vos likes</h3>
            <div class="recommendation-tags">
              @for (r of recommendations.slice(0, 6); track r.id) {
                <a [routerLink]="['/forum', r.id]" class="rec-tag">{{ r.title }}</a>
              }
            </div>
          </div>
        }

        @if (loading) {
          <div class="loading">Chargement...</div>
        } @else if (error) {
          <div class="error">{{ error }}</div>
        } @else {
          <div class="posts-list">
            @for (post of posts; track post.id; let i = $index) {
              <div class="post-card animate-fade-in-up" [style.animation-delay]="(i * 0.05) + 's'">
                <a [routerLink]="isAuthenticated ? ['/forum', post.id] : ['/auth/login']" class="post-card-link">
                  <h3>{{ post.title }}</h3>
                  <p class="post-meta">
                    @if (post.category) {
                      <span class="category">{{ post.category }}</span>
                    }
                    @if (post.trending) {
                      <span class="trending-badge">Trending</span>
                    }
                    <span class="date">{{ post.createdAt | date:'short' }}</span>
                  </p>
                  <p class="post-content">{{ (post.content || '').slice(0, 150) }}{{ (post.content || '').length > 150 ? '...' : '' }}</p>
                </a>
                <div class="post-card-actions">
                  @if (isAuthenticated) {
                    <button type="button" class="btn-like" (click)="toggleLike(post, $event)" [class.liked]="post.userLiked" [disabled]="likeLoading === post.id">
                      <span class="material-icons-round">{{ post.userLiked ? 'favorite' : 'favorite_border' }}</span>
                      <span>{{ post.likesCount ?? 0 }}</span>
                    </button>
                  }
                </div>
              </div>
            }
            @if (posts.length === 0) {
              <div class="empty">
                <span class="material-icons-round empty-icon">forum</span>
                <p>Aucun post pour le moment.</p>
                @if (isAuthenticated) {
                  <a routerLink="/forum/new" class="btn btn-primary">Créer un post</a>
                }
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './forum-list.component.scss'
})
export class ForumListComponent implements OnInit {
  posts: ForumPost[] = [];
  loading = true;
  error = '';
  categoryFilter = '';
  prioritizeByLikes = false;
  likeLoading: number | null = null;
  currentUserId = 0;
  isAuthenticated = false;
  engagementScore: number | null = null;
  recommendations: ForumPost[] = [];

  constructor(
    private forumService: ForumService,
    private authApiService: AuthApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const session = this.authApiService.getSession();
    this.isAuthenticated = !!session;
    this.currentUserId = session?.id ?? 0;
    if (this.isAuthenticated && this.currentUserId) {
      this.loadEngagementScore();
      this.loadRecommendations();
    }
    this.loadPosts();
  }

  toggleLike(post: ForumPost, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!post.id || this.likeLoading !== null) return;
    if (!this.isAuthenticated || !this.currentUserId) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.likeLoading = post.id;
    const doLike = !post.userLiked;
    const req = doLike
      ? this.forumService.likePost(post.id, this.currentUserId)
      : this.forumService.unlikePost(post.id, this.currentUserId);
    req.subscribe({
      next: (res) => {
        post.likesCount = res.likesCount;
        post.userLiked = res.liked;
        this.likeLoading = null;
      },
      error: () => {
        this.likeLoading = null;
      }
    });
  }

  loadPosts(): void {
    this.loading = true;
    this.error = '';
    const category = this.categoryFilter.trim() || undefined;
    this.forumService.getPosts(category, this.currentUserId, this.prioritizeByLikes).subscribe({
      next: (data) => {
        this.posts = this.normalizePosts(data);
        this.loading = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err);
        this.posts = [];
        this.loading = false;
      }
    });
  }

  viewPost(id: number): void {
    this.router.navigate(['/forum', id]);
  }

  private normalizePosts(data: ForumPost[] | null | undefined): ForumPost[] {
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map((post) => ({
      ...post,
      title: post.title ?? '',
      content: post.content ?? '',
      category: post.category ?? '',
      likesCount: post.likesCount ?? 0,
      userLiked: post.userLiked ?? false,
      trending: post.trending ?? false
    }));
  }

  private loadEngagementScore(): void {
    this.forumService.getEngagementScore(this.currentUserId).subscribe({
      next: (res) => {
        this.engagementScore = res?.score ?? 0;
      },
      error: () => {
        this.engagementScore = null;
      }
    });
  }

  private loadRecommendations(): void {
    this.forumService.getRecommendations(this.currentUserId, 8).subscribe({
      next: (data) => {
        this.recommendations = this.normalizePosts(data);
      },
      error: () => {
        this.recommendations = [];
      }
    });
  }

  private extractApiError(err: any): string {
    if (err?.status === 401) {
      return 'Veuillez vous connecter pour accéder au contenu';
    }
    if (err?.status === 403) {
      return 'Accès refusé à cette fonctionnalité';
    }
    if (err?.status === 0) {
      return 'Impossible de charger les posts : serveur forum indisponible (port 8090).';
    }
    const message = err?.error?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    return 'Erreur lors du chargement des posts';
  }
}
