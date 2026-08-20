import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Heart, PlusCircle, ListPlus, Share2, ChevronRight, Trash2, Download } from 'lucide-react';
import { db } from '../../lib/db';
import { useAudioStore } from '../../store/useAudioStore';
import type { Track } from '../../types';
import { CreatePlaylistModal } from './CreatePlaylistModal';

interface TrackContextMenuProps {
  track: Track;
}

export function TrackContextMenu({ track }: TrackContextMenuProps) {
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
      setMenuPos({ 
        top: rect.bottom + 5, 
        left: rect.left - 180 // Align right side roughly
      });
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
      className="fixed z-[100] w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-1 text-sm text-zinc-300 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {!showPlaylists ? (
        <>
          <button 
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors group"
            onClick={(e) => {
              e.stopPropagation();
              setShowPlaylists(true);
            }}
          >
            <div className="flex items-center gap-3">
              <PlusCircle size={16} className="text-zinc-400 group-hover:text-white" />
              <span className="group-hover:text-white">Add to playlist</span>
            </div>
            <ChevronRight size={16} className="text-zinc-500" />
          </button>

          <button 
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors group"
            onClick={(e) => handleAction(e, () => playNext(track))}
          >
            <ListPlus size={16} className="text-zinc-400 group-hover:text-white" />
            <span className="group-hover:text-white">Play Next</span>
          </button>

          <button 
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors group"
            onClick={(e) => handleAction(e, () => addToQueue(track))}
          >
            <ListPlus size={16} className="text-zinc-400 group-hover:text-white" />
            <span className="group-hover:text-white">Add to queue</span>
          </button>

          <button 
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors group"
            onClick={(e) => handleAction(e, () => toggleLikedSong(track))}
          >
            <Heart size={16} className={isLiked ? 'text-blue-500 fill-blue-500' : 'text-zinc-400 group-hover:text-white'} />
            <span className={isLiked ? 'text-blue-500' : 'group-hover:text-white'}>
              {isLiked ? 'Remove from Liked Songs' : 'Save to your Liked Songs'}
            </span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(`https://aura.app/track/${track.id}`);
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 flex items-center gap-3 text-sm text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Share2 size={16} />
            Share
          </button>
          
          {track.source !== 'local' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const downloadUrl = `/api/download/${track.id}?title=${encodeURIComponent(track.title)}`;
                window.open(downloadUrl, '_blank');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 flex items-center gap-3 text-sm text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Download size={16} />
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
              className="w-full px-4 py-2 flex items-center gap-3 text-sm text-red-400 hover:bg-white/10 transition-colors"
            >
              <Trash2 size={16} />
              Remove from Device
            </button>
          )}

        </>
      ) : (
        <>
          <div className="px-4 py-2 flex items-center justify-between text-white border-b border-white/10 mb-1">
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowPlaylists(false); }}
                className="p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronRight size={16} className="rotate-180" />
              </button>
              <span className="font-semibold text-sm">Add to playlist</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreateModalOpen(true);
                setIsOpen(false);
              }}
              className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="Create new playlist"
            >
              <PlusCircle size={16} />
            </button>
          </div>
          
          {playlists.length === 0 ? (
            <div className="px-4 py-3 text-zinc-500 italic text-center">
              No playlists found
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {playlists.map(p => (
                <button
                  key={p.id}
                  className="w-full flex items-center px-4 py-3 hover:bg-white/10 transition-colors text-left"
                  onClick={(e) => handleAction(e, () => addTrackToPlaylist(p.id, track))}
                >
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={openMenu}
        className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors md:opacity-0 group-hover:opacity-100"
      >
        <MoreVertical size={20} />
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
