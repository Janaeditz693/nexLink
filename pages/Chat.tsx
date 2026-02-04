
import React, { useState, useEffect, useRef, useMemo } from 'react';
// Resolve missing named exports by destructuring from the full module
import * as ReactRouterDOM from 'react-router-dom';
import { MOCK_USERS } from '../constants';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { useApp } from '../AppContext';
import { User } from '../types';

const { useNavigate, useParams } = ReactRouterDOM as any;

interface MessageItem {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
  reactions?: Record<string, string[]>; 
  isProfileCard?: boolean;
}

interface IcebreakerSuggestion {
  text: string;
  type: 'Insightful' | 'Curious' | 'Action';
}

const EMOJIS = ['👍', '❤️', '🔥', '👏', '😂', '😮', '🎉', '🙌', '💡', '✅', '🚀', '🤝'];

// Helper functions for audio encoding/decoding as per manual implementation requirements
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const Chat: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
  const [pressingMessageId, setPressingMessageId] = useState<string | null>(null);
  const [showTimestampId, setShowTimestampId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingIcebreaker, setIsGeneratingIcebreaker] = useState(false);
  const [icebreakerSuggestions, setIcebreakerSuggestions] = useState<IcebreakerSuggestion[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Call States
  const [isCallActive, setIsCallActive] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live Call Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const targetUser = useMemo<User>(() => {
    if (id === 'global') {
      return { 
        id: 'global', 
        name: 'Global Network', 
        avatar: 'https://picsum.photos/100/100?random=global', 
        role: 'Open Channel', 
        company: 'NexLink',
        isVerified: true,
        bio: 'The nexus of all global professionals.' 
      };
    }
    const foundUser = Object.values(MOCK_USERS).find(u => u.id === id);
    return foundUser || MOCK_USERS.sophia;
  }, [id]);

  const [messages, setMessages] = useState<MessageItem[]>([
    { 
      id: '1', 
      text: `Hi! I was looking through your ${targetUser.role.toLowerCase()} projects. Incredible work on the recent iterations.`, 
      sender: 'other', 
      time: '10:42 AM', 
      reactions: { '🔥': [targetUser.id], '🚀': ['me'] } 
    },
    { 
      id: '2', 
      text: 'Thank you! It was a team effort focused on scalability. Really appreciate the feedback.', 
      sender: 'me', 
      time: '10:44 AM', 
      reactions: { '🤝': [targetUser.id] } 
    }
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results).map((result: any) => result[0]).map((result: any) => result.transcript).join('');
        setInput(transcript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, []);

  const endCall = () => {
    setIsCallActive(false);
    setCallError(null);
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    audioContextInRef.current?.close();
    audioContextOutRef.current?.close();
    audioContextInRef.current = null;
    audioContextOutRef.current = null;
    nextStartTimeRef.current = 0;
    activeSourcesRef.current.clear();
  };

  const startCall = async () => {
    setIsCallActive(true);
    setCallError(null);
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices are not supported in this browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Create a new GoogleGenAI instance right before making an API call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const outputNode = audioContextOutRef.current.createGain();
      outputNode.connect(audioContextOutRef.current.destination);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            if (!audioContextInRef.current || !streamRef.current) return;
            const source = audioContextInRef.current.createMediaStreamSource(streamRef.current);
            const scriptProcessor = audioContextInRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              // initiate sendRealtimeInput after live.connect call resolves to avoid race condition
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && audioContextOutRef.current) {
              const ctx = audioContextOutRef.current;
              // Schedule the next audio chunk to start at the exact end time of the previous one
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputNode);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              activeSourcesRef.current.add(source);
              source.onended = () => activeSourcesRef.current.delete(source);
            }
            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => s.stop());
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => endCall(),
          onerror: (e) => { 
            console.error("Live API Error:", e);
            setCallError("Connection lost. Please try again.");
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: `You are ${targetUser.name}, ${targetUser.role} at ${targetUser.company}. Your bio: ${targetUser.bio}. Keep the conversation professional, engaging, and concise. You are currently on a video call with Alex Rivera.`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error("Failed to start call:", err);
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission') || err.message?.includes('dismissed')) {
        setCallError("Camera or Microphone permission was dismissed. Please enable access in your browser settings to start a call.");
      } else {
        setCallError(err.message || "An unexpected error occurred while starting the call.");
      }
    }
  };

  const generateIcebreaker = async () => {
    if (isGeneratingIcebreaker) return;
    setIsGeneratingIcebreaker(true);
    setIcebreakerSuggestions([]);
    
    try {
      // Create a new GoogleGenAI instance right before making an API call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Act as an elite executive networking coach for NexLink. 
      Generate 3 professional conversation icebreakers.
      Sender (Me): ${currentUser.name}, ${currentUser.role} at ${currentUser.company}.
      Recipient: ${targetUser.name}, ${targetUser.role} at ${targetUser.company}.
      Requirements: 
      1. One "Insightful" (praise/impact)
      2. One "Curious" (question)
      3. One "Action" (proposal)
      Max 22 words per suggestion. Output ONLY valid JSON: [{"text": "string", "type": "Insightful" | "Curious" | "Action"}]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        setIcebreakerSuggestions(parsed);
      }
    } catch (e) {
      console.error("AI Error:", e);
      setIcebreakerSuggestions([
        { text: `Your work at ${targetUser.company} is truly innovative. I'd love to learn about your strategy.`, type: 'Insightful' },
        { text: `As a fellow ${currentUser.role.split(' ')[0]}, I'm curious about your approach to latest shifts.`, type: 'Curious' },
        { text: `Are you open to a brief 10-min virtual sync next week?`, type: 'Action' }
      ]);
    } finally {
      setIsGeneratingIcebreaker(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveReactionMenu(null);
      setShowTimestampId(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSend = (textToSend: string = input) => {
    const text = textToSend.trim();
    if (!text) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    
    const now = new Date();
    const newMsg: MessageItem = { 
      id: Date.now().toString(), 
      text: text, 
      sender: 'me', 
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIcebreakerSuggestions([]);
    
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const replyTime = new Date();
        const reply: MessageItem = { 
          id: (Date.now() + 1).toString(), 
          text: "I'd love to chat more about that. Are you free for a 15 min virtual coffee next Tuesday?", 
          sender: 'other', 
          time: replyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        setMessages(prev => [...prev, reply]);
      }, 2500);
    }, 1000);
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || {};
        const reactors = reactions[emoji] || [];
        const isAlreadyReacted = reactors.includes('me');
        const newReactors = isAlreadyReacted ? reactors.filter(r => r !== 'me') : [...reactors, 'me'];
        const newReactions = { ...reactions };
        if (newReactors.length === 0) delete newReactions[emoji];
        else newReactions[emoji] = newReactors;
        return { ...msg, reactions: newReactions };
      }
      return msg;
    }));
    setActiveReactionMenu(null);
  };

  const handleTouchStart = (messageId: string) => {
    setPressingMessageId(messageId);
    longPressTimer.current = setTimeout(() => {
      setActiveReactionMenu(messageId);
      setPressingMessageId(null);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 500);
  };

  const handleTouchEnd = (e: React.MouseEvent | React.TouchEvent, messageId: string) => {
    setPressingMessageId(null);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      if (!activeReactionMenu) {
        setShowTimestampId(showTimestampId === messageId ? null : messageId);
      }
    }
  };

  const selectSuggestion = (text: string) => {
    setInput(text);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden font-display relative">
      {/* Immersive Video Call Overlay */}
      {isCallActive && (
        <div className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-500 overflow-hidden flex flex-col">
          {callError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900 z-[110]">
              <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-red-500 text-4xl">no_photography</span>
              </div>
              <h3 className="text-xl font-black text-white mb-3">Permission Required</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xs">{callError}</p>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button 
                  onClick={startCall}
                  className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all uppercase tracking-widest text-xs"
                >
                  Try Again
                </button>
                <button 
                  onClick={endCall}
                  className="w-full py-4 bg-white/5 text-slate-400 font-black rounded-2xl active:scale-95 transition-all uppercase tracking-widest text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Main remote video placeholder (Recipient) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-125 transition-all"
                  style={{ backgroundImage: `url(${targetUser.avatar})` }}
                />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="size-48 rounded-full border-4 border-primary/40 p-1 animate-pulse shadow-[0_0_50px_rgba(19,91,236,0.3)]">
                    <div 
                      className="size-full rounded-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${targetUser.avatar})` }}
                    />
                  </div>
                  <h3 className="mt-8 text-2xl font-black text-white tracking-tight">{targetUser.name}</h3>
                  <p className="text-primary font-bold text-xs uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary animate-ping" />
                    Live Connection
                  </p>
                </div>
              </div>

              {/* Local Preview (Floating) */}
              <div className="absolute top-12 right-6 w-32 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-50 bg-slate-900">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>

              {/* Call Controls */}
              <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-8 z-50">
                <div className="flex items-center gap-6">
                  <button className="size-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform">
                    <span className="material-symbols-outlined">mic_off</span>
                  </button>
                  <button 
                    onClick={endCall}
                    className="size-20 rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_10px_30px_rgba(239,68,68,0.4)] active:scale-90 transition-transform"
                  >
                    <span className="material-symbols-outlined text-4xl fill-1">call_end</span>
                  </button>
                  <button className="size-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform">
                    <span className="material-symbols-outlined">videocam_off</span>
                  </button>
                </div>
                
                <div className="px-6 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center gap-3">
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-1 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Voice processing active</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 pt-10 flex items-center gap-3 shadow-sm shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 active:scale-75 transition-transform">
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <div className="relative cursor-pointer" onClick={() => navigate(`/profile/${id}`)}>
          <div className="size-11 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700 shadow-sm" style={{ backgroundImage: `url(${targetUser.avatar})` }} />
          <div className={`absolute bottom-0.5 right-0.5 size-3 border-2 border-white dark:border-background-dark rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-400'}`} />
        </div>
        <div className="flex-1 min-w-0" onClick={() => navigate(`/profile/${id}`)}>
          <h2 className="text-base font-extrabold truncate">{targetUser.name}</h2>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{targetUser.role}</p>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); generateIcebreaker(); }} 
            className={`p-2 transition-all relative group ${isGeneratingIcebreaker ? 'text-primary' : 'text-slate-400 hover:text-primary active:scale-90'}`} 
            title="AI Icebreaker"
          >
            <span className={`material-symbols-outlined text-2xl fill-1 ${isGeneratingIcebreaker ? 'animate-pulse' : ''}`}>auto_awesome</span>
            {isGeneratingIcebreaker && <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>}
          </button>
          <button onClick={startCall} className="p-2 text-slate-400 hover:text-primary active:scale-90">
            <span className="material-symbols-outlined text-2xl">videocam</span>
          </button>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-10">
        <div className="flex justify-center mb-6">
          <span className="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">End-to-end encrypted</span>
        </div>

        {messages.map((msg) => {
          const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
          const isPressing = pressingMessageId === msg.id;
          const isMenuOpen = activeReactionMenu === msg.id;
          const isTimestampVisible = showTimestampId === msg.id;

          return (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} group max-w-[90%] ${msg.sender === 'me' ? 'ml-auto' : ''} relative`}>
              <div className={`flex items-start gap-3 w-full ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.sender === 'other' && (
                  <div className="size-8 rounded-full bg-cover bg-center mt-1 shrink-0 shadow-sm" style={{ backgroundImage: `url(${targetUser.avatar})` }} />
                )}
                
                <div className={`flex flex-col gap-1 ${msg.sender === 'me' ? 'items-end' : 'items-start'} w-full relative`}>
                  <div 
                    className={`px-4 py-3 text-sm leading-relaxed rounded-2xl shadow-sm cursor-pointer select-none transition-all duration-300 relative ${isPressing ? 'scale-[0.96] brightness-90' : isMenuOpen ? 'scale-[1.02] z-50' : 'scale-100'} ${msg.sender === 'me' ? 'bg-primary text-white rounded-tr-none' : 'bg-white dark:bg-card-dark text-slate-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-800'} ${hasReactions ? 'ring-1 ring-primary/20 shadow-md' : ''}`}
                    onMouseDown={(e) => { e.stopPropagation(); handleTouchStart(msg.id); }}
                    onMouseUp={(e) => { e.stopPropagation(); handleTouchEnd(e, msg.id); }}
                    onMouseLeave={() => setPressingMessageId(null)}
                    onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(msg.id); }}
                    onTouchEnd={(e) => { e.stopPropagation(); handleTouchEnd(e, msg.id); }}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {msg.text}
                  </div>

                  {hasReactions && (
                    <div className={`flex flex-wrap gap-1 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-300 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      {Object.entries(msg.reactions!).map(([emoji, reactors]) => (
                        <button 
                          key={emoji} 
                          onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }} 
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[12px] font-bold border transition-all hover:scale-110 active:scale-90 shadow-sm ${reactors.includes('me') ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                        >
                          <span className="text-[14px]">{emoji}</span>
                          {reactors.length > 1 && <span className="text-[10px] opacity-70">{reactors.length}</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  {isMenuOpen && (
                    <div 
                      className={`absolute bottom-[calc(100%+12px)] z-[100] bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.2)] p-1.5 flex items-center gap-0.5 animate-in zoom-in slide-in-from-bottom-2 duration-300 ${msg.sender === 'me' ? 'right-0 origin-bottom-right' : 'left-0 origin-bottom-left'}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {EMOJIS.map((emoji, idx) => (
                        <button 
                          key={emoji} 
                          onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }} 
                          className="size-10 flex items-center justify-center text-xl hover:bg-primary/10 hover:scale-125 rounded-full transition-all active:scale-150"
                          style={{ transitionDelay: `${idx * 20}ms` }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={`flex items-center gap-1.5 mt-1 transition-all duration-300 ${msg.sender === 'me' ? 'pr-2' : 'pl-11'} ${isTimestampVisible ? 'opacity-100 max-h-5 translate-y-0' : 'opacity-0 max-h-0 -translate-y-2 group-hover:opacity-60 group-hover:max-h-5 group-hover:translate-y-0 overflow-hidden'}`}>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{msg.time}</span>
                {msg.sender === 'me' && <span className="material-symbols-outlined text-[10px] text-primary fill-1">done_all</span>}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 px-11 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex gap-1 p-2.5 bg-slate-100 dark:bg-card-dark rounded-2xl rounded-bl-none">
              <div className="size-1.5 bg-primary/40 rounded-full animate-bounce"></div>
              <div className="size-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 pb-28 shrink-0 relative">
        {/* AI Suggestion Tray */}
        {icebreakerSuggestions.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 p-4 bg-gradient-to-t from-white dark:from-background-dark to-transparent animate-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm fill-1">auto_awesome</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">AI Suggested Icebreakers</span>
                </div>
                <button onClick={() => setIcebreakerSuggestions([])} className="text-slate-400">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
             </div>
             <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {icebreakerSuggestions.map((s, i) => (
                  <div 
                    key={i} 
                    className="shrink-0 max-w-[220px] bg-white dark:bg-card-dark border border-primary/20 rounded-xl shadow-md hover:border-primary transition-all group relative overflow-hidden flex flex-col"
                  >
                    <button 
                      onClick={() => selectSuggestion(s.text)}
                      className="text-left p-3 flex-1 active:scale-[0.98] transition-transform"
                    >
                      <div className="absolute top-0 right-0 p-1 opacity-5">
                        <span className="material-symbols-outlined text-[40px] fill-1 text-primary">auto_awesome</span>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-primary/60 block mb-1">{s.type}</span>
                      <p className="text-[10px] font-medium leading-tight text-slate-700 dark:text-slate-300 line-clamp-3">{s.text}</p>
                    </button>
                    <div className="flex items-center justify-end px-2 pb-2 gap-2">
                       <button 
                         onClick={(e) => { e.stopPropagation(); copyToClipboard(s.text, i); }}
                         className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${copiedIndex === i ? 'bg-green-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary hover:bg-primary/10'}`}
                         title="Copy to clipboard"
                       >
                         <span className="material-symbols-outlined text-[16px] leading-none">
                           {copiedIndex === i ? 'check' : 'content_copy'}
                         </span>
                         {copiedIndex === i && <span className="text-[8px] font-bold uppercase">Copied</span>}
                       </button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        <form className="flex items-center gap-2 p-4" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
          <button type="button" className="size-11 shrink-0 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary transition-all active:scale-90">
            <span className="material-symbols-outlined">add</span>
          </button>
          <div className="flex-1 relative">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              className={`w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl pl-5 pr-12 py-3.5 text-sm transition-all focus:ring-2 ${isListening ? 'ring-2 ring-primary bg-primary/5' : 'focus:ring-primary/20'} placeholder:text-slate-400`} 
              placeholder={isListening ? "Listening..." : "Type a message..."} 
            />
            <button 
              type="button" 
              onClick={toggleListening} 
              className={`absolute right-2 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center rounded-full transition-all ${isListening ? 'bg-primary text-white shadow-lg animate-pulse' : 'text-slate-400 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-[20px]">{isListening ? 'mic' : 'mic_none'}</span>
            </button>
          </div>
          <button 
            type="submit" 
            disabled={!input.trim()} 
            className={`size-11 shrink-0 flex items-center justify-center rounded-2xl transition-all shadow-md ${input.trim() ? 'bg-primary text-white shadow-primary/20 active:scale-95' : 'bg-slate-200 text-slate-400 opacity-50 cursor-not-allowed'}`}
          >
            <span className="material-symbols-outlined font-bold">send</span>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default Chat;
