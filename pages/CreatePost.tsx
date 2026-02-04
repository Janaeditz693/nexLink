
import React, { useState, useRef } from 'react';
// Resolve missing named exports by destructuring from the full module
import * as ReactRouterDOM from 'react-router-dom';
import { useApp } from '../AppContext';

const { useNavigate } = ReactRouterDOM as any;

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { addPost } = useApp();
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = () => {
    if (!caption.trim() || !selectedImage) return;
    setIsPosting(true);
    
    // Simulate a brief delay for a better UX feel
    setTimeout(() => {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t !== '');
      addPost(caption, selectedImage, tagArray);
      setIsPosting(false);
      navigate('/');
    }, 800);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark min-h-screen flex flex-col">
      {/* Header aligned with screenshot */}
      <header className="sticky top-0 z-50 bg-background-light dark:bg-background-dark/95 backdrop-blur-md h-16 flex items-center justify-between px-6">
        <button onClick={() => navigate(-1)} className="text-slate-500 text-sm font-bold active:opacity-60 transition-opacity">
          Cancel
        </button>
        <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight">New Post</h1>
        <button 
          onClick={handlePost}
          disabled={isPosting || !caption.trim() || !selectedImage}
          className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
            isPosting || !caption.trim() || !selectedImage 
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' 
            : 'bg-white text-[#0a0c12] shadow-lg active:scale-95'
          }`}
        >
          {isPosting ? '...' : 'Post'}
        </button>
      </header>

      <main className="p-6 space-y-8 flex-1 overflow-y-auto no-scrollbar pb-32">
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageSelect} 
          accept="image/*" 
          className="hidden" 
        />

        {/* Upload Area styled like screenshot */}
        <div 
          onClick={triggerFileInput}
          className="relative aspect-[4/5] bg-slate-100 dark:bg-[#11141d] rounded-2xl overflow-hidden group cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-800/60 hover:border-primary/50 transition-all shadow-inner"
        >
          {selectedImage ? (
            <div className="absolute inset-0 bg-cover bg-center animate-in fade-in duration-700" style={{ backgroundImage: `url(${selectedImage})` }} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center">
              <span className="material-symbols-outlined text-4xl mb-4 opacity-30">image</span>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Tap to select your work</p>
              <p className="text-[10px] mt-2 font-bold text-slate-500/60 uppercase tracking-widest">High-resolution images recommended</p>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/10 backdrop-blur-md rounded-full p-4 border border-white/20">
              <span className="material-symbols-outlined text-white text-3xl">add_photo_alternate</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Caption Field */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-600 ml-1">Caption</label>
            <div className="bg-white dark:bg-[#11141d] rounded-2xl p-1 shadow-sm border border-slate-200 dark:border-slate-800/40">
              <textarea 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-transparent border-none rounded-2xl p-4 min-h-[140px] focus:ring-0 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-700 font-medium"
                placeholder="What's the impact of this project? Share your professional insights..."
              />
            </div>
          </div>
          
          {/* Expertise Tags Field */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-600 ml-1">Expertise Tags</label>
            <div className="flex items-center bg-white dark:bg-[#11141d] rounded-2xl px-5 border border-slate-200 dark:border-slate-800/40 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined text-slate-500 mr-3 text-[20px] font-black">tag</span>
              <input 
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full bg-transparent border-none py-4 px-0 focus:ring-0 text-sm font-medium dark:text-slate-200" 
                placeholder="design, tech, system, innovation" 
              />
            </div>
            <p className="text-[9px] text-slate-400 dark:text-slate-600 px-1 italic font-medium">Separate tags with commas</p>
          </div>

          {/* Visibility / Discovery Level */}
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-600 ml-1">Discovery Level</label>
            <div className="grid grid-cols-2 gap-3 bg-slate-100 dark:bg-[#0c0e14] p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/20">
              <button className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white dark:bg-[#1a1f2b] shadow-md text-primary font-black text-[10px] uppercase tracking-widest border border-slate-200 dark:border-slate-700/50">
                <span className="material-symbols-outlined text-lg fill-1">public</span> Network
              </button>
              <button className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-slate-400 dark:text-slate-600 font-black text-[10px] uppercase tracking-widest">
                <span className="material-symbols-outlined text-lg">lock</span> Direct Only
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreatePost;
