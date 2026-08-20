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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={() => setSettingsOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-slide-up ring-1 ring-white/5">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Info className="text-blue-400" size={20} />
            </div>
            Settings & Info
          </h2>
          <button 
            onClick={() => setSettingsOpen(false)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="relative p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Note */}
          <div className="relative overflow-hidden bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-16 -mt-16" />
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5 relative z-10" size={20} />
            <div className="relative z-10">
              <h3 className="text-sm font-bold text-amber-500 mb-1">Under Development</h3>
              <p className="text-xs text-amber-500/80 leading-relaxed">
                This application is still actively developed. Features and interfaces may change, and some bugs might be present.
              </p>
            </div>
          </div>


          {/* Streaming Service Selection */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Streaming Engine</h3>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Select your preferred backend streaming service for playing tracks.
                (Note: High-fidelity engines like Tidal/Qobuz are coming soon!)
              </p>
              <div className="flex flex-col gap-2">
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
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                      streamingService === service.id
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                        : 'bg-black/20 border-transparent text-zinc-400 hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{service.icon}</span>
                      <span className="text-sm font-semibold">{service.name}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      service.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      service.status === 'Beta' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-white/5 text-zinc-500 border border-white/5'
                    }`}>
                      {service.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* About Developer */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Developer</h3>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 backdrop-blur-sm flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[2px]">
                  <div className="w-full h-full bg-[#0a0a0f] rounded-full flex items-center justify-center">
                    <User size={20} className="text-zinc-300 group-hover:text-white transition-colors" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">SARAS SHAKLESHWAR</h4>
                  <p className="text-[11px] text-blue-400 font-medium uppercase tracking-wider mt-0.5">Student Developer</p>
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a 
                href="https://github.com/shakleshwar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl p-3.5 transition-all duration-300 group"
              >
                <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-colors">
                  <Code2 size={18} className="text-zinc-300 group-hover:text-white" />
                </div>
                <span className="text-sm font-semibold text-zinc-400 group-hover:text-white transition-colors">GitHub</span>
              </a>
              <a 
                href="https://www.instagram.com/shakleshwar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl p-3.5 transition-all duration-300 group"
              >
                <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-2 rounded-lg group-hover:opacity-90 transition-opacity">
                  <ExternalLink size={18} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-zinc-400 group-hover:text-white transition-colors">Instagram</span>
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-6 border-t border-white/10">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-zinc-500">
                <Code size={14} />
                <p className="text-xs font-semibold">
                  © {new Date().getFullYear()} INISAI. All rights reserved.
                </p>
              </div>
              <p className="text-[10px] text-zinc-600 text-center max-w-xs leading-relaxed">
                Music metadata and streaming capabilities provided by third-party services.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
