
import React, { useState } from 'react';

interface AuthProps {
  onAuth: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark min-h-screen">
      <div className="w-full max-w-[380px] flex flex-col gap-7 animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-2.5">
          <div className="bg-primary rounded-xl p-3 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white text-3xl block">hub</span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">NexLink</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[13px] font-medium mt-0.5 tracking-wide">Connect. Discover. Grow.</p>
          </div>
        </div>

        <div className="flex p-1.5 bg-slate-200/60 dark:bg-slate-900/80 rounded-2xl border border-slate-300/20 dark:border-slate-800/50">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-[13px] font-bold rounded-xl transition-all ${isLogin ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' : 'text-slate-500'}`}
          >
            Login
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-[13px] font-bold rounded-xl transition-all ${!isLogin ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' : 'text-slate-500'}`}
          >
            Sign Up
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onAuth(); }}>
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-slate-500 ml-1">Email or Phone</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">alternate_email</span>
              <input required className="w-full pl-11 pr-4 py-3.5 rounded-xl border-none bg-white dark:bg-slate-900/50 ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary text-sm" placeholder="Enter email or phone" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Password</label>
              <button type="button" className="text-xs text-primary font-medium">Forgot Password?</button>
            </div>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
              <input required type="password" className="w-full pl-11 pr-12 py-3.5 rounded-xl border-none bg-white dark:bg-slate-900/50 ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary text-sm" placeholder="Enter password" />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-[18px]">visibility</span>
              </button>
            </div>
          </div>
          <button type="submit" className="w-full py-4 mt-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">
            {isLogin ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800/80"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or continue with</span>
            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800/80"></div>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 font-semibold text-sm">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgjjCvQgS9y7W59aVtbGNON4CaD2G_kmxy8eLaMaJRVAwiZ7nNfj5UBsHFE6gCGbDTCz4zfkqIi1AIVmh5_d9BOc_eFp4giBHq7L3Mo6yZ38EH7jFAWSjH77ST1OvdR4mGk7g2f62pm75-178qGz_MBvvU2fKce0pgZDVQgcS_VcucuYbTGMTls-qKtStLCeK8SrkPc51HzQ6MgrbesFAFaKP0ReyLE4UCbJfvZWiM4aP9RTO4bSU2S44jGh_0r3jCsRUfFDVOgyk" className="w-4 h-4" alt="Google" />
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 font-semibold text-sm">
              <span className="material-symbols-outlined text-lg">apple</span>
              Apple
            </button>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-500 leading-relaxed max-w-[280px] mx-auto mt-4">
          By continuing, you agree to NexLink's <span className="font-bold text-primary">Terms of Service</span> and <span className="font-bold text-primary">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
};

export default Auth;
