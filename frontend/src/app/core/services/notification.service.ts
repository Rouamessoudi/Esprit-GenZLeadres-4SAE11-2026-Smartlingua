import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification, NotificationPriority, NotificationType } from '../models/forum.model';
import { AuthApiService } from './auth-api.service';

/**
 * Client HTTP Angular pour le module Notifications (API forum :8090).
 * Envoie X-User-Id = id de la session locale pour que le backend verifie que l'on ne lit que ses propres notifications.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = `${environment.forumApiUrl}/forum/notifications`;

  constructor(
    private http: HttpClient,
    private authApiService: AuthApiService
  ) {}

  create(payload: Partial<Notification>): Observable<Notification> {
    return this.http.post<Notification>(this.apiUrl, payload, { headers: this.buildHeaders() });
  }

  getMine(unreadOnly?: boolean, type?: NotificationType, priority?: NotificationPriority): Observable<Notification[]> {
    const userId = this.requireUserId();
    let params = new HttpParams().set('userId', userId.toString());
    if (unreadOnly === true) {
      params = params.set('unreadOnly', 'true');
    }
    if (type) {
      params = params.set('type', type);
    }
    if (priority) {
      params = params.set('priority', priority);
    }
    return this.http.get<Notification[]>(this.apiUrl, { params, headers: this.buildHeaders() });
  }

  getUnreadCount(): Observable<{ unreadCount: number }> {
    const userId = this.requireUserId();
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<{ unreadCount: number }>(`${this.apiUrl}/unread-count`, { params, headers: this.buildHeaders() });
  }

  markAsRead(id: number): Observable<Notification> {
    const params = new HttpParams().set('userId', this.requireUserId().toString());
    return this.http.patch<Notification>(`${this.apiUrl}/${id}/read`, {}, { params, headers: this.buildHeaders() });
  }

  markAllAsRead(): Observable<{ updated: number }> {
    const params = new HttpParams().set('userId', this.requireUserId().toString());
    return this.http.patch<{ updated: number }>(`${this.apiUrl}/read-all`, {}, { params, headers: this.buildHeaders() });
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams().set('userId', this.requireUserId().toString());
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { params, headers: this.buildHeaders() });
  }

  private requireUserId(): number {
    const id = this.authApiService.getSession()?.id;
    if (id == null) {
      throw new Error('Utilisateur non connecte.');
    }
    return id;
  }

  /** Doit correspondre au userId en query string (convention du NotificationController cote Spring). */
  private buildHeaders(): HttpHeaders {
    const userId = this.authApiService.getSession()?.id;
    return new HttpHeaders({
      'X-User-Id': userId != null ? userId.toString() : ''
    });
  }
}
