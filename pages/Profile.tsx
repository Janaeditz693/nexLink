
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
// Resolve missing named exports by destructuring from the full module
import * as ReactRouterDOM from 'react-router-dom';
import { MOCK_USERS } from '../constants';
import { GoogleGenAI } from "@google/genai";

const { useNavigate, useParams } = ReactRouterDOM as any;

type ProfileView = 'grid' | 'posts';

const Profile: React.FC = () => {
  const { id } = useParams();
  const { currentUser, posts, followedUsers, likePost, followUser, updateCurrentUser } = useApp();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ProfileView>('grid');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSynergy, setAiSynergy] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    role: '',
    company: '',
    bio: ''
  });

  const displayUser = useMemo(() => {
    if (!id || id === 'me' || id === currentUser.id) return currentUser;
    const user = Object.values(MOCK_USERS).find(u => u.id === id);
    return user || MOCK_USERS.alex;
  }, [id, currentUser]);

  const isOwnProfile = displayUser.id === currentUser.id;
  const isFollowed = followedUsers.has(displayUser.id);
  const userPosts = useMemo(() => posts.filter(p => p.author.id === displayUser.id), [posts, displayUser]);

  useEffect(() => {
    if (isOwnProfile) {
      setEditForm({
        name: currentUser.name,
        role: currentUser.role,
        company: currentUser.company,
        bio: currentUser.bio || ''
      });
    }
  }, [isOwnProfile, currentUser]);

  const handleSaveProfile = () => {
    updateCurrentUser({
      name: editForm.name,
      role: editForm.role,
      company: editForm.company,
      bio: editForm.bio
    });
    setIsEditing(false);
  };

  const handleGridClick = (postId: string) => {
    setActiveView('posts');
    // We need a small delay for React to render the posts view before we can scroll
    setTimeout(() => {
      const element = document.getElementById(`post-${postId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const analyzeSynergy = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyze professional synergy between these two users for a networking app.
      User 1 (Me): ${currentUser.role} @ ${currentUser.company}. Bio: ${currentUser.bio}
      User 2 (Target): ${displayUser.name}, ${displayUser.role} @ ${displayUser.company}. Bio: ${displayUser.bio}
      Explain in 2 clear, inspiring sentences why they should collaborate. Max 40 words.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      if (response.text) setAiSynergy(response.text.trim());
    } catch (e) {
      console.error("AI Error:", e);
      setAiSynergy("Great overlap in design thinking and technical strategy.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark min-h-screen pb-24 overflow-y-auto no-scrollbar" ref={scrollRef}>
      <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
        <button onClick={() => isEditing ? setIsEditing(false) : activeView === 'posts' ? setActiveView('grid') : navigate(-1)} className="size-10 flex items-center justify-center rounded-full active:scale-90 transition-transform text-slate-600 dark:text-slate-300">
          <span className="material-symbols-outlined text-2xl">
            {isEditing ? 'close' : (activeView === 'posts' ? 'arrow_back' : 'arrow_back_ios_new')}
          </span>
        </button>
        <h1 className="text-sm font-black tracking-tight uppercase">
          {isEditing ? 'Edit Profile' : isOwnProfile ? 'Your Hub' : displayUser.name.split(' ')[0] + "'s Hub"}
        </h1>
        <button className="size-10 flex items-center justify-center text-slate-400">
          <span className="material-symbols-outlined">{isEditing ? 'settings' : 'more_horiz'}</span>
        </button>
      </header>

      <main className="max-w-md mx-auto">
        {activeView === 'grid' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col items-center pt-8 px-4">
              <div className="relative group">
                <div className="size-28 rounded-full p-[3px] bg-gradient-to-tr from-primary via-secondary to-primary animate-gradient-xy shadow-xl shadow-primary/20">
                  <div className="size-full rounded-full bg-cover bg-center border-[3px] border-background-light dark:border-background-dark" style={{ backgroundImage: `url(${displayUser.avatar})` }} />
                </div>
                {isOwnProfile && isEditing && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="material-symbols-outlined text-white">photo_camera</span>
                  </div>
                )}
                {displayUser.isVerified && (
                  <div className="absolute bottom-1 right-1 bg-primary size-7 rounded-full flex items-center justify-center border-[3px] border-background-light dark:border-background-dark shadow-lg">
                    <span className="material-symbols-outlined text-[14px] text-white fill-1">verified</span>
                  </div>
                )}
              </div>
              
              <div className="mt-5 text-center px-6 w-full space-y-4">
                {isEditing ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Full Name</label>
                      <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-white dark:bg-card-dark border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary shadow-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Role</label>
                        <input 
                          type="text" 
                          value={editForm.role} 
                          onChange={e => setEditForm({...editForm, role: e.target.value})}
                          className="w-full bg-white dark:bg-card-dark border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary shadow-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Company</label>
                        <input 
                          type="text" 
                          value={editForm.company} 
                          onChange={e => setEditForm({...editForm, company: e.target.value})}
                          className="w-full bg-white dark:bg-card-dark border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Professional Bio</label>
                      <textarea 
                        value={editForm.bio} 
                        onChange={e => setEditForm({...editForm, bio: e.target.value})}
                        className="w-full bg-white dark:bg-card-dark border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary shadow-sm min-h-[80px]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h2 className="text-xl font-black tracking-tight">{displayUser.name}</h2>
                    <p className="text-primary text-[11px] font-bold uppercase tracking-[0.15em]">{displayUser.role} @ {displayUser.company}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[12px] leading-relaxed font-medium mt-3">{displayUser.bio}</p>
                  </div>
                )}
              </div>
            </div>

            {!isOwnProfile && !isEditing && (
              <div className="mx-6 mt-8 p-5 rounded-[24px] bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-20 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-4xl fill-1 text-primary">auto_awesome</span>
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] fill-1">insights</span>
                  AI Match Insight
                </h4>
                {aiSynergy ? (
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed animate-in fade-in duration-700 italic">"{aiSynergy}"</p>
                ) : (
                  <button 
                    onClick={analyzeSynergy}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                  >
                    {isAnalyzing ? <span className="animate-spin text-lg">⏳</span> : <span className="material-symbols-outlined text-sm">auto_awesome</span>}
                    Analyze Synergy
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 px-6 mt-8">
              {isOwnProfile ? (
                isEditing ? (
                  <>
                    <button 
                      onClick={() => setIsEditing(false)} 
                      className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveProfile} 
                      className="flex-1 bg-primary text-white font-black py-3 rounded-xl shadow-lg shadow-primary/20 text-[10px] uppercase tracking-widest"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="flex-1 bg-primary text-white font-black py-3 rounded-xl shadow-lg shadow-primary/20 text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Edit Profile
                  </button>
                )
              ) : (
                <>
                  <button onClick={() => followUser(displayUser.id)} className={`flex-1 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all ${isFollowed ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}>{isFollowed ? 'Requested' : 'Connect'}</button>
                  <button onClick={() => navigate(`/chat/${displayUser.id}`)} className="flex-1 bg-white dark:bg-card-dark text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all">Message</button>
                </>
              )}
            </div>

            <div className="mx-6 mt-8 p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] rounded-[24px] flex items-center justify-between text-center shadow-sm">
              <div className="flex-1">
                <p className="text-lg font-black">{displayUser.posts || userPosts.length}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Creations</p>
              </div>
              <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-800 mx-2" />
              <div className="flex-1">
                <p className="text-lg font-black">{displayUser.followers}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Followers</p>
              </div>
              <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-800 mx-2" />
              <div className="flex-1">
                <p className="text-lg font-black">{displayUser.following}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Following</p>
              </div>
            </div>
          </div>
        )}

        {/* View Toggler (Grid vs Feed) - hidden when in deep feed view for focus */}
        {!isEditing && (
          <div className="mt-8 flex border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setActiveView('grid')}
              className={`flex-1 py-3 flex items-center justify-center transition-all ${activeView === 'grid' ? 'text-primary border-t-2 border-primary -mt-[2px]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span className={`material-symbols-outlined text-[24px] ${activeView === 'grid' ? 'fill-1' : ''}`}>grid_on</span>
            </button>
            <button 
              onClick={() => setActiveView('posts')}
              className={`flex-1 py-3 flex items-center justify-center transition-all ${activeView === 'posts' ? 'text-primary border-t-2 border-primary -mt-[2px]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span className={`material-symbols-outlined text-[24px] ${activeView === 'posts' ? 'fill-1' : ''}`}>splitscreen</span>
            </button>
          </div>
        )}

        {/* Posts Area */}
        {activeView === 'grid' ? (
          <div className="grid grid-cols-3 gap-[1px] md:gap-1 px-[1px] md:px-0 animate-in fade-in duration-300">
            {userPosts.map((post) => (
              <div 
                key={post.id} 
                className="aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden relative group cursor-pointer"
                onClick={() => handleGridClick(post.id)}
              >
                <img 
                  src={post.image} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  alt="post" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4 text-white">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px] fill-1">favorite</span>
                    <span className="text-xs font-bold">{post.likes.replace('k', '')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px] fill-1">chat_bubble</span>
                    <span className="text-xs font-bold">{post.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6 p-4 animate-in slide-in-from-bottom-4 duration-500">
            {userPosts.map((post) => (
              <article 
                key={post.id} 
                id={`post-${post.id}`}
                className="bg-white dark:bg-card-dark rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800/50 shadow-sm scroll-mt-20"
              >
                <div className="p-3 flex items-center gap-3">
                  <div className="size-8 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${post.author.avatar})` }} />
                  <div>
                    <h4 className="text-[13px] font-bold">{post.author.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">{post.timeAgo}</p>
                  </div>
                </div>
                <div className="aspect-[4/5] w-full bg-slate-100 dark:bg-slate-800">
                  <img src={post.image} className="w-full h-full object-cover" alt="feed post" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-5">
                    <button onClick={() => likePost(post.id)} className="flex items-center gap-1.5 active:scale-125 transition-transform">
                      <span className={`material-symbols-outlined text-[24px] ${(post as any).isLiked ? 'text-red-500 fill-1' : 'text-slate-600 dark:text-slate-300'}`}>favorite</span>
                      <span className="text-xs font-bold">{(post as any).isLiked ? 'Liked' : post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[24px] text-slate-600 dark:text-slate-300">chat_bubble</span>
                      <span className="text-xs font-bold">{post.comments}</span>
                    </button>
                    <button className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[24px] text-slate-600 dark:text-slate-300">send</span>
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed">
                    <span className="font-bold mr-2">{post.author.name}</span>
                    {post.content}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-bold text-primary uppercase tracking-wider">#{tag}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {userPosts.length === 0 && (
          <div className="py-20 flex flex-col items-center text-center px-10">
            <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-slate-400">add_a_photo</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">No Creations Yet</h3>
            <p className="text-xs text-slate-500 mt-2">When {displayUser.name.split(' ')[0]} shares professional projects, they'll appear here.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
