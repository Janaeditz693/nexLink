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
  sender: 'me' | 'other' | 'system';
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
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  
  // Call States
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [isCallConnecting, setIsCallConnecting] = useState(false);
  const [isRemoteJoined, setIsRemoteJoined] = useState(false);
  
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

  // Effect to handle video element stream assignment once the DOM is ready
  useEffect(() => {
    if (isCallActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCallActive, isCallConnecting]);

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
    // Corrected webkitStoryRecognition to webkitSpeechRecognition
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

  const addSystemMessage = (text: string) => {
    const now = new Date();
    const newMsg: MessageItem = {
      id: `sys-${Date.now()}`,
      text,
      sender: 'system',
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const endCall = () => {
    if (isCallActive) {
      addSystemMessage(`Video call ended • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }
    setIsCallActive(false);
    setIsCallConnecting(false);
    setIsRemoteJoined(false);
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

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const startCall = async () => {
    setIsCallActive(true);
    setIsCallConnecting(true);
    setIsRemoteJoined(false);
    setCallError(null);
    setIsMuted(false);
    setIsCameraOff(false);
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices are not supported in this browser environment.");
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
      } catch (innerErr) {
        console.warn("Retrying with minimal constraints...");
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      }
      
      streamRef.current = stream;

      addSystemMessage(`Started video call with ${targetUser.name}`);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const outputNode = audioContextOutRef.current.createGain();
      outputNode.connect(audioContextOutRef.current.destination);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsCallConnecting(false);
            setIsRemoteJoined(true);
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
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && audioContextOutRef.current) {
              const ctx = audioContextOutRef.current;
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
            setCallError("Connection lost. Please check your internet and try again.");
            setIsCallConnecting(false);
            setIsRemoteJoined(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: `You are ${targetUser.name}, ${targetUser.role} at ${targetUser.company}. You are in a high-fidelity video call. Maintain professional poise.`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error("Failed to start call:", err);
      setIsCallConnecting(false);
      if (err.name === 'NotAllowedError' || err.message?.toLowerCase().includes('permission')) {
        setCallError("Camera and microphone permissions were denied. Please enable them in your settings.");
      } else {
        setCallError(err.message || "An unexpected error occurred during setup.");
      }
    }
  };

  const generateIcebreaker = async () => {
    if (isGeneratingIcebreaker) return;
    setIsGeneratingIcebreaker(true);
    setIcebreakerSuggestions([]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate 3 conversation icebreakers for networking.
      Sender: ${currentUser.name}, ${currentUser.role}.
      Recipient: ${targetUser.name}, ${targetUser.role}.
      Output JSON: [{"text": "string", "type": "Insightful" | "Curious" | "Action"}]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      if (response.text) {
        setIcebreakerSuggestions(JSON.parse(response.text.trim()));
      }
    } catch (e) {
      setIcebreakerSuggestions([
        { text: `I'm impressed by your work at ${targetUser.company}.`, type: 'Insightful' },
        { text: `What's your biggest challenge currently?`, type: 'Curious' },
        { text: `Let's sync up for 10 minutes next week.`, type: 'Action' }
      ]);
    } finally {
      setIsGeneratingIcebreaker(false);
    }
  };

  // Fix: Added missing handleShareProfileLink function to copy profile URL to clipboard
  const handleShareProfileLink = () => {
    const profileUrl = `${window.location.origin}/#/profile/${targetUser.id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(profileUrl).then(() => {
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy link:', err);
      });
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
    const now = new Date();
    const newMsg: MessageItem = { 
      id: Date.now().toString(), 
      text, 
      sender: 'me', 
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
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
  };

  const handleTouchStart = (messageId: string) => {
    setPressingMessageId(messageId);
    longPressTimer.current = setTimeout(() => {
      setActiveReactionMenu(messageId);
      setPressingMessageId(null);
    }, 500);
  };

  const handleTouchEnd = (e: any, messageId: string) => {
    setPressingMessageId(null);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      if (!activeReactionMenu) {
        setShowTimestampId(showTimestampId === messageId ? null : messageId);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden font-display relative">
      {/* Immersive Video Call Overlay */}
      {isCallActive && (
        <div className="fixed inset-0 z-[100] bg-[#05070a] animate-in fade-in duration-500 overflow-hidden flex flex-col">
          {callError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#05070a] z-[110]">
              <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                <span className="material-symbols-outlined text-red-500 text-4xl">error_outline</span>
              </div>
              <h3 className="text-xl font-black text-white mb-3">Call Interrupted</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xs">{callError}</p>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button onClick={startCall} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all uppercase tracking-widest text-xs">Try Again</button>
                <button onClick={endCall} className="w-full py-4 bg-white/5 text-slate-400 font-black rounded-2xl active:scale-95 transition-all uppercase tracking-widest text-xs">Dismiss</button>
              </div>
            </div>
          ) : (
            <>
              {/* Remote Stream View */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${isRemoteJoined ? 'blur-[100px] opacity-40 scale-125' : 'blur-3xl opacity-20'}`}
                  style={{ backgroundImage: `url(${targetUser.avatar})` }}
                />
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`transition-all duration-700 transform ${isRemoteJoined ? 'scale-100' : 'scale-90 opacity-80'}`}>
                    <div className={`size-48 rounded-full border-4 ${isCallConnecting ? 'border-primary/20 animate-pulse' : 'border-primary/60'} p-1.5 shadow-[0_0_80px_rgba(19,91,236,0.25)] relative group`}>
                      <div className="size-full rounded-full bg-cover bg-center overflow-hidden ring-4 ring-black/50" style={{ backgroundImage: `url(${targetUser.avatar})` }}>
                        {/* Simulate talking with a subtle overlay filter if joined */}
                        {isRemoteJoined && <div className="absolute inset-0 bg-primary/5 animate-pulse mix-blend-overlay"></div>}
                      </div>
                      
                      {isRemoteJoined && (
                        <div className="absolute -top-2 -right-2 bg-green-500 size-6 rounded-full border-4 border-black flex items-center justify-center animate-bounce shadow-lg">
                          <div className="size-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="mt-8 text-2xl font-black text-white tracking-tight drop-shadow-2xl">{targetUser.name}</h3>
                  <div className="flex flex-col items-center mt-3">
                    {isCallConnecting ? (
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {[...Array(3)].map((_, i) => <div key={i} className="size-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />)}
                        </div>
                        <span className="text-primary/70 font-black text-[10px] uppercase tracking-[0.4em]">Connecting Link</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                        <span className="size-2 rounded-full bg-primary animate-ping" />
                        <span className="text-primary font-black text-[9px] uppercase tracking-[0.3em]">Live Audio Feed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Local Participant Preview */}
              <div className={`absolute top-12 right-6 w-36 aspect-[3/4] rounded-[28px] overflow-hidden border-2 border-white/20 shadow-2xl z-50 bg-[#0f1117] transition-all transform hover:scale-105 ${isCameraOff ? 'brightness-50 grayscale' : 'brightness-110'}`}>
                {isCameraOff ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/80 gap-3">
                    <span className="material-symbols-outlined text-slate-600 text-3xl">videocam_off</span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Camera Off</span>
                  </div>
                ) : (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror scale-x-[-1]" />
                )}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                  <p className="text-[9px] font-black text-white uppercase tracking-widest">Alex (You)</p>
                </div>
              </div>

              {/* Floating Call Control Interface */}
              <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-6 z-50 px-6">
                <div className="flex items-center gap-5 bg-white/5 backdrop-blur-3xl border border-white/10 p-5 rounded-[40px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
                  <button 
                    onClick={toggleMute}
                    className={`size-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    <span className="material-symbols-outlined text-2xl">{isMuted ? 'mic_off' : 'mic'}</span>
                  </button>
                  
                  <button 
                    onClick={endCall}
                    className="h-16 px-10 rounded-[32px] bg-red-600 flex items-center justify-center text-white shadow-[0_0_40px_rgba(220,38,38,0.4)] active:scale-95 transition-all group"
                  >
                    <span className="material-symbols-outlined text-3xl fill-1 group-hover:rotate-12 transition-transform">call_end</span>
                  </button>
                  
                  <button 
                    onClick={toggleCamera}
                    className={`size-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${isCameraOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                  >
                    <span className="material-symbols-outlined text-2xl">{isCameraOff ? 'videocam_off' : 'videocam'}</span>
                  </button>
                </div>
                
                <div className="px-6 py-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/5 flex items-center gap-4 transition-all animate-in slide-in-from-bottom-2">
                  <div className="flex gap-1.5 items-end h-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-1 bg-primary rounded-full transition-all duration-75 ${isMuted ? 'h-1 opacity-20' : 'animate-bounce'}`} style={{ height: isMuted ? '4px' : `${40 + Math.random() * 60}%`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">{isMuted ? 'Microphone Muted' : 'Encrypted Professional Link'}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Standard Chat UI Container */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 pt-10 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 active:scale-75 transition-transform">
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <div className="relative cursor-pointer" onClick={() => navigate(`/profile/${id}`)}>
          <div className="size-11 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700" style={{ backgroundImage: `url(${targetUser.avatar})` }} />
          <div className={`absolute bottom-0.5 right-0.5 size-3 border-2 border-white dark:border-background-dark rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-400'}`} />
        </div>
        <div className="flex-1 min-w-0" onClick={() => navigate(`/profile/${id}`)}>
          <h2 className="text-base font-extrabold truncate">{targetUser.name}</h2>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{targetUser.role}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => generateIcebreaker()} className={`p-2 transition-all relative group ${isGeneratingIcebreaker ? 'text-primary' : 'text-slate-400 hover:text-primary active:scale-90'}`}>
            <span className={`material-symbols-outlined text-2xl fill-1 ${isGeneratingIcebreaker ? 'animate-pulse' : ''}`}>auto_awesome</span>
          </button>
          <button onClick={handleShareProfileLink} className={`p-2 transition-all active:scale-90 ${isLinkCopied ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}>
            <span className="material-symbols-outlined text-2xl">{isLinkCopied ? 'check' : 'share'}</span>
          </button>
          <button onClick={startCall} className="p-2 text-slate-400 hover:text-primary active:scale-90">
            <span className="material-symbols-outlined text-2xl">videocam</span>
          </button>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-10">
        <div className="flex justify-center mb-6">
          <span className="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">E2E Link Active</span>
        </div>

        {messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-4 animate-in fade-in duration-500">
                <span className="px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">videocam</span> {msg.text}
                </span>
              </div>
            );
          }

          const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
          const isPressing = pressingMessageId === msg.id;
          const isMenuOpen = activeReactionMenu === msg.id;

          return (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} group max-w-[90%] ${msg.sender === 'me' ? 'ml-auto' : ''} relative`}>
              <div className={`flex items-start gap-3 w-full ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.sender === 'other' && <div className="size-8 rounded-full bg-cover bg-center mt-1 shrink-0" style={{ backgroundImage: `url(${targetUser.avatar})` }} />}
                <div className={`flex flex-col gap-1 ${msg.sender === 'me' ? 'items-end' : 'items-start'} w-full relative`}>
                  <div 
                    className={`px-4 py-3 text-sm rounded-2xl shadow-sm cursor-pointer select-none transition-all duration-300 relative ${isPressing ? 'scale-[0.96]' : isMenuOpen ? 'scale-[1.02] z-50' : ''} ${msg.sender === 'me' ? 'bg-primary text-white rounded-tr-none' : 'bg-white dark:bg-card-dark text-slate-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-800'}`}
                    onMouseDown={(e) => { e.stopPropagation(); handleTouchStart(msg.id); }}
                    onMouseUp={(e) => { e.stopPropagation(); handleTouchEnd(e, msg.id); }}
                    onMouseLeave={() => setPressingMessageId(null)}
                    onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(msg.id); }}
                    onTouchEnd={(e) => { e.stopPropagation(); handleTouchEnd(e, msg.id); }}
                  >
                    {msg.text}
                  </div>
                  {hasReactions && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(Object.entries(msg.reactions!) as [string, string[]][]).map(([emoji, reactors]) => (
                        <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[12px] font-bold border ${reactors.includes('me') ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>
                          <span>{emoji}</span>
                          {reactors.length > 1 && <span className="text-[10px]">{reactors.length}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {isMenuOpen && (
                    <div className="absolute bottom-[calc(100%+8px)] z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-2xl p-1 flex gap-0.5">
                      {EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => { toggleReaction(msg.id, emoji); setActiveReactionMenu(null); }} className="size-10 flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all active:scale-150">{emoji}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 px-11">
            <div className="flex gap-1 p-2.5 bg-slate-100 dark:bg-card-dark rounded-2xl rounded-bl-none">
              <div className="size-1.5 bg-primary/40 rounded-full animate-bounce"></div>
              <div className="size-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 pb-28 shrink-0 relative">
        {icebreakerSuggestions.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 p-4 bg-gradient-to-t from-white dark:from-background-dark to-transparent">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary">AI Suggested</span>
                <button onClick={() => setIcebreakerSuggestions([])} className="text-slate-400"><span className="material-symbols-outlined text-sm">close</span></button>
             </div>
             <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {icebreakerSuggestions.map((s, i) => (
                  <button key={i} onClick={() => setInput(s.text)} className="shrink-0 max-w-[200px] bg-white dark:bg-card-dark border border-primary/20 rounded-xl p-3 text-left shadow-sm active:scale-95 transition-all">
                    <span className="text-[8px] font-black uppercase tracking-tighter text-primary/60 block mb-1">{s.type}</span>
                    <p className="text-[10px] font-medium leading-tight line-clamp-2">{s.text}</p>
                  </button>
                ))}
             </div>
          </div>
        )}
        <form className="flex items-center gap-2 p-4" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
          <button type="button" className="size-11 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary"><span className="material-symbols-outlined">add</span></button>
          <div className="flex-1 relative">
            <input value={input} onChange={(e) => setInput(e.target.value)} className={`w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary/20`} placeholder="Type a message..." />
            <button type="button" onClick={toggleListening} className={`absolute right-2 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center rounded-full ${isListening ? 'bg-primary text-white animate-pulse' : 'text-slate-400'}`}><span className="material-symbols-outlined text-[20px]">{isListening ? 'mic' : 'mic_none'}</span></button>
          </div>
          <button type="submit" disabled={!input.trim()} className={`size-11 flex items-center justify-center rounded-2xl transition-all ${input.trim() ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}><span className="material-symbols-outlined font-bold">send</span></button>
        </form>
      </footer>
    </div>
  );
};

export default Chat;