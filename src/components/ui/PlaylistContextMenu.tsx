import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Copy, Trash2 } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';
import type { Playlist } from '../../types';

interface PlaylistContextMenuProps {
  playlist: Playlist;
}

export function PlaylistContextMenu({ playlist }: PlaylistContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { deletePlaylist, clonePlaylist } = useAudioStore();

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ 
        top: rect.bottom + 5, 
        left: rect.left - 150
      });
    }
    setIsOpen(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
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
      style={{ top: menuPos.top, left: Math.max(10, menuPos.left) }} // Ensure it doesn't go offscreen on mobile
      className="fixed z-[100] w-48 glass-surface-elevated rounded-xl p-1.5 text-[14px] font-medium text-zinc-300 animate-fade-in"
    >
      <div className="flex flex-col gap-0.5">
        <button 
          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.06] rounded-md transition-colors group"
          onClick={(e) => handleAction(e, () => clonePlaylist(playlist.id))}
        >
          <Copy size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
          <span className="group-hover:text-white transition-colors">Clone Playlist</span>
        </button>

        <div className="h-px bg-white/[0.06] my-1 mx-2" />

        <button 
          className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-400/10 rounded-md transition-colors group"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
              deletePlaylist(playlist.id);
            }
            closeMenu();
          }}
        >
          <Trash2 size={16} />
          <span>Delete Playlist</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={openMenu}
        aria-label="Playlist options"
        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-full transition-all duration-150 opacity-0 group-hover:opacity-100 active:scale-[0.96]"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && createPortal(menuContent, document.body)}
    </>
  );
}
