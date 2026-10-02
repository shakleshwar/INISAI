import { useState, useEffect } from 'react';
import { X, Code2, ExternalLink, Code, User, Info, Check, PlayCircle, Cloud, Radio, Disc3, Headphones, Smartphone, Music } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';

export function SettingsModal() {
  const { isSettingsOpen, setSettingsOpen } = useAudioStore();
  const [streamingService, setStreamingService] = useState('youtube');

  useEffect(() => {
    const saved = localStorage.getItem('streamingService');
    if (saved) setStreamingService(saved);
  }, []);

  const handleServiceChange = (val: string) => {
    setStreamingService(val);
    localStorage.setItem('streamingService', val);
  };


  if (!isSettingsOpen) return null;

  const SERVICES = [
    { id: 'youtube', name: 'YouTube Music', icon: PlayCircle, status: 'Available' },
    { id: 'soundcloud', name: 'SoundCloud', icon: Cloud, status: 'Available' },
    { id: 'spotify', name: 'Spotify', icon: Radio, status: 'Beta' },
    { id: 'tidal', name: 'Tidal', icon: Disc3, status: 'Soon' },
    { id: 'qobuz', name: 'Qobuz', icon: Headphones, status: 'Soon' },
    { id: 'amazon', name: 'Amazon Music', icon: Music, status: 'Soon' },
    { id: 'deezer', name: 'Deezer', icon: Smartphone, status: 'Soon' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity"
        onClick={() => setSettingsOpen(false)}
      />
      
      {/* Modal / Bottom Sheet */}
      <div className="relative w-full max-w-lg bg-zinc-950 sm:bg-zinc-900/80 sm:backdrop-blur-3xl sm:border sm:border-white/10 shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-500 max-h-[90vh] flex flex-col">
        
        {/* Mobile Drag Handle Indicator */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-4 sm:p-6 sm:border-b sm:border-white/10">
          <h2 className="text-xl font-bold text-white tracking-tight">Settings</h2>
          <button 
            onClick={() => setSettingsOpen(false)}
            className="p-2 -mr-2 sm:m-0 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-90"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="relative p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Note */}
          <div className="relative overflow-hidden bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
              <Info className="text-blue-400" size={16} />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-blue-400 mb-1">Under Development</h3>
              <p className="text-[13px] text-blue-200/70 leading-relaxed">
                This application is still actively developed. Features and interfaces may change, and some bugs might be present.
              </p>
            </div>
          </div>


          {/* Streaming Service Selection */}
          <div className="space-y-3">
            <h3 className="text-[12px] font-semibold text-zinc-500 uppercase tracking-widest pl-1">Streaming Engine</h3>
            <p className="text-[13px] text-zinc-400 pl-1 mb-2">
              Select your preferred backend service. High-fidelity engines coming soon.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
              {SERVICES.map((service, index) => (
                <button
                  key={service.id}
                  disabled={service.status === 'Soon'}
                  onClick={() => handleServiceChange(service.id)}
                  className={`w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 transition-colors ${
                    index !== SERVICES.length - 1 ? 'border-b border-white/5' : ''
                  } ${service.status === 'Soon' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      streamingService === service.id ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      <service.icon size={16} />
                    </div>
                    <span className={`text-[15px] font-medium ${
                      streamingService === service.id ? 'text-white' : 'text-zinc-300'
                    }`}>{service.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {service.status === 'Beta' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider">Beta</span>
                    )}
                    {service.status === 'Soon' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-zinc-500 border border-white/5 uppercase tracking-wider">Soon</span>
                    )}
                    {streamingService === service.id && (
                      <Check size={18} className="text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* About Developer */}
          <div className="space-y-3">
            <h3 className="text-[12px] font-semibold text-zinc-500 uppercase tracking-widest pl-1">Developer</h3>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 p-[1px] shadow-lg">
                  <div className="w-full h-full bg-[#030304] rounded-full flex items-center justify-center">
                    <User size={20} className="text-zinc-400" />
                  </div>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-white tracking-tight">Saras Shakleshwar</h4>
                  <p className="text-[13px] text-zinc-400 mt-0.5">Student Developer</p>
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h3 className="text-[12px] font-semibold text-zinc-500 uppercase tracking-widest pl-1">Links</h3>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
              <a 
                href="https://github.com/shakleshwar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 transition-colors border-b border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <Code2 size={16} className="text-zinc-400" />
                  </div>
                  <span className="text-[15px] font-medium text-zinc-300">GitHub</span>
                </div>
                <ExternalLink size={16} className="text-zinc-500" />
              </a>
              <a 
                href="https://www.instagram.com/shakleshwar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <User size={16} className="text-zinc-400" />
                  </div>
                  <span className="text-[15px] font-medium text-zinc-300">Instagram</span>
                </div>
                <ExternalLink size={16} className="text-zinc-500" />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-4 pb-8 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-zinc-600">
              <Code size={14} />
              <p className="text-[12px] font-semibold tracking-wider">
                © {new Date().getFullYear()} INISAI
              </p>
            </div>
            <p className="text-[11px] text-zinc-700 text-center max-w-xs font-medium">
              Music metadata and streaming capabilities provided by third-party services.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
