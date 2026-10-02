import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Heart, PlusCircle, ListPlus, ChevronRight, Trash2, Download } from 'lucide-react';
import { db } from '../../lib/db';
import { useAudioStore } from '../../store/useAudioStore';
import { API_BASE } from '../../services/api';
import type { Track } from '../../types';
import { CreatePlaylistModal } from './CreatePlaylistModal';

interface TrackContextMenuProps {
  track: Track;
  iconSize?: number;
  buttonClassName?: string;
}

export function TrackContextMenu({ track, iconSize = 20, buttonClassName = "p-2 text-zinc-500 hover:text-white hover:bg-white/[0.06] rounded-full transition-colors md:opacity-0 group-hover:opacity-100 active:scale-90" }: TrackContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { likedSongs, toggleLikedSong, playNext, addToQueue, playlists, addTrackToPlaylist } = useAudioStore();
  const isLiked = likedSongs.some((t) => t.id === track.id);

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = 280;
      const menuWidth = 256;
      
      let top = rect.bottom + 5;
      let left = rect.right - menuWidth; 
      
      if (top + menuHeight > window.innerHeight) {
         top = rect.top - menuHeight - 5;
      }
      if (left < 10) left = 10;
      if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 10;

      setMenuPos({ top, left });
    }
    setIsOpen(true);
    setShowPlaylists(false);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setShowPlaylists(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Also close on scroll to prevent detached menus
      document.addEventListener('scroll', closeMenu, true);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', closeMenu, true);
    };
  }, [isOpen]);

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
    closeMenu();
  };

  const menuContent = (
    <div 
      ref={menuRef}
      style={{ top: menuPos.top, left: menuPos.left }}
      className="fixed z-[100] w-64 glass-surface-elevated rounded-xl p-1.5 text-[14px] font-medium text-zinc-300 animate-fade-in"
    >
      {!showPlaylists ? (
        <div className="flex flex-col gap-0.5">
          <button 
            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.06] rounded-md transition-colors group"
            onClick={(e) => {
              e.stopPropagation();
              setShowPlaylists(true);
            }}
          >
            <div className="flex items-center gap-3">
              <PlusCircle size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
              <span className="group-hover:text-white transition-colors">Add to playlist</span>
            </div>
            <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
          </button>

          <button 
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.06] rounded-md transition-colors group"
            onClick={(e) => handleAction(e, () => playNext(track))}
          >
            <ListPlus size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
            <span className="group-hover:text-white transition-colors">Play Next</span>
          </button>

          <button 
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.06] rounded-md transition-colors group"
            onClick={(e) => handleAction(e, () => addToQueue(track))}
          >
            <ListPlus size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
            <span className="group-hover:text-white transition-colors">Add to queue</span>
          </button>

          <button 
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.06] rounded-md transition-colors group"
            onClick={(e) => handleAction(e, () => toggleLikedSong(track))}
          >
            <Heart size={16} className={isLiked ? 'text-white fill-white' : 'text-zinc-400 group-hover:text-white transition-colors'} />
            <span className={isLiked ? 'text-white' : 'group-hover:text-white transition-colors'}>
              {isLiked ? 'Remove from Liked Songs' : 'Save to your Liked Songs'}
            </span>
          </button>

          <div className="h-px bg-white/[0.06] my-1 mx-2" />
          
          {track.source !== 'local' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const downloadUrl = `${API_BASE}/api/download/${track.id}?title=${encodeURIComponent(track.title)}`;
                window.open(downloadUrl, '_blank');
                setIsOpen(false);
              }}
              className="w-full px-3 py-2.5 flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors group"
            >
              <Download size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
              Download
            </button>
          )}
          
          {track.source === 'local' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to remove this local track?')) {
                  db.removeLocalTrack(track.id).then(() => {
                    window.location.reload();
                  });
                }
                setIsOpen(false);
              }}
              className="w-full px-3 py-2.5 flex items-center gap-3 text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
            >
              <Trash2 size={16} />
              Remove from Device
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          <div className="px-2 py-2 flex items-center justify-between text-white border-b border-white/[0.06] mb-1.5">
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowPlaylists(false); }}
                className="p-1 hover:bg-white/[0.06] rounded-md transition-colors"
              >
                <ChevronRight size={16} className="rotate-180" />
              </button>
              <span className="font-bold text-[13px] uppercase tracking-wider text-zinc-400">Add to playlist</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreateModalOpen(true);
                setIsOpen(false);
              }}
              className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              title="Create new playlist"
            >
              <PlusCircle size={16} />
            </button>
          </div>
          
          {playlists.length === 0 ? (
            <div className="px-4 py-4 text-zinc-500 text-[13px] font-medium text-center">
              No playlists found
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-0.5">
              {playlists.map(p => (
                <button
                  key={p.id}
                  className="w-full flex items-center px-3 py-2.5 hover:bg-white/[0.06] rounded-md transition-colors text-left text-zinc-300 hover:text-white group"
                  onClick={(e) => handleAction(e, () => addTrackToPlaylist(p.id, track))}
                >
                  <span className="truncate group-hover:translate-x-1 transition-transform">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={openMenu}
        className={buttonClassName}
      >
        <MoreVertical size={iconSize} />
      </button>

      {isOpen && createPortal(menuContent, document.body)}
      <CreatePlaylistModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={(name) => {
          const createPlaylist = useAudioStore.getState().createPlaylist;
          const addTrackToPlaylist = useAudioStore.getState().addTrackToPlaylist;
          const newId = createPlaylist(name);
          addTrackToPlaylist(newId, track);
        }}
      />
    </>
  );
}
