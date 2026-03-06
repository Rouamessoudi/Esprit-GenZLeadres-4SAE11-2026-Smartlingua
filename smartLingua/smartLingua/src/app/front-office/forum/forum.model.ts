export interface BlogPost {
  id: number;
  authorId: number;
  title: string;
  content: string;
  createdAt: string;
  moderated: boolean;
}

export interface Comment {
  id: number;
  blogId: number;
  userId: number;
  content: string;
  createdAt: string;
  moderated: boolean;
}
