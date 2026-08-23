import { useState, useEffect } from 'react';
import { X, Code2, ExternalLink, Code, User, Info, AlertTriangle } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#030304]/80 backdrop-blur-md transition-opacity"
        onClick={() => setSettingsOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg glass-surface-elevated rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/[0.06] bg-white/[0.02]">
          <h2 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-white/10 rounded-lg border border-white/20">
              <Info className="text-white" size={20} />
            </div>
            Settings & Info
          </h2>
          <button 
            onClick={() => setSettingsOpen(false)}
            className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/[0.06] rounded-full transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="relative p-6 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Note */}
          <div className="relative overflow-hidden bg-white/5 border border-white/20 rounded-xl p-5 flex items-start gap-4 backdrop-blur-sm shadow-[0_4px_24px_rgba(255,255,255,0.05)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <AlertTriangle className="text-white shrink-0 mt-0.5 relative z-10" size={20} />
            <div className="relative z-10">
              <h3 className="text-[13px] font-bold text-white mb-1.5 uppercase tracking-wide">Under Development</h3>
              <p className="text-[13px] text-white/80 leading-relaxed font-medium">
                This application is still actively developed. Features and interfaces may change, and some bugs might be present.
              </p>
            </div>
          </div>


          {/* Streaming Service Selection */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] pl-1">Streaming Engine</h3>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-5">
              <p className="text-[13px] text-zinc-400 mb-5 leading-relaxed font-medium">
                Select your preferred backend streaming service for playing tracks.
                (Note: High-fidelity engines like Tidal/Qobuz are coming soon!)
              </p>
              <div className="flex flex-col gap-2.5">
                {[
                  { id: 'youtube', name: 'YouTube Music', icon: '🎧', status: 'Active' },
                  { id: 'soundcloud', name: 'SoundCloud', icon: '☁️', status: 'Active' },
                  { id: 'spotify', name: 'Spotify', icon: '🟢', status: 'Beta' },
                  { id: 'tidal', name: 'Tidal', icon: '🌊', status: 'Coming Soon' },
                  { id: 'qobuz', name: 'Qobuz', icon: '🎵', status: 'Coming Soon' },
                  { id: 'amazon', name: 'Amazon Music', icon: '📦', status: 'Coming Soon' },
                  { id: 'deezer', name: 'Deezer', icon: '🔊', status: 'Coming Soon' }
                ].map(service => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceChange(service.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                      streamingService === service.id
                        ? 'bg-white/10 border-white/30 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]'
                        : 'bg-black/20 border-white/[0.04] text-zinc-400 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.1] active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-xl">{service.icon}</span>
                      <span className="text-[14px] font-bold">{service.name}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                      service.status === 'Active' ? 'bg-white/10 text-white border border-white/20' :
                      service.status === 'Beta' ? 'bg-white/10 text-white border border-white/20' :
                      'bg-white/[0.04] text-zinc-500 border border-white/[0.06]'
                    }`}>
                      {service.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* About Developer */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] pl-1">Developer</h3>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-5 flex items-center justify-between group hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white p-[2px] shadow-[0_4px_16px_rgba(255,255,255,0.2)]">
                  <div className="w-full h-full bg-[#030304] rounded-full flex items-center justify-center">
                    <User size={20} className="text-zinc-300 group-hover:text-white transition-colors" />
                  </div>
                </div>
                <div>
                  <h4 className="text-[15px] font-black text-white tracking-tight">SARAS SHAKLESHWAR</h4>
                  <p className="text-[11px] text-white font-bold uppercase tracking-widest mt-0.5">Student Developer</p>
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] pl-1">Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a 
                href="https://github.com/shakleshwar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/[0.1] rounded-xl p-4 transition-all duration-300 group active:scale-[0.98]"
              >
                <div className="bg-white/[0.06] p-2.5 rounded-lg border border-white/[0.04] group-hover:bg-white/[0.1] transition-colors">
                  <Code2 size={18} className="text-zinc-400 group-hover:text-white" />
                </div>
                <span className="text-[14px] font-bold text-zinc-400 group-hover:text-white transition-colors">GitHub</span>
              </a>
              <a 
                href="https://www.instagram.com/shakleshwar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/[0.1] rounded-xl p-4 transition-all duration-300 group active:scale-[0.98]"
              >
                <div className="bg-white/10 p-2.5 rounded-lg border border-white/[0.04] group-hover:opacity-90 transition-opacity">
                  <ExternalLink size={18} className="text-white" />
                </div>
                <span className="text-[14px] font-bold text-zinc-400 group-hover:text-white transition-colors">Instagram</span>
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-white/[0.06]">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-zinc-500">
                <Code size={14} />
                <p className="text-[12px] font-bold tracking-wider">
                  © {new Date().getFullYear()} INISAI. ALL RIGHTS RESERVED.
                </p>
              </div>
              <p className="text-[11px] text-zinc-600 text-center max-w-xs font-medium leading-relaxed">
                Music metadata and streaming capabilities provided by third-party services.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
