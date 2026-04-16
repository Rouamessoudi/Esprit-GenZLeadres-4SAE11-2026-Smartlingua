import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ForumPost, Comment, CommentRequest, Announcement } from '../models/forum.model';

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private apiUrl = `${environment.forumApiUrl}/forum`;

  constructor(private http: HttpClient) {}

  getPosts(category?: string): Observable<ForumPost[]> {
    let params = new HttpParams();
    if (category && category.trim()) {
      params = params.set('category', category.trim());
    }
    return this.http.get<ForumPost[]>(`${this.apiUrl}/posts`, { params });
  }

  getPost(id: number): Observable<ForumPost> {
    return this.http.get<ForumPost>(`${this.apiUrl}/posts/${id}`);
  }

  createPost(post: ForumPost): Observable<ForumPost> {
    return this.http.post<ForumPost>(`${this.apiUrl}/posts`, post);
  }

  updatePost(id: number, post: ForumPost): Observable<ForumPost> {
    return this.http.put<ForumPost>(`${this.apiUrl}/posts/${id}`, post);
  }

  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${id}`);
  }

  getCommentsByPost(postId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/comments/post/${postId}`);
  }

  createComment(comment: CommentRequest): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/comments`, comment);
  }

  updateComment(id: number, comment: Partial<Comment>): Observable<Comment> {
    return this.http.put<Comment>(`${this.apiUrl}/comments/${id}`, comment);
  }

  deleteComment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${id}`);
  }

  moderateComment(id: number, moderated: boolean): Observable<Comment> {
    return this.http.patch<Comment>(`${this.apiUrl}/comments/${id}/moderate?moderated=${moderated}`, {});
  }

  moderatePost(id: number, moderated: boolean): Observable<ForumPost> {
    return this.http.patch<ForumPost>(`${this.apiUrl}/posts/${id}/moderate?moderated=${moderated}`, {});
  }

  getAnnouncements(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(`${this.apiUrl}/announcements`);
  }

  getActiveAnnouncements(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(`${this.apiUrl}/announcements/active`);
  }

  getAnnouncement(id: number): Observable<Announcement> {
    return this.http.get<Announcement>(`${this.apiUrl}/announcements/${id}`);
  }

  createAnnouncement(announcement: Partial<Announcement>): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.apiUrl}/announcements`, announcement);
  }

  updateAnnouncement(id: number, announcement: Partial<Announcement>): Observable<Announcement> {
    return this.http.put<Announcement>(`${this.apiUrl}/announcements/${id}`, announcement);
  }

  deleteAnnouncement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/announcements/${id}`);
  }
}
