import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ForumService } from '../../services/forum.service';
import { ForumPost } from '../../models/forum.model';

@Component({
  selector: 'app-forum-form',
  templateUrl: './forum-form.component.html',
  styleUrls: ['./forum-form.component.css']
})
export class ForumFormComponent {
  post: ForumPost = {
    title: '',
    content: '',
    authorId: 1,
    category: ''
  };
  submitting = false;
  error = '';

  constructor(
    private forumService: ForumService,
    private router: Router
  ) {}

  submit(): void {
    if (!this.post.title.trim() || !this.post.content.trim()) {
      this.error = 'Titre et contenu requis';
      return;
    }
    this.submitting = true;
    this.error = '';
    this.forumService.createPost(this.post).subscribe({
      next: (created) => {
        this.router.navigate(['/forum', created.id]);
        this.submitting = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la création';
        this.submitting = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/forum']);
  }
}
