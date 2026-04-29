import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { usersGatewayPrefix } from '../../core/api-gateway-urls';

interface AdminUserDto {
  id: number;
  keycloakId?: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  enabled?: boolean;
  deleted?: boolean;
  createdAt?: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="users-admin">
      <header>
        <h2>Utilisateurs inscrits</h2>
        <p *ngIf="isAdminUser">Gestion des comptes (admin): filtre, recherche, role, suppression.</p>
        <p *ngIf="isTeacherUser">Vue enseignant: liste des etudiants inscrits (lecture seule).</p>
      </header>

      <p class="error" *ngIf="error">{{ error }}</p>

      <div class="toolbar" *ngIf="!error">
        <input
          type="text"
          placeholder="Rechercher username ou email"
          [value]="query"
          (input)="onSearchChange(($any($event.target)).value)"
        />
        <select [value]="roleFilter" (change)="onRoleChange(($any($event.target)).value)">
          <option value="">Tous les roles</option>
          <option value="STUDENT">STUDENT</option>
          <option value="TEACHER">TEACHER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      <div class="table-wrap" *ngIf="!error">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Date creation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{ user.username || '-' }}</td>
              <td>{{ user.email || '-' }}</td>
              <td>{{ user.firstName || '-' }}</td>
              <td>{{ user.lastName || '-' }}</td>
              <td>
                <select
                  [value]="user.role || 'STUDENT'"
                  (change)="changeRole(user, ($any($event.target)).value)"
                  [disabled]="!isAdminUser || isProtectedAdmin(user)"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="TEACHER">TEACHER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
              <td>{{ user.enabled === false ? 'Disabled' : 'Active' }}</td>
              <td>{{ user.createdAt ? (user.createdAt | date:'dd/MM/yyyy HH:mm') : '-' }}</td>
              <td>
                <button class="danger" (click)="deleteUser(user)" [disabled]="!isAdminUser || isProtectedAdmin(user)">Supprimer</button>
              </td>
            </tr>
            <tr *ngIf="users.length === 0">
              <td colspan="8">Aucun utilisateur trouve.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .users-admin { display: grid; gap: 12px; }
    h2 { margin: 0; color: #1f2a56; }
    p { margin: 0; color: #5e6892; }
    .error { color: #b34545; font-weight: 600; }
    .toolbar { display: flex; gap: 8px; align-items: center; }
    input, select { border: 1px solid #d6ddff; border-radius: 8px; padding: 8px 10px; font-size: 13px; }
    .table-wrap { background: #fff; border: 1px solid #e6ebff; border-radius: 12px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #eef2ff; }
    th { background: #f8faff; color: #334078; }
    tbody tr:last-child td { border-bottom: none; }
    .danger { border: 1px solid #f1c8c8; color: #b34545; background: #fff7f7; border-radius: 8px; padding: 6px 10px; cursor: pointer; }
    .danger:disabled { opacity: 0.55; cursor: not-allowed; }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: AdminUserDto[] = [];
  error = '';
  query = '';
  roleFilter = '';
  isAdminUser = false;
  isTeacherUser = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdminUser = this.authService.isAdmin();
    this.isTeacherUser = this.authService.isTeacher();
    if (!this.isAdminUser && !this.isTeacherUser) {
      this.error = 'Acces reserve aux enseignants et admins.';
      return;
    }
    this.loadUsers();
  }

  onSearchChange(value: string): void {
    this.query = value ?? '';
    this.loadUsers();
  }

  onRoleChange(value: string): void {
    this.roleFilter = value ?? '';
    this.loadUsers();
  }

  changeRole(user: AdminUserDto, role: string): void {
    if (!this.isAdminUser) {
      this.error = 'Seul un admin peut modifier les roles.';
      return;
    }
    this.http.put<AdminUserDto>(`${usersGatewayPrefix()}/api/admin/users/${user.id}/role`, { role }).subscribe({
      next: (updated) => {
        user.role = updated.role;
      },
      error: () => {
        this.error = 'Impossible de modifier le role.';
      }
    });
  }

  deleteUser(user: AdminUserDto): void {
    if (!this.isAdminUser) {
      this.error = 'Seul un admin peut supprimer un utilisateur.';
      return;
    }
    if (!confirm(`Supprimer/desactiver ${user.username || user.email || 'cet utilisateur'} ?`)) {
      return;
    }
    this.http.delete(`${usersGatewayPrefix()}/api/admin/users/${user.id}`).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.id !== user.id);
      },
      error: () => {
        this.error = 'Suppression refusee (self/admin/protection backend).';
      }
    });
  }

  isProtectedAdmin(user: AdminUserDto): boolean {
    const currentUsername = (this.authService.getUsername() || '').toLowerCase();
    const sameUser = (user.username || '').toLowerCase() === currentUsername;
    return sameUser || (user.role || '').toUpperCase() === 'ADMIN';
  }

  private loadUsers(): void {
    this.error = '';
    if (!this.isAdminUser) {
      this.loadTeacherStudentsReadOnly();
      return;
    }
    const params: string[] = [];
    if (this.roleFilter) params.push(`role=${encodeURIComponent(this.roleFilter)}`);
    if (this.query.trim()) params.push(`q=${encodeURIComponent(this.query.trim())}`);
    const querySuffix = params.length ? `?${params.join('&')}` : '';
    this.http.get<AdminUserDto[]>(`${usersGatewayPrefix()}/api/admin/users${querySuffix}`).subscribe({
      next: (data) => {
        this.users = Array.isArray(data) ? data : [];
      },
      error: () => {
        this.error = 'Impossible de charger les utilisateurs admin.';
      }
    });
  }

  private loadTeacherStudentsReadOnly(): void {
    this.http.get<AdminUserDto[]>(`${usersGatewayPrefix()}/api/users/all`).subscribe({
      next: (data) => {
        const all = Array.isArray(data) ? data : [];
        const q = this.query.trim().toLowerCase();
        this.users = all
          .filter((u) => (u.role || 'STUDENT').toUpperCase() === 'STUDENT')
          .filter((u) => {
            if (!q) {
              return true;
            }
            const username = (u.username || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            return username.includes(q) || email.includes(q);
          });
      },
      error: () => {
        this.error = 'Impossible de charger la liste des etudiants.';
      }
    });
  }
}
