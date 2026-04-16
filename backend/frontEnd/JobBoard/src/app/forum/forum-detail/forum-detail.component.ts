import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ForumService } from '../../services/forum.service';
import { ForumPost, Comment, CommentRequest } from '../../models/forum.model';

@Component({
  selector: 'app-forum-detail',
  templateUrl: './forum-detail.component.html',
  styleUrls: ['./forum-detail.component.css']
})
export class ForumDetailComponent implements OnInit {
  post: ForumPost | null = null;
  comments: Comment[] = [];
  loading = true;
  error = '';
  newComment = '';
  submitting = false;
  authorId = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.loadPost(+id);
    } else if (id === 'new') {
      this.loading = false;
      this.post = { title: '', content: '', authorId: this.authorId };
    }
  }

  loadPost(id: number): void {
    this.forumService.getPost(id).subscribe({
      next: (data) => {
        this.post = data;
        this.loadComments(id);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Post introuvable';
        this.loading = false;
      }
    });
  }

  loadComments(postId: number): void {
    this.forumService.getCommentsByPost(postId).subscribe({
      next: (data) => {
        this.comments = data;
      }
    });
  }

  submitComment(): void {
    if (!this.post?.id || !this.newComment.trim()) return;
    this.submitting = true;
    const request: CommentRequest = {
      content: this.newComment.trim(),
      postId: this.post.id,
      authorId: this.authorId
    };
    this.forumService.createComment(request).subscribe({
      next: () => {
        this.newComment = '';
        this.loadComments(this.post!.id!);
        this.submitting = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de l\'envoi';
        this.submitting = false;
      }
    });
  }

  back(): void {
    this.router.navigate(['/forum']);
  }
}
