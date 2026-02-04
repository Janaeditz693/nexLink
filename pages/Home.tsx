
import React from 'react';
// Resolve missing named exports by destructuring from the full module
import * as ReactRouterDOM from 'react-router-dom';
import { useApp } from '../AppContext';
import { MOCK_USERS } from '../constants';

const { useNavigate } = ReactRouterDOM as any;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { posts, currentUser, likePost, followUser } = useApp();

  const stories = [
    { id: 'me', user: currentUser, label: 'Your Story' },
    { id: '2', user: MOCK_USERS.sophia, label: 'Sophia' },
    { id: '3', user: MOCK_USERS.marcus, label: 'Marcus' },
    { id: '4', user: MOCK_USERS.elena, label: 'Elena' },
  ];

  return (
    <div className="flex-1 pb-24 overflow-y-auto no-scrollbar">
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

      {/* Stories - Clickable */}
      <div className="flex overflow-x-auto no-scrollbar gap-5 px-4 py-4 bg-white/50 dark:bg-card-dark/30 border-b border-slate-100 dark:border-slate-800/50">
        {stories.map((story) => (
          <div 
            key={story.id} 
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
            onClick={() => navigate(story.id === 'me' ? '/profile' : `/profile/${story.id}`)}
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
            <span className="text-[11px] font-bold text-slate-500 truncate w-16 text-center">{story.label}</span>
          </div>
        ))}
      </div>

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
                  <button onClick={() => navigate(`/chat/${post.author.id}`)} className="flex items-center gap-1.5 group cursor-pointer">
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
