import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ForumService } from '../../services/forum.service';
import { ForumPost } from '../../models/forum.model';

@Component({
  selector: 'app-forum-list',
  templateUrl: './forum-list.component.html',
  styleUrls: ['./forum-list.component.css']
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

  newPost(): void {
    this.router.navigate(['/forum/new']);
  }

  onCategoryChange(): void {
    this.loadPosts();
  }
}
