import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="user-form-page">
      <div class="page-header">
        <a routerLink="/admin/users" class="back-link">← Back to list</a>
        <h1>{{ isEdit ? 'Edit User' : 'New User' }}</h1>
      </div>

      <form (ngSubmit)="onSubmit()" class="form-card card">
        <div class="form-group">
          <label for="username">Username *</label>
          <input id="username" type="text" [(ngModel)]="user.username" name="username" required placeholder="johndoe" />
        </div>
        <div class="form-group">
          <label for="email">Email *</label>
          <input id="email" type="email" [(ngModel)]="user.email" name="email" required placeholder="john@example.com" />
        </div>
        <div class="form-group">
          <label for="fullName">Full Name</label>
          <input id="fullName" type="text" [(ngModel)]="user.fullName" name="fullName" placeholder="John Doe" />
        </div>
        <div class="form-group">
          <label for="role">Role</label>
          <select id="role" [(ngModel)]="user.role" name="role">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        @if (errorMessage) {
          <div class="error">{{ errorMessage }}</div>
        }
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            {{ isEdit ? 'Update' : 'Create' }}
          </button>
          <a routerLink="/admin/users" class="btn btn-secondary">Cancel</a>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .user-form-page { padding: 1.5rem; max-width: 500px; }
    .page-header { margin-bottom: 1.5rem; }
    .back-link { display: inline-block; margin-bottom: 0.5rem; color: var(--primary); }
    .form-card { padding: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-weight: 600; margin-bottom: 0.35rem; font-size: 0.9rem; }
    .form-group input, .form-group select { width: 100%; padding: 0.6rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border); }
    .form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
    .error { color: var(--danger); margin-bottom: 1rem; font-size: 0.9rem; }
  `]
})
export class UserFormComponent implements OnInit {
  user: User = { username: '', email: '', role: 'student' };
  isEdit = false;
  userId = 0;
  saving = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.userId = Number(id);
      this.userService.getById(this.userId).subscribe({
        next: (u) => this.user = { ...u },
        error: () => this.router.navigate(['/admin/users'])
      });
    }
  }

  onSubmit() {
    if (!this.user.username?.trim() || !this.user.email?.trim()) {
      this.errorMessage = 'Username and email are required.';
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    const req = this.isEdit
      ? this.userService.update(this.userId, this.user)
      : this.userService.create(this.user);
    req.subscribe({
      next: (u) => this.router.navigate(['/admin/users', u.id]),
      error: (e) => {
        this.errorMessage = UserService.getErrorMessage(e) || 'An error occurred.';
        this.saving = false;
      }
    });
  }
}
