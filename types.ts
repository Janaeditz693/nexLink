
export interface User {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  isVerified: boolean;
  bio?: string;
  location?: string;
  followers?: string;
  following?: string;
  posts?: number;
}

export interface PostComment {
  id: string;
  user: User;
  text: string;
  timeAgo: string;
}

export interface Post {
  id: string;
  author: User;
  image: string;
  content: string;
  tags: string[];
  likes: string;
  comments: number;
  commentsList?: PostComment[];
  shares: number;
  timeAgo: string;
}

export interface Match {
  id: string;
  user: User;
  matchScore: number;
  reach: string;
  engagement: string;
  interests: string[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Notification {
  id: string;
  type: 'match' | 'like' | 'follow' | 'comment' | 'interest_sent';
  user: User;
  timeAgo: string;
  read: boolean;
  isNew?: boolean;
  postId?: string;
  content?: string;
}
