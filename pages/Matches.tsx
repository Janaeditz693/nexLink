
import React, { useState } from 'react';
import { useApp } from '../AppContext';
// Resolve missing named exports by destructuring from the full module
import * as ReactRouterDOM from 'react-router-dom';

const { useNavigate } = ReactRouterDOM as any;

const Matches: React.FC = () => {
  const navigate = useNavigate();
  const { matches, setMatches, addNotification } = useApp();
  const [activeNiche, setActiveNiche] = useState('All');

  const niches = ['All', 'Lifestyle', 'Tech', 'Gaming', 'Fitness'];

  const handleAction = (id: string, action: 'accept' | 'reject') => {
    const match = matches.find(m => m.id === id);
    if (action === 'accept' && match) {
      // Fix: Convert Date.now() to string and use correct property names timeAgo and content
      addNotification({
        id: Date.now().toString(),
        type: 'interest_sent',
        user: match.user,
        timeAgo: 'Just now',
        read: false,
        content: `Interest sent to ${match.user.name}`
      });
    }
    setMatches(prev => prev.filter(m => m.id !== id));
  };

  const filteredMatches = activeNiche === 'All' 
    ? matches 
    : matches.filter(m => m.interests.some(i => i.toLowerCase().includes(activeNiche.toLowerCase())));

  return (
    <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
      <header className="flex flex-col pt-4 px-4 pb-2 sticky top-0 z-10 bg-background-light dark:bg-background-dark">
        <div className="flex items-center justify-between h-14">
          <div className="flex size-10 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <span className="material-symbols-outlined">search</span>
          </div>
          <h1 className="text-lg font-bold flex-1 text-center">Discover Matches</h1>
          <div className="flex size-10 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <span className="material-symbols-outlined">tune</span>
          </div>
        </div>
        <div className="mt-2 flex gap-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {niches.map((niche) => (
            <button 
              key={niche} 
              onClick={() => setActiveNiche(niche)}
              className={`pb-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${activeNiche === niche ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {niche}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 no-scrollbar">
        {filteredMatches.length > 0 ? filteredMatches.map((match) => (
          <div key={match.id} className="flex flex-col bg-white dark:bg-[#192233] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div 
              className="relative w-full aspect-[4/5] bg-cover bg-center cursor-pointer group" 
              style={{ backgroundImage: `url(${match.user.avatar})` }}
              onClick={() => navigate(`/profile/${match.user.id}`)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 shadow-lg">
                <span className="text-white text-xs font-bold">{match.matchScore}% Match</span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Pro Verified</span>
                </div>
                <h2 className="text-2xl font-extrabold flex items-center gap-1.5">
                  {match.user.name}
                  {match.user.isVerified && <span className="material-symbols-outlined text-sm text-primary fill-1">verified</span>}
                </h2>
                <p className="text-slate-300 text-sm font-medium mt-1">@{match.user.name.toLowerCase().replace(' ', '_')} • {match.reach}</p>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4 py-3 px-1 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{match.user.followers || '0'}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Followers</span>
                </div>
                <div className="w-[1px] h-6 bg-slate-100 dark:bg-slate-800"></div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{match.engagement}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Engagement</span>
                </div>
                <div className="w-[1px] h-6 bg-slate-100 dark:bg-slate-800"></div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{match.user.posts || '0'}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Posts</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {match.user.bio || `Professional expertise in ${match.interests[0].toLowerCase()} and creative strategy. Open to high-impact collaborations.`}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {match.interests.map(interest => (
                  <div key={interest} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    #{interest.toLowerCase().replace(' ', '-')}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => handleAction(match.id, 'reject')}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl h-12 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white text-sm font-bold transition-all active:scale-95 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span> Reject
                </button>
                <button 
                  onClick={() => handleAction(match.id, 'accept')}
                  className="flex-[1.5] flex items-center justify-center gap-2 rounded-xl h-12 bg-primary text-white text-sm font-bold transition-all active:scale-95 shadow-lg shadow-primary/20 hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined text-[20px]">handshake</span> Send Interest
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
            <div className="size-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 shadow-xl">
              <span className="material-symbols-outlined text-primary text-4xl">celebration</span>
            </div>
            <p className="text-lg font-bold">No {activeNiche} matches yet!</p>
            <p className="text-slate-500 text-sm mt-2 px-8">Try exploring another category or check back later for new professional connections.</p>
            <button onClick={() => setActiveNiche('All')} className="mt-8 text-primary font-bold flex items-center gap-2 hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-lg">public</span> Show all niches
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Matches;
