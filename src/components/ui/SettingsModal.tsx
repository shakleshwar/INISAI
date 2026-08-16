import { X, Code2, ExternalLink, Code, User, Info, AlertTriangle } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';

export function SettingsModal() {
  const { isSettingsOpen, setSettingsOpen } = useAudioStore();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setSettingsOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Info className="text-blue-400" />
            About & Settings
          </h2>
          <button 
            onClick={() => setSettingsOpen(false)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Note */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-bold text-amber-500 mb-1">Under Development</h3>
              <p className="text-xs text-amber-500/80 leading-relaxed">
                This application is still under development. Features and interfaces may change, and some bugs might be present.
              </p>
            </div>
          </div>

          {/* About Developer */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Developer</h3>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">SARAS SHAKLESHWAR</h4>
                  <p className="text-xs text-blue-400 font-medium">Currently a Student</p>
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a 
                href="https://github.com/shakleshwar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-colors group"
              >
                <div className="bg-black/50 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <Code2 size={18} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-zinc-300 group-hover:text-white">GitHub</span>
              </a>
              <a 
                href="https://www.instagram.com/shakleshwar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-colors group"
              >
                <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <ExternalLink size={18} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-zinc-300 group-hover:text-white">Instagram</span>
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="flex items-center justify-center gap-2 text-zinc-500">
              <Code size={14} />
              <p className="text-xs font-medium">
                © {new Date().getFullYear()} INISAI. All rights reserved.
              </p>
            </div>
            <p className="text-[10px] text-zinc-600 text-center max-w-xs mx-auto">
              Music metadata and streaming capabilities provided by third-party services.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
