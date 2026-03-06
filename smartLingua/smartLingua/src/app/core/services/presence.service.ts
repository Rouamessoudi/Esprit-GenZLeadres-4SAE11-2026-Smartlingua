import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { switchMap, tap, startWith } from 'rxjs/operators';
import { MESSAGING_API_BASE } from '../api-config';

const API = MESSAGING_API_BASE;
const HEARTBEAT_INTERVAL_MS = 25_000;

@Injectable({ providedIn: 'root' })
export class PresenceService {
  private onlineIds = new BehaviorSubject<Set<number>>(new Set());

  readonly onlineUserIds$ = this.onlineIds.asObservable();

  constructor(private http: HttpClient) {}

  /** Démarrer le heartbeat pour l'utilisateur connecté et le polling de la liste online */
  start(userId: number): void {
    this.http.post(`${API}/api/presence/heartbeat`, { userId }).subscribe();
    interval(HEARTBEAT_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.http.get<number[]>(`${API}/api/presence/online`)),
        tap(() => this.http.post(`${API}/api/presence/heartbeat`, { userId }).subscribe())
      )
      .subscribe((ids) => this.onlineIds.next(new Set(ids)));
  }

  /** Rafraîchir une fois la liste des utilisateurs online */
  refresh(): void {
    this.http.get<number[]>(`${API}/api/presence/online`).subscribe((ids) => {
      this.onlineIds.next(new Set(ids));
    });
  }

  isOnline(userId: number): boolean {
    return this.onlineIds.getValue().has(userId);
  }

  getOnlineUserIds(): Set<number> {
    return this.onlineIds.getValue();
  }
}
