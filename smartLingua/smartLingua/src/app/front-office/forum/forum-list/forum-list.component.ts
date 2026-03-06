import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ForumService } from '../forum.service';
import { BlogPost } from '../forum.model';

@Component({
  selector: 'app-forum-list',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <section class="forum-page">
      <div class="container">
        <div class="page-header animate-fade-in-up">
          <h1>Discussion Forum</h1>
          <p>Share ideas, ask questions, and connect with other learners and teachers.</p>
          <a routerLink="/forum/new" class="btn btn-primary btn-lg">
            <span class="material-icons-round">add</span>
            New Post
          </a>
        </div>

        @if (loading) {
          <div class="loading">Loading posts...</div>
        } @else if (error) {
          <div class="error">{{ error }}</div>
        } @else {
          <div class="posts-list">
            @for (post of posts; track post.id; let i = $index) {
              <article class="post-card card animate-fade-in-up" [style.animation-delay]="(i * 0.05) + 's'">
                <div class="post-card-header">
                  <h2><a [routerLink]="['/forum', post.id]">{{ post.title }}</a></h2>
                  <span class="post-meta">By User #{{ post.authorId }} · {{ post.createdAt | date:'medium' }}</span>
                </div>
                <p class="post-excerpt">{{ post.content.length > 200 ? post.content.slice(0, 200) + '...' : post.content }}</p>
                <a [routerLink]="['/forum', post.id]" class="read-more">Read more →</a>
              </article>
            }
            @if (posts.length === 0) {
              <div class="empty">No posts yet. Be the first to start a discussion!</div>
            }
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './forum-list.component.scss'
})
export class ForumListComponent implements OnInit {
  posts: BlogPost[] = [];
  loading = true;
  error = '';

  constructor(private forumService: ForumService) {}

  ngOnInit() {
    this.forumService.getPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load posts. Is the forum API running on port 8090?';
        this.loading = false;
      }
    });
  }
}
