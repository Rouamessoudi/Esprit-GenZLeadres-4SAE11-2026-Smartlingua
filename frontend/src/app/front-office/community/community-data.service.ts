import { Injectable } from '@angular/core';
import { AuthService } from '../../core/auth.service';

export type Announcement = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author?: string;
  authorUsername?: string;
  authorName?: string;
};

export type AppNotification = {
  id: number;
  title: string;
  type: 'ANNOUNCEMENT' | 'INFO' | 'FORUM' | 'MESSAGE';
  createdAt: string;
  read: boolean;
};

const ANNOUNCEMENTS_KEY = 'smartlingua_announcements';
const NOTIFICATIONS_KEY = 'smartlingua_notifications';

@Injectable({ providedIn: 'root' })
export class CommunityDataService {
  constructor(private authService: AuthService) {}

  private nextAnnouncementId = 1;
  private nextNotificationId = 1;

  getAnnouncements(): Announcement[] {
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    const list: Announcement[] = raw ? JSON.parse(raw) : [];
    if (!list.length) {
      const seed: Announcement[] = [
        { id: 1, title: 'EMPLOI', content: '12323254SDH', createdAt: new Date().toISOString() },
        { id: 2, title: 'Annonce test notif', content: 'Contenu alerte', createdAt: new Date(Date.now() - 3600000).toISOString() }
      ];
      this.nextAnnouncementId = 3;
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(seed));
      return seed;
    }
    this.nextAnnouncementId = Math.max(...list.map(a => a.id), 0) + 1;
    return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  createAnnouncement(payload: Pick<Announcement, 'title' | 'content'>): void {
    const list = this.getAnnouncements();
    const item: Announcement = {
      id: this.nextAnnouncementId++,
      title: payload.title,
      content: payload.content,
      createdAt: new Date().toISOString()
    };
    list.unshift(item);
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(list));
    this.pushNotification(`Nouvelle annonce: ${item.title}`);
  }

  findAnnouncement(id: number): Announcement | undefined {
    return this.getAnnouncements().find(a => a.id === id);
  }

  getNotifications(): AppNotification[] {
    const raw = localStorage.getItem(this.notificationKey());
    const list: AppNotification[] = raw ? JSON.parse(raw) : [];
    if (!list.length) {
      const bootstrap = this.getAnnouncements().slice(0, 1).map(a => ({
        id: 1,
        title: `Nouvelle annonce: ${a.title}`,
        type: 'ANNOUNCEMENT' as const,
        createdAt: a.createdAt,
        read: false
      }));
      this.nextNotificationId = bootstrap.length + 1;
      localStorage.setItem(this.notificationKey(), JSON.stringify(bootstrap));
      return bootstrap;
    }
    this.nextNotificationId = Math.max(...list.map(n => n.id), 0) + 1;
    return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  markAsRead(id: number): void {
    const list = this.getNotifications().map(n => (n.id === id ? { ...n, read: true } : n));
    localStorage.setItem(this.notificationKey(), JSON.stringify(list));
  }

  deleteNotification(id: number): void {
    const list = this.getNotifications().filter(n => n.id !== id);
    localStorage.setItem(this.notificationKey(), JSON.stringify(list));
  }

  private pushNotification(title: string): void {
    const list = this.getNotifications();
    list.unshift({
      id: this.nextNotificationId++,
      title,
      type: 'ANNOUNCEMENT',
      createdAt: new Date().toISOString(),
      read: false
    });
    localStorage.setItem(this.notificationKey(), JSON.stringify(list));
  }

  replaceNotifications(notifications: AppNotification[]): void {
    localStorage.setItem(this.notificationKey(), JSON.stringify(notifications));
  }

  addInfoNotification(title: string, type: AppNotification['type'] = 'INFO'): void {
    const list = this.getNotifications();
    list.unshift({
      id: this.nextNotificationId++,
      title,
      type,
      createdAt: new Date().toISOString(),
      read: false
    });
    localStorage.setItem(this.notificationKey(), JSON.stringify(list));
  }

  private notificationKey(): string {
    const username = this.authService.getUsername() || 'anonymous';
    return `${NOTIFICATIONS_KEY}_${username}`;
  }
}
