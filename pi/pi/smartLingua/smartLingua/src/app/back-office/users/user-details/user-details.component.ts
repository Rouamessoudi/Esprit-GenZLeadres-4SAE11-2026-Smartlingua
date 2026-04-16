import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="user-details-page">
      @if (loading) {
        <div class="loading">Loading...</div>
      } @else if (!user) {
        <div class="error">User not found.</div>
        <a routerLink="/admin/users">← Back to list</a>
      } @else {
        <div class="page-header">
          <a routerLink="/admin/users" class="back-link">← Back to list</a>
          <div class="header-actions">
            <a [routerLink]="['/admin/users', user.id, 'edit']" class="btn btn-primary">Edit</a>
          </div>
        </div>

        <div class="detail-card card">
          <h2>User #{{ user.id }}</h2>
          <dl class="detail-list">
            <dt>Username</dt>
            <dd>{{ user.username }}</dd>
            <dt>Email</dt>
            <dd>{{ user.email }}</dd>
            <dt>Full Name</dt>
            <dd>{{ user.fullName || '-' }}</dd>
            <dt>Role</dt>
            <dd>
              <span class="role-badge" [class.teacher]="user.role === 'teacher'" [class.student]="user.role === 'student'">
                {{ user.role || 'student' }}
              </span>
            </dd>
            @if (user.createdAt) {
              <dt>Created</dt>
              <dd>{{ user.createdAt | date:'medium' }}</dd>
            }
            @if (user.updatedAt) {
              <dt>Updated</dt>
              <dd>{{ user.updatedAt | date:'medium' }}</dd>
            }
          </dl>
        </div>
      }
    </div>
  `,
  styles: [`
    .user-details-page { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .back-link { color: var(--primary); }
    .detail-card { padding: 1.5rem; max-width: 500px; }
    .detail-card h2 { margin-bottom: 1rem; font-size: 1.25rem; }
    .detail-list { display: grid; grid-template-columns: 120px 1fr; gap: 0.75rem 1.5rem; }
    .detail-list dt { color: var(--text-light); font-size: 0.9rem; }
    .detail-list dd { margin: 0; }
    .role-badge { padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .role-badge.teacher { background: rgba(108,92,231,0.15); color: var(--primary); }
    .role-badge.student { background: rgba(0,206,201,0.15); color: var(--accent); }
    .loading, .error { padding: 2rem; }
  `]
})
export class UserDetailsComponent implements OnInit {
  user: User | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.loading = false; return; }
    this.userService.getById(id).subscribe({
      next: (u) => { this.user = u; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
