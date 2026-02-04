
import React, { useState, useMemo, useEffect } from 'react';
// Resolve missing named exports by destructuring from the full module
import * as ReactRouterDOM from 'react-router-dom';
import { useApp } from '../AppContext';
import { MOCK_USERS } from '../constants';

const { useNavigate } = ReactRouterDOM as any;

interface ImageItem {
  type: 'image';
  url: string;
  label: string;
  category: string;
  likes: number;
  authorId?: string;
  isPost?: boolean;
  id?: string;
  content?: string;
  tags?: string[];
}

interface ProfileItem {
  type: 'profile';
  id: string;
  name: string;
  role: string;
  avatar: string;
  isVerified: boolean;
  category: string;
  likes: number;
}

interface TagItem {
  type: 'tag';
  tag: string;
  postsCount: string;
  color: string;
  category: string;
  likes: number;
}

type ExploreItem = ImageItem | ProfileItem | TagItem;

const Explore: React.FC = () => {
  const navigate = useNavigate();
  const { posts, followedUsers, followUser, currentUser, matches, likePost } = useApp();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const exploreItems = useMemo<ExploreItem[]>(() => {
    const curated: ExploreItem[] = [
      { type: 'image', id: 'curated-1', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800', label: 'Workspace Design', category: 'Creative', likes: 5.2, content: "Optimizing for deep work.", tags: ['workspace', 'minimalism'] },
      { type: 'profile', id: '2', name: 'Sophia Chen', role: 'CTO @ Nova AI', avatar: MOCK_USERS.sophia.avatar, isVerified: true, category: 'Networking', likes: 8.1 },
      { type: 'tag', tag: '#FutureOfWork', postsCount: '2.4k active posts', color: 'bg-primary', category: 'Trending', likes: 10.5 },
      { type: 'image', id: 'curated-2', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800', label: 'Cybersecurity', category: 'Tech', likes: 3.4, content: "Securing the perimeter.", tags: ['tech', 'security'] },
    ];

    const dynamicPosts: ExploreItem[] = posts.map(post => ({
      type: 'image',
      url: post.image,
      label: post.author.name,
      authorId: post.author.id,
      category: post.tags[0] || 'Tech',
      likes: parseFloat(post.likes.replace('k', '')) || 0,
      isPost: true,
      id: post.id,
      content: post.content,
      tags: post.tags
    }));

    return [...curated, ...dynamicPosts];
  }, [posts]);

  const filteredItems = useMemo(() => {
    let items = exploreItems;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => {
        const labelMatch = 'label' in item && item.label?.toLowerCase().includes(query);
        const nameMatch = 'name' in item && item.name?.toLowerCase().includes(query);
        const tagMatch = 'tag' in item && item.tag?.toLowerCase().includes(query);
        return labelMatch || nameMatch || tagMatch;
      });
    }
    if (activeTab === 'Trending') {
      return [...items].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (activeTab === 'For You') {
      return items.filter(item => item.category === 'Creative' || item.category === 'Tech');
    } else if (activeTab !== 'All') {
      return items.filter(item => item.category === activeTab);
    }
    return items;
  }, [exploreItems, activeTab, searchQuery]);

  const feedItems = useMemo(() => filteredItems.filter(item => item.type === 'image') as ImageItem[], [filteredItems]);

  const openFeed = (itemId: string) => {
    setSelectedItemId(itemId);
    setViewMode('feed');
    setTimeout(() => {
      const element = document.getElementById(`explore-post-${itemId}`);
      if (element) element.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 50);
  };

  if (viewMode === 'feed') {
    return (
      <div className="flex-1 pb-24 bg-background-light dark:bg-background-dark overflow-y-auto no-scrollbar animate-in slide-in-from-right-4 duration-300">
        <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
          <button onClick={() => setViewMode('grid')} className="size-10 flex items-center justify-center rounded-full active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h2 className="text-lg font-bold">Explore Content</h2>
        </header>
        <main className="p-4 space-y-6">
          {feedItems.map((item) => (
            <article 
              key={item.id} 
              id={`explore-post-${item.id}`}
              className="bg-white dark:bg-card-dark rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800/50 transition-all scroll-mt-20"
            >
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => item.authorId && navigate(`/profile/${item.authorId}`)}>
                  <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-black uppercase">
                    {item.label.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold leading-none">{item.label}</h3>
                    <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">{item.category}</p>
                  </div>
                </div>
                {item.authorId && item.authorId !== currentUser.id && (
                  <button onClick={() => followUser(item.authorId!)} className="text-primary text-xs font-bold">
                    {followedUsers.has(item.authorId!) ? 'Following' : 'Connect'}
                  </button>
                )}
              </div>
              
              <div className="aspect-[4/5] w-full bg-slate-200 dark:bg-slate-800">
                <img src={item.url} className="w-full h-full object-cover" alt={item.label} />
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-6">
                  <button onClick={() => item.id && likePost(item.id)} className="flex items-center gap-1.5 group active:scale-125 transition-transform">
                    <span className="material-symbols-outlined text-[24px] text-slate-600 dark:text-slate-300 group-hover:text-red-500">favorite</span>
                    <span className="text-xs font-bold">{item.likes}k</span>
                  </button>
                  <button className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[24px] text-slate-600 dark:text-slate-300">chat_bubble</span>
                  </button>
                  <button className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[24px] text-slate-600 dark:text-slate-300">send</span>
                  </button>
                </div>
                <p className="text-xs leading-relaxed">
                  <span className="font-bold mr-2">{item.label}</span>
                  {item.content}
                </p>
                {item.tags && (
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-bold text-primary uppercase tracking-wider">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-24 overflow-y-auto no-scrollbar animate-in fade-in duration-300">
      <header className="sticky top-0 z-40 bg-background-light dark:bg-background-dark pt-4 pb-2 px-4 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-card-dark border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary placeholder:text-slate-500" 
              placeholder="Search roles, skills, or people..." 
            />
          </div>
          <button className="size-11 flex items-center justify-center bg-slate-100 dark:bg-card-dark rounded-xl active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">tune</span>
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['All', 'For You', 'Trending', 'Tech', 'Creative'].map((chip) => (
            <button 
              key={chip} 
              onClick={() => setActiveTab(chip)}
              className={`${activeTab === chip ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-slate-100 dark:bg-card-dark text-slate-600 dark:text-slate-300'} px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95`}
            >
              {chip}
            </button>
          ))}
        </div>
      </header>

      {/* Integrated High Impact Matches */}
      {!searchQuery && (activeTab === 'All' || activeTab === 'For You') && (
        <section className="mt-6 mb-2 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center justify-between px-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl fill-1">handshake</span>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Smart Matches</h2>
            </div>
            <span className="bg-primary/10 text-primary text-[9px] px-2 py-0.5 rounded font-black tracking-widest uppercase">AI Curated</span>
          </div>
          <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar">
            {matches.map((match) => (
              <div 
                key={match.id} 
                className="shrink-0 w-64 bg-white dark:bg-card-dark rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 flex flex-col shadow-sm group hover:border-primary/30 transition-all hover:shadow-xl"
              >
                <div 
                  className="h-40 bg-cover bg-center relative cursor-pointer" 
                  style={{ backgroundImage: `url(${match.user.avatar})` }}
                  onClick={() => navigate(`/profile/${match.user.id}`)}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <p className="text-white text-xs font-bold truncate flex items-center gap-1">
                      {match.user.name}
                      {match.user.isVerified && <span className="material-symbols-outlined text-[12px] fill-1 text-primary">verified</span>}
                    </p>
                    <p className="text-white/70 text-[10px] truncate">{match.user.role}</p>
                  </div>
                  <div className="absolute top-2 right-2 bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20">
                    <span className="text-white text-[10px] font-black">{match.matchScore}% Match</span>
                  </div>
                </div>
                <div className="p-3">
                   <div className="flex gap-1 mb-3">
                      {match.interests.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[8px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">#{tag}</span>
                      ))}
                   </div>
                   <button 
                    onClick={() => followUser(match.user.id)}
                    className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                      followedUsers.has(match.user.id) 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' 
                        : 'bg-primary text-white shadow-lg shadow-primary/10'
                    }`}
                  >
                    {followedUsers.has(match.user.id) ? 'Requested' : 'Connect'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <main className="px-4 py-4 grid grid-cols-2 gap-3">
        {filteredItems.map((item, idx) => (
          <div key={`${item.type}-${idx}`} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {item.type === 'image' && (
              <div 
                className="relative group overflow-hidden rounded-xl bg-slate-100 dark:bg-card-dark cursor-pointer shadow-sm active:scale-[0.98] transition-transform aspect-[4/5]"
                onClick={() => item.id && openFeed(item.id)}
              >
                <img className="w-full h-full object-cover rounded-xl transition-transform duration-700 group-hover:scale-110" src={item.url} alt={item.label} />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-[10px] font-bold text-white truncate">{item.label}</p>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 text-white">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] fill-1">favorite</span>
                    <span className="text-[10px] font-bold">{item.likes}k</span>
                  </div>
                </div>
              </div>
            )}
            {item.type === 'profile' && (
               <div 
                 className="bg-white dark:bg-card-dark rounded-xl p-3 border border-slate-100 dark:border-white/5 flex flex-col items-center text-center cursor-pointer active:scale-95 transition-all aspect-[4/5]"
                 onClick={() => navigate(`/profile/${item.id}`)}
               >
                  <div className="size-16 rounded-full bg-cover bg-center mb-2 border-2 border-primary/20" style={{ backgroundImage: `url(${item.avatar})` }} />
                  <h3 className="text-xs font-bold leading-tight truncate w-full">{item.name}</h3>
                  <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-wider truncate w-full">{item.role}</p>
                  <button className="mt-auto w-full py-1.5 bg-primary/10 text-primary text-[9px] font-black uppercase rounded-lg">View Profile</button>
               </div>
            )}
            {item.type === 'tag' && (
              <div 
                className={`p-4 rounded-xl ${(item as TagItem).color} flex flex-col justify-end aspect-[4/5] cursor-pointer group shadow-lg shadow-primary/10`}
                onClick={() => { 
                  setSearchQuery((item as TagItem).tag); 
                }}
              >
                <span className="material-symbols-outlined text-white/50 mb-1">trending_up</span>
                <p className="text-white text-sm font-bold leading-tight truncate">{(item as TagItem).tag}</p>
                <p className="text-white/70 text-[8px] font-black mt-1 uppercase tracking-widest">{(item as TagItem).postsCount}</p>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
};

export default Explore;
