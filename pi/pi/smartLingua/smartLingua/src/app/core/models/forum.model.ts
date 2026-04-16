export interface ForumPost {
  id?: number;
  title: string;
  content: string;
  authorId: number;
  category?: string;
  isModerated?: boolean;
  createdAt?: string;
  updatedAt?: string;
  comments?: Comment[];
}

export interface Comment {
  id?: number;
  content: string;
  postId?: number;
  authorId: number;
  parentCommentId?: number;
  isModerated?: boolean;
  createdAt?: string;
  updatedAt?: string;
  replies?: Comment[];
}

export interface CommentRequest {
  content: string;
  postId: number;
  authorId: number;
  parentCommentId?: number;
}

export interface Announcement {
  id?: number;
  title: string;
  content: string;
  authorId: number;
  publishedAt?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
