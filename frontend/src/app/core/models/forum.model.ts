export type PostStatus = 'ACTIVE' | 'FLAGGED' | 'REMOVED';

export interface ForumPost {
  id?: number;
  title: string;
  content: string;
  authorId: number;
  category?: string;
  isModerated?: boolean;
  status?: PostStatus;
  likesCount?: number;
  userLiked?: boolean;
  trending?: boolean;
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

/** Types alignes sur l'enum Java NotificationType (API forum). */
export type NotificationType = 'ANNOUNCEMENT' | 'COMMENT' | 'REPLY' | 'SYSTEM' | 'WARNING';
export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

/** Modele d'une notification retournee par GET /forum/notifications. */
export interface Notification {
  id?: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt?: string;
  updatedAt?: string;
  sourceType?: string;
  sourceId?: number;
  priority?: NotificationPriority;
  triggerType?: string;
  actionUrl?: string;
}
