import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Disc3, Clock, Heart, Library, Plus, Music2, ListMusic, Settings, Users } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';
import { CreatePlaylistModal } from '../ui/CreatePlaylistModal';
import { PlaylistContextMenu } from '../ui/PlaylistContextMenu';
import { motion } from 'framer-motion';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  disabled?: boolean;
}

export function Sidebar() {
  const location = useLocation();
  const playlists = useAudioStore((state) => state.playlists);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  const renderNavItem = (item: NavItem) => (
    <NavLink
      key={item.label}
      to={item.disabled ? location.pathname : item.to}
      onClick={item.disabled ? (e) => e.preventDefault() : undefined}
      className="group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors active:scale-[0.98] duration-150"
    >
      {({ isActive }) => {
        const active = !item.disabled && isActive;
        return (
          <>
            {active && (
              <motion.div
                layoutId="sidebar-active-pill"
                className="absolute inset-0 bg-white/10 rounded-xl"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <item.icon size={18} className={`relative z-10 transition-colors ${active ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
            <span className={`relative z-10 ${active ? 'text-white font-semibold' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{item.label}</span>
          </>
        );
      }}
    </NavLink>
  );

  return (
    <aside className="w-64 bg-[var(--color-bg-panel)] hidden md:flex flex-col h-full shrink-0 border-r border-white/5 z-20 relative pb-24">
      {/* Logo */}
      <div className="px-6 pt-8 pb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner transition-transform duration-200 hover:scale-105 active:scale-[0.96] cursor-pointer">
          <Music2 size={20} className="text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          INISAI
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar pb-32 relative space-y-8">
        
        {/* DISCOVER */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 px-4 mb-3">
            Discover
          </p>
          <div className="space-y-1">
            {discoverItems.map(renderNavItem)}
          </div>
        </div>

        {/* LIBRARY */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 px-4 mb-3">
            Library
          </p>
          <div className="space-y-1">
            {libraryItems.map(renderNavItem)}
          </div>
        </div>

        {/* PLAYLISTS */}
        <div className="flex-1 flex flex-col min-h-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 px-4 mb-3">
            Playlists
          </p>
          <div className="space-y-1">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 border-dashed text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.97] duration-150 group cursor-pointer"
            >
              <Plus size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
              <span>New playlist</span>
            </button>
            
            {/* Render custom playlists */}
            <div className="space-y-1 mt-4">
              {playlists.map((playlist) => (
                <NavLink
                  key={playlist.id}
                  to={`/playlist/${playlist.id}`}
                  className="group relative flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-colors active:scale-[0.98] duration-150"
                >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 bg-white/10 rounded-xl"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className="flex flex-1 items-center gap-3 min-w-0 relative z-10">
                      <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-400 group-hover:text-zinc-200 group-hover:bg-white/10'}`}>
                        <ListMusic size={12} />
                      </div>
                      <span className={`truncate ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{playlist.name}</span>
                    </div>
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity relative z-10" onClick={e => e.stopPropagation()}>
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
      <div className="px-4 py-4 border-t border-white/5 relative z-10 shrink-0 bg-[var(--color-bg-panel)]">
        <NavLink 
          to="/settings"
          className="group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] duration-150 w-full cursor-pointer"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="sidebar-settings-pill"
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Settings size={18} className={`relative z-10 transition-transform duration-300 group-hover:rotate-45 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              <span className={`relative z-10 ${isActive ? 'text-white font-semibold' : 'text-zinc-500 group-hover:text-zinc-300'}`}>Settings</span>
            </>
          )}
        </NavLink>
      </div>

      <CreatePlaylistModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </aside>
  );
}
