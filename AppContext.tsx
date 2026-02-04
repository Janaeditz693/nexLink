
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Post, Match, Notification, PostComment } from './types';
import { MOCK_POSTS, MOCK_MATCHES, MOCK_USER, MOCK_USERS } from './constants';

interface AppContextType {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  currentUser: User;
  notifications: Notification[];
  followedUsers: Set<string>;
  addNotification: (notification: Notification) => void;
  likePost: (postId: string) => void;
  followUser: (userId: string) => void;
  addPost: (content: string, image: string, tags: string[]) => void;
  addComment: (postId: string, text: string) => void;
  markAllNotificationsRead: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USER);
  const [notifications, setNotifications] = useState<Notification[]>([
    { 
      id: 'n1', 
      type: 'match', 
      user: MOCK_USERS.elena, 
      timeAgo: '2M AGO', 
      read: false,
      isNew: true 
    },
    { 
      id: 'n2', 
      type: 'like', 
      user: { ...MOCK_USERS.marcus, name: 'User 1' }, 
      timeAgo: '1H AGO', 
      read: true,
      postId: '1',
      content: 'liked your post about minimalist design.'
    },
    { 
      id: 'n3', 
      type: 'like', 
      user: { ...MOCK_USERS.sophia, name: 'User 2', isVerified: true }, 
      timeAgo: '2H AGO', 
      read: true,
      postId: '1',
      content: 'liked your post about minimalist design.'
    },
    { 
      id: 'n4', 
      type: 'like', 
      user: { ...MOCK_USERS.sarah, name: 'User 3' }, 
      timeAgo: '3H AGO', 
      read: true,
      postId: '1',
      content: 'liked your post about minimalist design.'
    }
  ]);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  const addNotification = (notif: Notification) => {
    setNotifications(prev => [notif, ...prev]);
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true, isNew: false })));
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    setCurrentUser(prev => ({ ...prev, ...updates }));
    setPosts(prev => prev.map(post => {
      if (post.author.id === 'me') {
        return { ...post, author: { ...post.author, ...updates } };
      }
      return post;
    }));
  };

  const likePost = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const currentLikesStr = post.likes.replace('k', '');
        const currentLikes = parseFloat(currentLikesStr) || 0;
        const isAlreadyLiked = (post as any).isLiked;
        return {
          ...post,
          likes: isAlreadyLiked 
            ? (currentLikes > 0.1 ? `${(currentLikes - 0.1).toFixed(1)}k` : '0')
            : `${(currentLikes + 0.1).toFixed(1)}k`,
          isLiked: !isAlreadyLiked
        };
      }
      return post;
    }));
  };

  const followUser = (userId: string) => {
    let isFollowingResult = false;
    setFollowedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
        isFollowingResult = false;
      } else {
        next.add(userId);
        isFollowingResult = true;
      }
      return next;
    });
    
    setPosts(prev => prev.map(post => {
      if (post.author.id === userId) {
        return { 
          ...post, 
          author: { ...post.author, isFollowed: isFollowingResult } 
        };
      }
      return post;
    }));
  };

  const addComment = (postId: string, text: string) => {
    const newComment: PostComment = {
      id: Date.now().toString(),
      user: currentUser,
      text,
      timeAgo: 'Just now'
    };

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments + 1,
          commentsList: [newComment, ...(post.commentsList || [])]
        };
      }
      return post;
    }));
  };

  const addPost = (content: string, image: string, tags: string[]) => {
    const newPost: Post = {
      id: Date.now().toString(),
      author: currentUser,
      image,
      content,
      tags,
      likes: '0',
      comments: 0,
      shares: 0,
      timeAgo: 'Just now',
      commentsList: []
    };
    setPosts(prev => [newPost, ...prev]);
  };

  return (
    <AppContext.Provider value={{ 
      posts, setPosts, matches, setMatches, currentUser, 
      notifications, followedUsers, addNotification, likePost, followUser, addPost, addComment,
      markAllNotificationsRead, updateCurrentUser
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
