import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Disc3, Clock, Heart, Library, Plus, Music2, ListMusic, Settings, Users } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';
import { CreatePlaylistModal } from '../ui/CreatePlaylistModal';
import { PlaylistContextMenu } from '../ui/PlaylistContextMenu';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  disabled?: boolean;
}

export function Sidebar() {
  const location = useLocation();
  const playlists = useAudioStore((state) => state.playlists);
  const setSettingsOpen = useAudioStore((state) => state.setSettingsOpen);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const [pillStyle, setPillStyle] = useState({ top: 0, height: 0, opacity: 0 });

  // Update floating pill position
  useEffect(() => {
    // Shorter delay for snappier feedback
    const timeout = setTimeout(() => {
      if (!navRef.current) return;
      const activeElement = navRef.current.querySelector('.nav-active-item') as HTMLElement;
      if (activeElement && navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const activeRect = activeElement.getBoundingClientRect();
        
        setPillStyle({
          top: activeRect.top - navRect.top + navRef.current.scrollTop,
          height: activeRect.height,
          opacity: 1
        });
      } else {
        setPillStyle(prev => ({ ...prev, opacity: 0 }));
      }
    }, 10);
    return () => clearTimeout(timeout);
  }, [location.pathname]);
  
  const discoverItems: NavItem[] = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/albums', icon: Users, label: 'Artist' },
    { to: '/library', icon: Search, label: 'Search' },
    { to: '/genres', icon: Disc3, label: 'Genres' },
  ];

  const libraryItems: NavItem[] = [
    { to: '/recent', icon: Clock, label: 'Recent' },
    { to: '/liked', icon: Heart, label: 'Liked songs' },
    { to: '/local', icon: Library, label: 'Library' },
  ];

  return (
    <aside className="w-[260px] glass-surface hidden md:flex flex-col h-full shrink-0 border-r border-white/[0.04] z-20 relative">
      {/* Logo */}
      <div className="px-7 pt-7 pb-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-transform duration-500 hover:scale-105">
          <Music2 size={18} className="text-white" />
        </div>
        <h1 className="text-lg font-black tracking-tight text-white">
          INISAI
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar pb-[120px] relative" ref={navRef}>
        
        {/* Floating Liquid Glass Pill */}
        <div 
          className="absolute top-0 left-3 right-3 liquid-glass-pill pointer-events-none z-0"
          style={{ 
            transform: `translateY(${pillStyle.top}px)`, 
            height: `${pillStyle.height}px`,
            opacity: pillStyle.opacity,
            transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease'
          }}
        />

        {/* DISCOVER */}
        <div className="pt-6 relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 px-4 mb-3">
            Discover
          </p>
          <div className="space-y-0.5">
            {discoverItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.disabled ? location.pathname : item.to}
                onClick={item.disabled ? (e) => e.preventDefault() : undefined}
                className={({ isActive }) => {
                  const active = !item.disabled && isActive;
                  return `group relative flex items-center gap-3.5 px-4 py-2.5 rounded-xl border text-[13px] font-medium transition-all duration-300 ${
                    active
                      ? 'nav-active-item border-transparent text-white font-semibold'
                      : item.disabled
                        ? 'border-transparent text-zinc-700 cursor-default'
                        : 'border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`;
                }}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={18} className={`transition-all duration-300 ${!item.disabled && isActive ? 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]' : 'text-zinc-600 group-hover:text-zinc-300'}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* LIBRARY */}
        <div className="mt-6 relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 px-4 mb-3">
            Library
          </p>
          <div className="space-y-0.5">
            {libraryItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.disabled ? location.pathname : item.to}
                onClick={item.disabled ? (e) => e.preventDefault() : undefined}
                className={({ isActive }) => {
                  const active = !item.disabled && isActive;
                  return `group relative flex items-center gap-3.5 px-4 py-2.5 rounded-xl border text-[13px] font-medium transition-all duration-300 ${
                    active
                      ? 'nav-active-item border-transparent text-white font-semibold'
                      : item.disabled
                        ? 'border-transparent text-zinc-700 cursor-default'
                        : 'border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`;
                }}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={18} className={`transition-all duration-300 ${!item.disabled && isActive ? 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]' : 'text-zinc-600 group-hover:text-zinc-300'}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* PLAYLISTS */}
        <div className="mt-6 relative z-10 flex-1 flex flex-col min-h-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 px-4 mb-3">
            Playlists
          </p>
          <div className="px-1 space-y-1">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] border-dashed text-[13px] font-medium text-zinc-500 hover:text-white hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 group"
            >
              <Plus size={16} className="text-zinc-600 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
              <span>New playlist</span>
            </button>
            
            {/* Render custom playlists */}
            <div className="space-y-0.5 mt-2">
              {playlists.map((playlist) => (
                <NavLink
                  key={playlist.id}
                  to={`/playlist/${playlist.id}`}
                  className={({ isActive }) => {
                  const active = isActive;
                  return `group relative flex items-center gap-3 px-4 py-2.5 rounded-xl border text-[13px] font-medium transition-all duration-300 ${
                    active
                      ? 'nav-active-item border-transparent text-white font-semibold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`;
                }}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex flex-1 items-center gap-3 min-w-0">
                      <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-400 group-hover:text-zinc-200 group-hover:bg-white/10'}`}>
                        <ListMusic size={12} />
                      </div>
                      <span className="truncate">{playlist.name}</span>
                    </div>
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <PlaylistContextMenu playlist={playlist} />
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
        </div>
      </nav>

      {/* FOOTER */}
      <div className="px-4 py-4 border-t border-white/[0.04] relative z-10 shrink-0">
        <button 
          onClick={() => setSettingsOpen(true)}
          className="group flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13px] font-medium text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] transition-all duration-300 w-full"
        >
          <Settings size={18} className="text-zinc-600 group-hover:text-zinc-300 transition-all duration-500 group-hover:rotate-90" />
          <span>Settings</span>
        </button>
      </div>

      <CreatePlaylistModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </aside>
  );
}
