import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Notification, NotificationPriority, NotificationType } from '../../../core/models/forum.model';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * Page /notifications : liste, filtres (type + non lues), marquer lu / tout lu / supprimer.
 * Messages d'erreur en francais pour l'utilisateur final.
 */
@Component({
  selector: 'app-notifications-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="notifications-page">
      <div class="container">
        <div class="page-header animate-fade-in-up">
          <h1>Notifications</h1>
          <p>Consultez vos alertes et notifications importantes.</p>
        </div>

        <div class="toolbar animate-fade-in-up">
          <select [(ngModel)]="selectedType" (change)="loadNotifications()">
            <option value="">Tous les types</option>
            @for (t of types; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
          <select [(ngModel)]="selectedPriority" (change)="loadNotifications()">
            <option value="">Toutes les priorites</option>
            @for (p of priorities; track p) {
              <option [value]="p">{{ p }}</option>
            }
          </select>
          <label class="checkbox-wrap">
            <input type="checkbox" [(ngModel)]="unreadOnly" (change)="loadNotifications()">
            Uniquement non lues
          </label>
          <button class="btn btn-primary btn-sm" (click)="markAllAsRead()" [disabled]="loading || notifications.length === 0">
            Tout marquer comme lu
          </button>
        </div>

        @if (loading) {
          <div class="loading">Chargement...</div>
        } @else if (error) {
          <div class="error">{{ error }}</div>
        } @else if (notifications.length === 0) {
          <div class="empty">
            <span class="material-icons-round empty-icon">notifications_none</span>
            <p>Aucune notification pour le moment.</p>
            <a routerLink="/" class="btn btn-primary">Retour a l'accueil</a>
          </div>
        } @else {
          <div class="list">
            @for (item of notifications; track item.id) {
              <article class="card" [class.unread]="!item.isRead">
                <div class="card-main">
                  <h3>{{ item.title }}</h3>
                  <p class="meta">
                    <span class="tag">{{ item.type }}</span>
                    @if (item.priority) {
                      <span class="tag-priority" [class.high]="item.priority === 'HIGH'" [class.medium]="item.priority === 'MEDIUM'" [class.low]="item.priority === 'LOW'">
                        {{ item.priority }}
                      </span>
                    }
                    <span>{{ item.createdAt | date:'short' }}</span>
                    @if (!item.isRead) {
                      <span class="badge-unread">Non lue</span>
                    }
                  </p>
                  <p class="message">{{ item.message }}</p>
                </div>
                <div class="actions">
                  @if (!item.isRead && item.id) {
                    <button class="btn btn-secondary btn-sm" (click)="markAsRead(item.id)">Marquer lue</button>
                  }
                  @if (item.id) {
                    <button class="btn btn-danger btn-sm" (click)="delete(item.id)">Supprimer</button>
                  }
                </div>
              </article>
            }
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './notifications-list.component.scss'
})
export class NotificationsListComponent implements OnInit {
  notifications: Notification[] = [];
  loading = true;
  error = '';
  unreadOnly = false;
  /** Valeur vide = pas de filtre par type (tous les types). */
  selectedType: '' | NotificationType = '';
  selectedPriority: '' | NotificationPriority = '';
  readonly types: NotificationType[] = ['ANNOUNCEMENT', 'COMMENT', 'REPLY', 'SYSTEM', 'WARNING'];
  readonly priorities: NotificationPriority[] = ['HIGH', 'MEDIUM', 'LOW'];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.error = '';
    this.notificationService.getMine(
      this.unreadOnly,
      this.selectedType || undefined,
      this.selectedPriority || undefined
    ).subscribe({
      next: (items) => {
        this.notifications = Array.isArray(items) ? items : [];
        this.loading = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err);
        this.notifications = [];
        this.loading = false;
      }
    });
  }

  markAsRead(id: number): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => this.loadNotifications(),
      error: (err) => this.error = this.extractApiError(err)
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => this.loadNotifications(),
      error: (err) => this.error = this.extractApiError(err)
    });
  }

  delete(id: number): void {
    this.notificationService.delete(id).subscribe({
      next: () => this.loadNotifications(),
      error: (err) => this.error = this.extractApiError(err)
    });
  }

  private extractApiError(err: any): string {
    if (err?.status === 0) {
      return 'Serveur de notifications indisponible.';
    }
    const message = err?.error?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    return 'Une erreur est survenue lors du chargement des notifications.';
  }
}
