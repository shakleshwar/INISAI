import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Music2 } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (name: string) => void;
}

export function CreatePlaylistModal({ isOpen, onClose, onCreate }: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const createPlaylist = useAudioStore((state) => state.createPlaylist);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      if (onCreate) {
        onCreate(name.trim());
      } else {
        createPlaylist(name.trim());
      }
      setName('');
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#030304]/80 backdrop-blur-md transition-opacity animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md glass-surface-elevated rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10" />
        
        <div className="p-7">
          <div className="flex items-center justify-between mb-7">
            <h2 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Music2 size={18} className="text-white" />
              </div>
              Create Playlist
            </h2>
            <button 
              onClick={onClose}
              aria-label="Close modal"
              className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-full transition-all duration-150 active:scale-[0.96] cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <label htmlFor="playlist-name" className="block text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-3">
                Playlist Name
              </label>
              <input
                id="playlist-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Mix..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-[15px] font-bold text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-[13px] font-bold text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all duration-150 active:scale-[0.96] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-6 py-3 bg-white text-zinc-950 text-[13px] font-black uppercase tracking-wider rounded-xl hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_4px_16px_rgba(255,255,255,0.2)] active:scale-[0.96] cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
