import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Disc3, LayoutGrid, Clock, Heart, HardDrive, Plus, Music2, ArrowLeft, ListMusic, Settings } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';
import { CreatePlaylistModal } from '../ui/CreatePlaylistModal';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  disabled?: boolean;
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const playlists = useAudioStore((state) => state.playlists);
  const setSettingsOpen = useAudioStore((state) => state.setSettingsOpen);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const discoverItems: NavItem[] = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/library', icon: Search, label: 'Search' },
    { to: '/genres', icon: Disc3, label: 'Genres' },
    { to: '/albums', icon: LayoutGrid, label: 'Albums' },
  ];

  const libraryItems: NavItem[] = [
    { to: '/recent', icon: Clock, label: 'Recent' },
    { to: '/liked', icon: Heart, label: 'Liked songs' },
    { to: '/local', icon: HardDrive, label: 'Local' },
  ];

  return (
    <aside className="w-[260px] bg-[#050505] hidden md:flex flex-col h-full shrink-0 border-r border-white/[0.05] shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-20 relative">
      {/* Logo */}
      <div className="p-8 pb-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          <Music2 size={20} className="text-white" />
        </div>
        <h1 className="text-xl font-black tracking-tight text-white">
          INISAI
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar pb-6">
        
        {/* DISCOVER */}
        <div>
          {location.pathname !== '/' && (
            <div className="px-4 mb-6">
              <button 
                onClick={() => navigate(-1)}
                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all backdrop-blur-md cursor-pointer"
              >
                <ArrowLeft size={16} className="text-zinc-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                <span className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">Back</span>
              </button>
            </div>
          )}

          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 px-4 mb-4">
            Discover
          </p>
          <div className="space-y-1">
            {discoverItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.disabled ? location.pathname : item.to}
                onClick={item.disabled ? (e) => e.preventDefault() : undefined}
                className={({ isActive }) => {
                  const active = !item.disabled && isActive;
                  return `group relative flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                    active
                      ? 'bg-gradient-to-r from-blue-500/20 to-transparent text-white font-bold shadow-[inset_4px_0_0_#3B82F6]'
                      : item.disabled
                        ? 'text-zinc-600 cursor-default'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                  }`;
                }}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} className={!item.disabled && isActive ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'text-zinc-500 group-hover:text-zinc-300 transition-colors'} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* LIBRARY */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 px-4 mb-4">
            Library
          </p>
          <div className="space-y-1">
            {libraryItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.disabled ? location.pathname : item.to}
                onClick={item.disabled ? (e) => e.preventDefault() : undefined}
                className={({ isActive }) => {
                  const active = !item.disabled && isActive;
                  return `group relative flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                    active
                      ? 'bg-gradient-to-r from-blue-500/20 to-transparent text-white font-bold shadow-[inset_4px_0_0_#3B82F6]'
                      : item.disabled
                        ? 'text-zinc-600 cursor-default'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                  }`;
                }}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} className={!item.disabled && isActive ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'text-zinc-500 group-hover:text-zinc-300 transition-colors'} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* YOUR PLAYLIST */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 px-4 mb-4">
            Your Playlist
          </p>
          <div className="px-4 space-y-2">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="uiverse-btn-glow w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#050505] text-sm font-bold text-white transition-all group overflow-hidden mb-4"
            >
              <Plus size={18} className="text-white group-hover:rotate-90 transition-transform duration-300" />
              <span>Create playlist</span>
            </button>
            
            {/* Render custom playlists */}
            <div className="space-y-1">
              {playlists.map((playlist) => (
                <NavLink
                  key={playlist.id}
                  to={`/playlist/${playlist.id}`}
                  className={({ isActive }) => 
                    `group flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-500/20 to-transparent text-white font-bold shadow-[inset_4px_0_0_#3B82F6]'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <ListMusic size={20} className={isActive ? 'text-blue-500' : 'text-zinc-500 group-hover:text-zinc-300 transition-colors'} />
                      <span className="truncate">{playlist.name}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Settings Bottom Button */}
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={() => setSettingsOpen(true)}
          className="group flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-all duration-300 w-full"
        >
          <Settings size={20} className="text-zinc-500 group-hover:text-zinc-300 transition-colors group-hover:rotate-45" />
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
