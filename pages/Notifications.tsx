
import React from 'react';
// Resolve missing named exports by destructuring from the full module
import * as ReactRouterDOM from 'react-router-dom';
import { useApp } from '../AppContext';

const { useNavigate } = ReactRouterDOM as any;

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, markAllNotificationsRead } = useApp();

  const newNotifications = notifications.filter(n => n.isNew);
  const earlierNotifications = notifications.filter(n => !n.isNew);

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark min-h-screen pb-24">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-1 active:scale-75 transition-transform">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center tracking-tight">Activity</h2>
        <button onClick={markAllNotificationsRead} className="text-primary text-sm font-bold">Mark all</button>
      </header>

      <div className="p-4 space-y-8">
        {newNotifications.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 px-1">NEW</h3>
            <div className="space-y-4">
              {newNotifications.map((notif) => (
                <div 
                  key={notif.id}
                  className="flex items-start gap-3 p-4 bg-slate-100/50 dark:bg-card-dark border-l-[3px] border-primary rounded-r-xl transition-all hover:bg-slate-200 dark:hover:bg-slate-800/80 cursor-pointer"
                  onClick={() => notif.type === 'match' && navigate(`/profile/${notif.user.id}`)}
                >
                  <div className="relative shrink-0">
                    <div className="size-12 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700" style={{ backgroundImage: `url(${notif.user.avatar})` }} />
                    <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5 border-2 border-background-light dark:border-background-dark flex items-center justify-center">
                      <span className="material-symbols-outlined text-[10px] text-white fill-1">verified</span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm leading-snug">
                      <span className="font-bold inline-flex items-center gap-1">
                        {notif.user.name}
                        {notif.user.isVerified && <span className="material-symbols-outlined text-[14px] text-primary fill-1">verified</span>}
                      </span> matches with you!
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wide">{notif.timeAgo}</p>
                    {notif.type === 'match' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/chat/${notif.user.id}`); }}
                        className="bg-primary text-white text-[12px] font-bold px-6 py-2.5 rounded-full mt-4 self-start shadow-lg shadow-primary/20 active:scale-95 transition-transform"
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
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 px-1">EARLIER</h3>
            <div className="space-y-6">
              {earlierNotifications.map((notif) => (
                <div key={notif.id} className="flex items-start gap-3 py-2 px-1 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 rounded-xl transition-colors cursor-pointer group">
                  <div 
                    className="size-12 rounded-full bg-cover bg-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-800" 
                    style={{ backgroundImage: `url(${notif.user.avatar})` }}
                  />
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-900 dark:text-white inline-flex items-center gap-1">
                        {notif.user.name}
                        {notif.user.isVerified && <span className="material-symbols-outlined text-[14px] text-primary fill-1">verified</span>}
                      </span> {notif.content}
                    </p>
                    <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{notif.timeAgo}</p>
                  </div>
                  <div 
                    className="size-12 rounded-lg bg-cover bg-center shrink-0 border border-slate-100 dark:border-slate-800 transition-transform group-hover:scale-105" 
                    style={{ backgroundImage: `url(https://picsum.photos/100/100?random=${notif.id})` }} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
