import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BlogPost, Comment } from './forum.model';

const FORUM_API = 'http://localhost:8091/forum';

@Injectable({
  providedIn: 'root'
})
export class ForumService {

  constructor(private http: HttpClient) {}

  getPosts(): Observable<BlogPost[]> {
    return this.http.get<BlogPost[]>(`${FORUM_API}/posts`);
  }

  getPost(id: number): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${FORUM_API}/posts/${id}`);
  }

  createPost(authorId: number, title: string, content: string): Observable<BlogPost> {
    return this.http.post<BlogPost>(`${FORUM_API}/posts`, { authorId, title, content });
  }

  updatePost(id: number, authorId: number, title: string, content: string): Observable<BlogPost> {
    return this.http.put<BlogPost>(`${FORUM_API}/posts/${id}`, { authorId, title, content });
  }

  deletePost(id: number, authorId: number): Observable<void> {
    return this.http.delete<void>(`${FORUM_API}/posts/${id}?authorId=${authorId}`);
  }

  getComments(blogId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${FORUM_API}/posts/${blogId}/comments`);
  }

  addComment(blogId: number, userId: number, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${FORUM_API}/posts/${blogId}/comments`, { userId, content });
  }

  deleteComment(commentId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${FORUM_API}/comments/${commentId}?userId=${userId}`);
  }
}
