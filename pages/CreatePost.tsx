
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
    <div className="flex-1 bg-background-light dark:bg-background-dark min-h-screen">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 ios-blur border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4">
        <button onClick={() => navigate(-1)} className="text-slate-500 font-medium px-2">Cancel</button>
        <h1 className="text-lg font-bold">New Post</h1>
        <button 
          onClick={handlePost}
          disabled={isPosting || !caption.trim() || !selectedImage}
          className={`px-5 py-1.5 rounded-full font-bold text-sm transition-all ${isPosting || !caption.trim() || !selectedImage ? 'bg-slate-200 text-slate-400' : 'bg-primary text-white shadow-lg shadow-primary/20 active:scale-95'}`}
        >
          {isPosting ? '...' : 'Post'}
        </button>
      </header>

      <main className="p-4 space-y-6">
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageSelect} 
          accept="image/*" 
          className="hidden" 
        />

        <div 
          onClick={triggerFileInput}
          className="relative aspect-[4/5] bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden group cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary transition-colors"
        >
          {selectedImage ? (
            <div className="absolute inset-0 bg-cover bg-center animate-in fade-in duration-500" style={{ backgroundImage: `url(${selectedImage})` }} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center">
              <span className="material-symbols-outlined text-5xl mb-3">add_a_photo</span>
              <p className="text-sm font-bold uppercase tracking-widest">Tap to select your work</p>
              <p className="text-[10px] mt-2 opacity-60">High-resolution images recommended</p>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-white text-4xl bg-black/40 p-4 rounded-full backdrop-blur-sm">edit</span>
          </div>

          {selectedImage && (
            <button 
              className="absolute bottom-4 right-4 bg-black/60 p-3 rounded-full border border-white/20 ios-blur shadow-lg"
              onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}
            >
              <span className="material-symbols-outlined text-white">grid_view</span>
            </button>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Caption</label>
            <textarea 
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl p-4 min-h-[140px] focus:ring-2 focus:ring-primary shadow-sm text-sm placeholder:text-slate-400"
              placeholder="What's the impact of this project? Share your professional insights..."
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Expertise Tags</label>
            <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl px-4 border-none shadow-sm focus-within:ring-2 focus-within:ring-primary transition-all">
              <span className="material-symbols-outlined text-slate-400 mr-2 text-[20px]">tag</span>
              <input 
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full bg-transparent border-none py-4 px-0 focus:ring-0 text-sm" 
                placeholder="design, tech, system, innovation" 
              />
            </div>
            <p className="text-[9px] text-slate-400 px-1 italic">Separate tags with commas</p>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Discovery Level</label>
            <div className="grid grid-cols-2 gap-3 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
              <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm text-primary font-black text-[10px] uppercase tracking-widest">
                <span className="material-symbols-outlined text-lg fill-1">public</span> Network
              </button>
              <button className="flex items-center justify-center gap-2 py-3 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-widest">
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
