
import React from 'react';
// Resolve missing named exports by destructuring from the full module
import * as ReactRouterDOM from 'react-router-dom';

const { useNavigate, useLocation } = ReactRouterDOM as any;

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: 'home', label: 'Home', path: '/' },
    { icon: 'explore', label: 'Explore', path: '/explore' },
    { icon: 'add', label: '', path: '/create', special: true },
    { icon: 'notifications', label: 'Activity', path: '/notifications' },
    { icon: 'person', label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-background-light/95 dark:bg-background-dark/95 ios-blur border-t border-slate-200 dark:border-slate-800 px-8 pb-6 pt-2 z-50 flex items-center justify-between">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`flex flex-col items-center gap-1 transition-all ${
            item.special 
              ? '' 
              : location.pathname === item.path 
                ? 'text-primary scale-110' 
                : 'text-slate-400 dark:text-slate-500 hover:text-primary'
          }`}
        >
          {item.special ? (
            <div className="relative -top-4 size-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-background-light dark:border-background-dark active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-3xl">add</span>
            </div>
          ) : (
            <>
              <span className={`material-symbols-outlined text-[28px] ${location.pathname === item.path ? 'fill-1' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-bold">{item.label}</span>
            </>
          )}
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
