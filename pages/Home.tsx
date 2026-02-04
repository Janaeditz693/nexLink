
import React, { useState, useEffect, useRef } from 'react';
// Resolve missing named exports by destructuring from the full module
import * as ReactRouterDOM from 'react-router-dom';
import { useApp } from '../AppContext';
import { MOCK_USERS } from '../constants';
import { Post } from '../types';

const { useNavigate } = ReactRouterDOM as any;

interface Story {
  id: string;
  user: any;
  media: string;
  time: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { posts, currentUser, likePost, followUser, addComment } = useApp();
  
  // Story States
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const storyTimerRef = useRef<number | null>(null);

  // Comment States
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  const stories: Story[] = [
    { id: 'me', user: currentUser, media: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', time: '2h' },
    { id: '2', user: MOCK_USERS.sophia, media: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800', time: '5h' },
    { id: '3', user: MOCK_USERS.marcus, media: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800', time: '8h' },
    { id: '4', user: MOCK_USERS.elena, media: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800', time: '12h' },
  ];

  // Story Logic
  useEffect(() => {
    if (activeStoryIndex !== null) {
      setStoryProgress(0);
      const startTime = Date.now();
      const duration = 5000; 

      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = (elapsed / duration) * 100;
        
        if (progress >= 100) {
          handleNextStory();
        } else {
          setStoryProgress(progress);
          storyTimerRef.current = requestAnimationFrame(updateProgress);
        }
      };

      storyTimerRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (storyTimerRef.current) cancelAnimationFrame(storyTimerRef.current);
    }

    return () => {
      if (storyTimerRef.current) cancelAnimationFrame(storyTimerRef.current);
    };
  }, [activeStoryIndex]);

  const handleNextStory = () => {
    if (activeStoryIndex === null) return;
    if (activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex === null) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const handleStoryTap = (e: React.MouseEvent) => {
    const x = e.clientX;
    const width = window.innerWidth;
    if (x < width * 0.3) {
      handlePrevStory();
    } else {
      handleNextStory();
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentPostId || !commentInput.trim()) return;
    addComment(activeCommentPostId, commentInput);
    setCommentInput('');
  };

  const activePost = posts.find(p => p.id === activeCommentPostId);

  return (
    <div className="flex-1 pb-24 overflow-y-auto no-scrollbar relative">
      <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 ios-blur border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white text-xl">hub</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">NexLink</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/notifications')} className="p-1 relative">
            <span className="material-symbols-outlined text-2xl">notifications</span>
            <div className="absolute top-1 right-1 size-2 bg-red-500 rounded-full border-2 border-background-light dark:border-background-dark"></div>
          </button>
          <button onClick={() => navigate('/chat/global')} className="p-1">
            <span className="material-symbols-outlined text-2xl text-primary">chat_bubble</span>
          </button>
        </div>
      </header>

      {/* Stories List */}
      <div className="flex overflow-x-auto no-scrollbar gap-5 px-4 py-4 bg-white/50 dark:bg-card-dark/30 border-b border-slate-100 dark:border-slate-800/50">
        {stories.map((story, index) => (
          <div 
            key={story.id} 
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
            onClick={() => setActiveStoryIndex(index)}
          >
            <div className="relative">
              <div className={`size-16 rounded-full p-0.5 bg-gradient-to-tr ${story.id === 'me' ? 'from-slate-400 to-slate-500' : 'from-primary to-secondary'} group-hover:scale-105 transition-transform`}>
                <div className="w-full h-full rounded-full bg-cover bg-center border-2 border-background-dark" style={{ backgroundImage: `url(${story.user.avatar})` }} />
              </div>
              {story.id === 'me' && (
                <div className="absolute bottom-0 right-0 size-5 bg-primary text-white rounded-full flex items-center justify-center border-2 border-background-dark">
                  <span className="material-symbols-outlined text-[14px]">add</span>
                </div>
              )}
            </div>
            <span className="text-[11px] font-bold text-slate-500 truncate w-16 text-center">
              {story.id === 'me' ? 'Your Story' : story.user.name.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Story Viewer Overlay */}
      {activeStoryIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
          <div className="absolute top-4 left-4 right-4 z-[110] flex gap-1.5">
            {stories.map((_, i) => (
              <div key={i} className="h-[2px] flex-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-none"
                  style={{ 
                    width: i < activeStoryIndex ? '100%' : i === activeStoryIndex ? `${storyProgress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          <div className="absolute top-8 left-4 right-4 z-[110] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full border border-white/20 bg-cover bg-center" style={{ backgroundImage: `url(${stories[activeStoryIndex].user.avatar})` }} />
              <div>
                <p className="text-white text-xs font-black tracking-tight">{stories[activeStoryIndex].user.name}</p>
                <p className="text-white/60 text-[10px] font-bold">{stories[activeStoryIndex].time}</p>
              </div>
            </div>
            <button onClick={() => setActiveStoryIndex(null)} className="p-2 text-white/80 active:scale-75 transition-transform">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative cursor-pointer" onClick={handleStoryTap}>
            <div 
              className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-125"
              style={{ backgroundImage: `url(${stories[activeStoryIndex].media})` }}
            />
            <img 
              src={stories[activeStoryIndex].media} 
              className="relative z-10 w-full max-h-[85vh] object-contain shadow-2xl rounded-lg" 
              alt="story content" 
            />
          </div>

          <div className="p-6 pb-12 flex items-center gap-4 bg-gradient-to-t from-black/80 to-transparent z-[110]">
            <div className="flex-1 relative">
              <input 
                placeholder="Send message..." 
                className="w-full bg-white/10 border border-white/20 rounded-full py-3 px-6 text-sm text-white placeholder:text-white/40 focus:ring-1 focus:ring-white/30"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <button className="text-white active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-2xl">favorite</span>
            </button>
            <button className="text-white active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-2xl">send</span>
            </button>
          </div>
        </div>
      )}

      {/* Comment Section Bottom Sheet */}
      {activeCommentPostId && (
        <div className="fixed inset-0 z-[100] bg-black/60 animate-in fade-in duration-300">
          <div 
            className="absolute inset-x-0 bottom-0 top-20 bg-background-light dark:bg-[#0f1117] rounded-t-[32px] flex flex-col animate-in slide-in-from-bottom duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center pt-2 pb-4 shrink-0">
              <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mb-4" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Comments</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-6">
              {activePost?.commentsList && activePost.commentsList.length > 0 ? (
                activePost.commentsList.map((comm) => (
                  <div key={comm.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="size-9 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${comm.user.avatar})` }} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold flex items-center gap-1 text-slate-900 dark:text-white">
                          {comm.user.name}
                          {comm.user.isVerified && <span className="material-symbols-outlined text-[12px] text-primary fill-1">verified</span>}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{comm.timeAgo}</span>
                      </div>
                      <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">{comm.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-800 mb-4">chat_bubble</span>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No comments yet</p>
                  <p className="text-xs text-slate-500 mt-1">Start the professional conversation</p>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 inset-x-0 p-4 pb-8 bg-background-light/95 dark:bg-[#0f1117]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="size-9 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700" style={{ backgroundImage: `url(${currentUser.avatar})` }} />
              <form onSubmit={handleSendComment} className="flex-1 flex items-center gap-2">
                <input 
                  autoFocus
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-slate-100 dark:bg-card-dark border-none rounded-xl py-2.5 px-4 text-sm focus:ring-1 focus:ring-primary placeholder:text-slate-400"
                />
                <button 
                  type="submit"
                  disabled={!commentInput.trim()}
                  className={`text-primary font-black text-xs uppercase tracking-widest px-2 transition-opacity ${!commentInput.trim() ? 'opacity-30' : 'opacity-100'}`}
                >
                  Post
                </button>
              </form>
            </div>
            
            <button 
              onClick={() => setActiveCommentPostId(null)}
              className="absolute top-4 right-6 text-slate-400 active:scale-75 transition-transform"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      <main className="p-4 space-y-6 pt-4">
        {posts.map((post) => (
          <article key={post.id} className="bg-white dark:bg-card-dark rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800/50 transition-all active:scale-[0.99]">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(post.author.id === 'me' ? '/profile' : `/profile/${post.author.id}`)}>
                <div className="size-10 rounded-full bg-cover bg-center ring-1 ring-slate-100 dark:ring-slate-800" style={{ backgroundImage: `url(${post.author.avatar})` }} />
                <div>
                  <h3 className="text-sm font-bold leading-none flex items-center gap-1">
                    {post.author.name}
                    {post.author.isVerified && <span className="material-symbols-outlined text-[14px] text-primary fill-1">verified</span>}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 mt-1">{post.author.role} @ {post.author.company || 'Innovate'}</p>
                </div>
              </div>
              {post.author.id !== currentUser.id && (
                <button 
                  onClick={() => followUser(post.author.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${(post.author as any).isFollowed ? 'bg-slate-200 dark:bg-slate-800 text-slate-600' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}
                >
                  {(post.author as any).isFollowed ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
            
            <div className="aspect-[4/5] w-full bg-slate-200 dark:bg-slate-800 bg-cover bg-center" style={{ backgroundImage: `url(${post.image})` }} />
            
            <div className="p-4 space-y-4">
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <span className="font-bold mr-2">{post.author.name}</span>
                {post.content}
              </p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 rounded-lg uppercase tracking-wider cursor-pointer hover:bg-primary hover:text-white transition-colors">#{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-6">
                  <button onClick={() => likePost(post.id)} className="flex items-center gap-1.5 group cursor-pointer transition-transform active:scale-125">
                    <span className={`material-symbols-outlined text-[24px] transition-colors ${(post as any).isLiked ? 'text-red-500 fill-1' : 'text-slate-400 group-hover:text-red-500'}`}>favorite</span>
                    <span className={`text-xs font-bold ${(post as any).isLiked ? 'text-red-500' : 'text-slate-500'}`}>{post.likes}</span>
                  </button>
                  <button onClick={() => setActiveCommentPostId(post.id)} className="flex items-center gap-1.5 group cursor-pointer">
                    <span className="material-symbols-outlined text-[24px] text-slate-400 group-hover:text-primary transition-colors">chat_bubble</span>
                    <span className="text-xs font-bold text-slate-500">{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-1.5 group cursor-pointer">
                    <span className="material-symbols-outlined text-[24px] text-slate-400 group-hover:text-primary transition-colors">send</span>
                    <span className="text-xs font-bold text-slate-500">{post.shares}</span>
                  </button>
                </div>
                <button className="flex items-center text-slate-400 hover:text-primary transition-colors active:scale-125">
                  <span className="material-symbols-outlined text-[24px]">bookmark</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
};

export default Home;
