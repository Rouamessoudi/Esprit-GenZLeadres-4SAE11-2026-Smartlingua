import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../../../core/services/forum.service';
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
          <button class="btn btn-primary" (click)="loadPosts()">Filtrer</button>
          <a routerLink="/forum/new" class="btn btn-primary">
            <span class="material-icons-round" style="font-size: 18px; vertical-align: middle; margin-right: 6px;">add</span>
            Nouveau post
          </a>
        </div>

        @if (loading) {
          <div class="loading">Chargement...</div>
        } @else if (error) {
          <div class="error">{{ error }}</div>
        } @else {
          <div class="posts-list">
            @for (post of posts; track post.id; let i = $index) {
              <a [routerLink]="['/forum', post.id]" class="post-card animate-fade-in-up" [style.animation-delay]="(i * 0.05) + 's'">
                <h3>{{ post.title }}</h3>
                <p class="post-meta">
                  @if (post.category) {
                    <span class="category">{{ post.category }}</span>
                  }
                  <span class="date">{{ post.createdAt | date:'short' }}</span>
                </p>
                <p class="post-content">{{ (post.content || '').slice(0, 150) }}{{ (post.content || '').length > 150 ? '...' : '' }}</p>
              </a>
            }
            @if (posts.length === 0) {
              <div class="empty">
                <span class="material-icons-round empty-icon">forum</span>
                <p>Aucun post pour le moment.</p>
                <a routerLink="/forum/new" class="btn btn-primary">Créer un post</a>
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

  constructor(
    private forumService: ForumService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading = true;
    this.error = '';
    const category = this.categoryFilter.trim() || undefined;
    this.forumService.getPosts(category).subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement des posts';
        this.loading = false;
      }
    });
  }

  viewPost(id: number): void {
    this.router.navigate(['/forum', id]);
  }
}
