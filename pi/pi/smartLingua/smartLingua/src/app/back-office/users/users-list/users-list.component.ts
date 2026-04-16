import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="users-page">
      <div class="page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage users in the SmartLingua platform.</p>
        </div>
        <a routerLink="/admin/users/new" class="btn btn-primary">
          <span class="material-icons-round">add</span> New User
        </a>
      </div>

      @if (loading) {
        <div class="loading">Loading users...</div>
      } @else if (error) {
        <div class="error">{{ error }}</div>
      } @else {
        <div class="table-card card">
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users; track user.id) {
                  <tr>
                    <td>{{ user.id }}</td>
                    <td><strong>{{ user.username }}</strong></td>
                    <td>{{ user.email }}</td>
                    <td>{{ user.fullName || '-' }}</td>
                    <td>
                      <span class="role-badge" [class.teacher]="user.role === 'teacher'" [class.student]="user.role === 'student'">
                        {{ user.role || 'student' }}
                      </span>
                    </td>
                    <td>
                      <a [routerLink]="['/admin/users', user.id]" class="btn-icon" title="View">
                        <span class="material-icons-round">visibility</span>
                      </a>
                      <a [routerLink]="['/admin/users', user.id, 'edit']" class="btn-icon" title="Edit">
                        <span class="material-icons-round">edit</span>
                      </a>
                      <button (click)="deleteUser(user)" class="btn-icon danger" title="Delete">
                        <span class="material-icons-round">delete</span>
                      </button>
                    </td>
                  </tr>
                }
                @if (users.length === 0) {
                  <tr>
                    <td colspan="6" class="empty-cell">No users yet. <a routerLink="/admin/users/new">Create one</a></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .users-page { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .page-header p { color: var(--text-light); font-size: 0.9rem; }
    .table-card { overflow: hidden; }
    .btn-icon { display: inline-flex; padding: 0.35rem; color: var(--text-light); border-radius: var(--radius-sm); }
    .btn-icon:hover { background: rgba(108,92,231,0.1); color: var(--primary); }
    .btn-icon.danger:hover { background: rgba(225,112,85,0.1); color: var(--danger); }
    .role-badge { padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .role-badge.teacher { background: rgba(108,92,231,0.15); color: var(--primary); }
    .role-badge.student { background: rgba(0,206,201,0.15); color: var(--accent); }
    .empty-cell { text-align: center; padding: 2rem; color: var(--text-light); }
    .empty-cell a { color: var(--primary); }
    .loading, .error { padding: 2rem; text-align: center; color: var(--text-light); }
    .error { color: var(--danger); }
  `]
})
export class UsersListComponent implements OnInit {
  users: User[] = [];
  loading = true;
  error = '';

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = '';
    this.userService.getAll().subscribe({
      next: (list) => { this.users = list; this.loading = false; },
      error: (e) => { this.error = UserService.getErrorMessage(e) || 'Failed to load users.'; this.loading = false; }
    });
  }

  deleteUser(user: User) {
    if (!user.id || !confirm(`Delete user "${user.username}"?`)) return;
    this.userService.delete(user.id).subscribe({
      next: () => this.loadUsers(),
      error: (e) => alert(UserService.getErrorMessage(e) || 'Failed to delete.')
    });
  }
}
