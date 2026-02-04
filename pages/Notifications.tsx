
import React from 'react';
// Resolve missing named exports by destructuring from the full module
import * as ReactRouterDOM from 'react-router-dom';
import { useApp } from '../AppContext';

const { useNavigate } = ReactRouterDOM as any;

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  // Fix: Destructure currentUser from useApp hook to fix "Cannot find name 'currentUser'" error on line 81
  const { notifications, markAllNotificationsRead, posts, currentUser } = useApp();

  const newNotifications = notifications.filter(n => n.isNew);
  const earlierNotifications = notifications.filter(n => !n.isNew);

  const getPostThumbnail = (postId?: string) => {
    if (!postId) return 'https://picsum.photos/100/100?random=default';
    const post = posts.find(p => p.id === postId);
    return post ? post.image : 'https://picsum.photos/100/100?random=notfound';
  };

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark min-h-screen pb-24">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-1 active:scale-75 transition-transform text-slate-600 dark:text-slate-300">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-base font-black flex-1 text-center tracking-tight">Activity</h2>
        <button onClick={markAllNotificationsRead} className="text-primary text-xs font-black uppercase tracking-wider">Mark all</button>
      </header>

      <div className="p-4 space-y-8">
        {newNotifications.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 px-1">NEW</h3>
            <div className="space-y-4">
              {newNotifications.map((notif) => (
                <div 
                  key={notif.id}
                  className="flex items-start gap-4 p-5 bg-white dark:bg-[#161b26] border-l-[3px] border-primary rounded-r-2xl transition-all hover:bg-slate-50 dark:hover:bg-[#1a212e] cursor-pointer shadow-sm group"
                  onClick={() => notif.type === 'match' && navigate(`/profile/${notif.user.id}`)}
                >
                  <div className="relative shrink-0">
                    <div className="size-14 rounded-full bg-cover bg-center ring-2 ring-primary/20" style={{ backgroundImage: `url(${notif.user.avatar})` }} />
                    <div className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full size-5 border-2 border-white dark:border-[#161b26] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[10px] text-white fill-1">verified</span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col pt-1">
                    <p className="text-[13px] leading-snug">
                      <span className="font-bold inline-flex items-center gap-1 text-slate-900 dark:text-white">
                        {notif.user.name}
                        {notif.user.isVerified && <span className="material-symbols-outlined text-[14px] text-primary fill-1">verified</span>}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 ml-1">matches with you!</span>
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1.5 tracking-wider">{notif.timeAgo}</p>
                    {notif.type === 'match' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/chat/${notif.user.id}`); }}
                        className="bg-primary text-white text-[11px] font-black uppercase tracking-widest px-8 py-3 rounded-xl mt-5 self-start shadow-lg shadow-primary/20 active:scale-95 transition-all group-hover:scale-[1.02]"
                      >
                        Send Message
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {earlierNotifications.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 px-1">EARLIER</h3>
            <div className="space-y-6">
              {earlierNotifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className="flex items-center gap-4 py-2 px-1 hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-2xl transition-all cursor-pointer group"
                  onClick={() => notif.postId ? navigate(`/profile/${currentUser.id}`) : navigate(`/profile/${notif.user.id}`)}
                >
                  <div 
                    className="size-11 rounded-full bg-cover bg-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-800" 
                    style={{ backgroundImage: `url(${notif.user.avatar})` }}
                  />
                  <div className="flex flex-1 flex-col justify-center min-w-0">
                    <p className="text-[13px] leading-tight text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-900 dark:text-white inline-flex items-center gap-1">
                        {notif.user.name}
                        {notif.user.isVerified && <span className="material-symbols-outlined text-[14px] text-primary fill-1">verified</span>}
                      </span>
                      <span className="ml-1 line-clamp-2">{notif.content}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{notif.timeAgo}</p>
                  </div>
                  <div 
                    className="size-11 rounded-lg bg-cover bg-center shrink-0 border border-slate-200 dark:border-slate-800/50 shadow-sm transition-transform group-hover:scale-105" 
                    style={{ backgroundImage: `url(${getPostThumbnail(notif.postId)})` }} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="size-20 rounded-full bg-slate-100 dark:bg-card-dark flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-slate-300">notifications_off</span>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Activity Yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
