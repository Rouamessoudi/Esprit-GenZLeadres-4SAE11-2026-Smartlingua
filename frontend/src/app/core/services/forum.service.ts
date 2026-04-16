import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ForumPost, Comment, CommentRequest, Announcement } from '../models/forum.model';
import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private apiUrl = `${environment.forumApiUrl}/forum`;
  private forumsCompatibilityUrl = `${environment.forumApiUrl}/forums`;

  constructor(
    private http: HttpClient,
    private authApiService: AuthApiService
  ) {}

  getPosts(category?: string, userId?: number, prioritizeByLikes = false): Observable<ForumPost[]> {
    let params = new HttpParams();
    if (category && category.trim()) {
      params = params.set('category', category.trim());
    }
    if (userId != null) {
      params = params.set('userId', userId.toString());
    }
    if (prioritizeByLikes) {
      params = params.set('prioritizeByLikes', 'true');
    }
    return this.http.get<ForumPost[]>(`${this.apiUrl}/posts`, { params, headers: this.buildAuthHeaders() }).pipe(
      // Compatibility fallback if backend exposes /forums instead of /forum/posts.
      catchError(() => this.http.get<ForumPost[]>(this.forumsCompatibilityUrl, {
        params,
        headers: this.buildAuthHeaders()
      }))
    );
  }

  getPost(id: number, userId?: number): Observable<ForumPost> {
    let params = new HttpParams();
    if (userId != null) {
      params = params.set('userId', userId.toString());
    }
    return this.http.get<ForumPost>(`${this.apiUrl}/posts/${id}`, { params, headers: this.buildAuthHeaders() });
  }

  createPost(post: ForumPost): Observable<ForumPost> {
    return this.http.post<ForumPost>(`${this.apiUrl}/posts`, post, { headers: this.buildAuthHeaders() }).pipe(
      // Compatibility fallback if backend exposes POST /forums.
      catchError(() => this.http.post<ForumPost>(this.forumsCompatibilityUrl, post, {
        headers: this.buildAuthHeaders()
      }))
    );
  }

  updatePost(id: number, post: ForumPost): Observable<ForumPost> {
    return this.http.put<ForumPost>(`${this.apiUrl}/posts/${id}`, post, { headers: this.buildAuthHeaders() });
  }

  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${id}`, { headers: this.buildAuthHeaders() });
  }

  getCommentsByPost(postId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/comments/post/${postId}`, { headers: this.buildAuthHeaders() });
  }

  createComment(comment: CommentRequest): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/comments`, comment, { headers: this.buildAuthHeaders() });
  }

  updateComment(id: number, comment: Partial<Comment>): Observable<Comment> {
    return this.http.put<Comment>(`${this.apiUrl}/comments/${id}`, comment, { headers: this.buildAuthHeaders() });
  }

  deleteComment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${id}`, { headers: this.buildAuthHeaders() });
  }

  moderateComment(id: number, moderated: boolean): Observable<Comment> {
    return this.http.patch<Comment>(`${this.apiUrl}/comments/${id}/moderate?moderated=${moderated}`, {}, { headers: this.buildAuthHeaders() });
  }

  moderatePost(id: number, moderated: boolean): Observable<ForumPost> {
    return this.http.patch<ForumPost>(`${this.apiUrl}/posts/${id}/moderate?moderated=${moderated}`, {}, { headers: this.buildAuthHeaders() });
  }

  likePost(id: number, userId: number): Observable<{ likesCount: number; liked: boolean }> {
    return this.http.post<{ likesCount: number; liked: boolean }>(`${this.apiUrl}/posts/${id}/like`, { userId }, { headers: this.buildAuthHeaders() });
  }

  unlikePost(id: number, userId: number): Observable<{ likesCount: number; liked: boolean }> {
    return this.http.delete<{ likesCount: number; liked: boolean }>(`${this.apiUrl}/posts/${id}/like`, {
      params: { userId: userId.toString() }
      , headers: this.buildAuthHeaders()
    });
  }

  getLikesCount(id: number): Observable<{ likesCount: number }> {
    return this.http.get<{ likesCount: number }>(`${this.apiUrl}/posts/${id}/likes-count`);
  }

  getTrendingPosts(userId?: number): Observable<ForumPost[]> {
    let params = new HttpParams();
    if (userId != null) {
      params = params.set('userId', userId.toString());
    }
    return this.http.get<ForumPost[]>(`${this.apiUrl}/posts/trending`, { params, headers: this.buildAuthHeaders() });
  }

  getRecommendations(userId?: number, limit = 8): Observable<ForumPost[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (userId != null) {
      params = params.set('userId', userId.toString());
    }
    return this.http.get<ForumPost[]>(`${this.apiUrl}/posts/recommendations`, { params, headers: this.buildAuthHeaders() });
  }

  getEngagementScore(userId: number): Observable<{ userId: number; likes: number; posts: number; comments: number; score: number }> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<{ userId: number; likes: number; posts: number; comments: number; score: number }>(
      `${this.apiUrl}/engagement/score`,
      { params, headers: this.buildAuthHeaders() }
    );
  }

  reportPost(id: number, reporterId: number, reason?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/posts/${id}/report`, { reporterId, reason }, { headers: this.buildAuthHeaders() });
  }

  moderatePostStatus(id: number, status: 'ACTIVE' | 'REMOVED'): Observable<ForumPost> {
    return this.http.put<ForumPost>(`${this.apiUrl}/posts/${id}/moderate`, { status }, { headers: this.buildAuthHeaders() });
  }

  getFlaggedPosts(): Observable<ForumPost[]> {
    return this.http.get<ForumPost[]>(`${this.apiUrl}/posts/flagged`, { headers: this.buildAuthHeaders() });
  }

  getAnnouncements(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(`${this.apiUrl}/announcements`, { headers: this.buildAuthHeaders() });
  }

  getActiveAnnouncements(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(`${this.apiUrl}/announcements/active`, { headers: this.buildAuthHeaders() });
  }

  getAnnouncement(id: number): Observable<Announcement> {
    return this.http.get<Announcement>(`${this.apiUrl}/announcements/${id}`, { headers: this.buildAuthHeaders() });
  }

  createAnnouncement(announcement: Partial<Announcement>): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.apiUrl}/announcements`, announcement, {
      headers: this.buildRoleHeader()
    });
  }

  updateAnnouncement(id: number, announcement: Partial<Announcement>): Observable<Announcement> {
    return this.http.put<Announcement>(`${this.apiUrl}/announcements/${id}`, announcement, {
      headers: this.buildRoleHeader()
    });
  }

  deleteAnnouncement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/announcements/${id}`, {
      headers: this.buildRoleHeader()
    });
  }

  private buildRoleHeader(): HttpHeaders {
    const role = this.authApiService.getUserRole() ?? '';
    const userId = this.authApiService.getSession()?.id;
    return new HttpHeaders({
      'X-User-Role': role,
      'X-User-Id': userId != null ? userId.toString() : ''
    });
  }

  private buildAuthHeaders(): HttpHeaders {
    return this.buildRoleHeader();
  }
}
