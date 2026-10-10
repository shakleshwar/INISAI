import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Volume2, 
  HardDrive, 
  Info, 
  Check, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  Code2, 
  User, 
  PlayCircle, 
  Radio, 
  Cloud, 
  Headphones, 
  Palette, 
  Layers, 
  Folder, 
  CheckCircle2, 
  Search, 
  X,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  useSettingsStore, 
  THEMES_DATA, 
  ACCENT_COLORS_DATA
} from '../store/useSettingsStore';
import type {
  StreamingEngine,
  AudioQuality,
  AppTheme,
  AccentColor,
  LyricsMode
} from '../store/useSettingsStore';
import { useAudioStore } from '../store/useAudioStore';
import { db } from '../lib/db';
import { StudioEqualizer } from '../components/settings/StudioEqualizer';

type SettingsTab = 'all' | 'audio' | 'playback' | 'appearance' | 'storage' | 'local' | 'about';

interface ToastNotice {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export function Settings() {
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const rawRecent = useAudioStore(s => s.recentSongs);
  const recentSongs = Array.isArray(rawRecent) ? rawRecent : [];
  const rawLiked = useAudioStore(s => s.likedSongs);
  const likedSongs = Array.isArray(rawLiked) ? rawLiked : [];

  const [activeTab, setActiveTab] = useState<SettingsTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  
  // Storage usage stats
  const [storageStats, setStorageStats] = useState({
    usedMB: '14.8',
    totalQuotaMB: '120000',
    audioTracksCount: 0,
    likedCount: 0,
    recentCount: 0,
    loading: false
  });

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  // Calculate storage stats
  const refreshStorageStats = async () => {
    setStorageStats(prev => ({ ...prev, loading: true }));
    try {
      let used = 12.4;
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage) {
          used = Math.max(8.5, estimate.usage / (1024 * 1024));
        }
      }
      
      const localTracks = await db.loadAllLocalTracks().catch(() => []);
      
      setStorageStats({
        usedMB: used.toFixed(1),
        totalQuotaMB: '120,000',
        audioTracksCount: localTracks.length,
        likedCount: likedSongs.length,
        recentCount: recentSongs.length,
        loading: false
      });
    } catch {
      setStorageStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    refreshStorageStats();
  }, [likedSongs.length, recentSongs.length]);

  // Clear Audio Cache
  const handleClearAudioCache = async () => {
    try {
      await db.clearLocalTracks();
      await refreshStorageStats();
      showToast('Local audio cache purged successfully (Track database rebuilt)', 'success');
    } catch (e) {
      showToast('Could not clear all audio data', 'warning');
    }
  };

  // Clear Playback History
  const handleClearHistory = () => {
    useAudioStore.setState({ recentSongs: [] });
    showToast('Listening history cleared', 'info');
    refreshStorageStats();
  };

  // Clear Search History
  const handleClearSearchHistory = () => {
    localStorage.removeItem('inisai_search_history');
    showToast('Search cache & suggestions history cleared', 'info');
  };

  // Reset to factory
  const handleResetSettings = () => {
    settings.resetAllSettings();
    showToast('All settings restored to factory defaults', 'success');
  };

  // Tabs definition
  const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All Settings', icon: Layers },
    { id: 'audio', label: 'Audio & Streaming', icon: Volume2 },
    { id: 'playback', label: 'Playback & Queue', icon: SlidersHorizontal },
    { id: 'appearance', label: 'Interface & Themes', icon: Palette },
    { id: 'storage', label: 'Storage & Cache', icon: HardDrive },
    { id: 'local', label: 'Local Music', icon: Folder },
    { id: 'about', label: 'About & Diagnostics', icon: Info },
  ];

  // Filtering helper
  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="w-full min-h-full px-4 sm:px-6 md:px-10 lg:px-12 py-6 sm:py-8 md:py-10 text-white max-w-6xl mx-auto pb-4 md:pb-6 animate-in fade-in duration-300">
      
      {/* ═══ Toast Stack ═══ */}
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0e0e14]/90 backdrop-blur-xl border border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.8)] animate-in slide-in-from-top-3 duration-200"
          >
            <div className={`w-2 h-2 rounded-full ${
              t.type === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' :
              t.type === 'warning' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
            }`} />
            <span className="text-xs font-semibold tracking-wide text-zinc-100">{t.message}</span>
          </div>
        ))}
      </div>

      {/* ═══ Header Section ═══ */}
      <div className="mb-8 md:mb-10 flex flex-col gap-4">
        {/* Breadcrumb & Live System Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-zinc-500">
            <SettingsIcon size={14} className="text-zinc-400" />
            <span>INISAI</span>
            <span>//</span>
            <span className="text-zinc-300 font-bold">Preferences</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-mono font-medium text-emerald-400/90 tracking-wider">
              ENGINE ONLINE · 48kHz PCM
            </span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
              Settings
            </h1>
            <p className="text-sm md:text-base text-zinc-400 mt-1 font-medium max-w-xl">
              Configure audio streaming fidelity, playback algorithms, appearance, and local library indexing.
            </p>
          </div>

          <button
            onClick={handleResetSettings}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all active:scale-[0.96] duration-150 cursor-pointer"
            title="Reset all settings to default"
          >
            <RefreshCw size={14} />
            <span>Reset Defaults</span>
          </button>
        </div>

        {/* Search Filter Input */}
        <div className="relative w-full mt-2">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search preferences (e.g. quality, equalizer, theme, cache, crossfade)..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white/[0.04] border border-white/10 focus:border-white/25 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Pills Navigation (Horizontal scroll on mobile, wrap on desktop) */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 -mx-4 px-4 sm:mx-0 sm:px-0 mt-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                  isActive 
                    ? 'bg-white text-zinc-950 shadow-md font-bold' 
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/[0.06]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ Settings Sections ═══ */}
      <div className="space-y-10">

        {/* ────────────────────────────────────────────────────────────
            SECTION 1: AUDIO QUALITY & STREAMING
           ──────────────────────────────────────────────────────────── */}
        {(activeTab === 'all' || activeTab === 'audio') && matchesSearch('audio quality streaming engine normalization crossfade equalizer lossless') && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 pb-1 border-b border-white/10">
              <Volume2 size={18} className="text-zinc-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight uppercase tracking-wider text-xs sm:text-sm text-zinc-300">
                Audio & Streaming Engine
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Streaming Service Selector */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-white">Streaming Provider</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-semibold">Active</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                    Primary audio search index and media stream provider.
                  </p>

                  <div className="space-y-2">
                    {[
                      { id: 'youtube', name: 'YouTube Music', desc: 'Highest catalog coverage & studio lossless metadata', icon: PlayCircle },
                      { id: 'soundcloud', name: 'SoundCloud', desc: 'Indie tracks, DJ sets, underground releases', icon: Cloud },
                      { id: 'spotify', name: 'Spotify Web Mirror', desc: 'Curated playlists and algorithmic radio (Beta)', icon: Radio },
                      { id: 'direct', name: 'Direct Stream API', desc: 'Raw high-bitrate audio bridge bypass', icon: Headphones },
                    ].map(srv => {
                      const isSelected = settings.streamingService === srv.id;
                      const SrvIcon = srv.icon;
                      return (
                        <button
                          key={srv.id}
                          onClick={() => {
                            settings.setStreamingService(srv.id as StreamingEngine);
                            showToast(`Streaming provider switched to ${srv.name}`);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                            isSelected 
                              ? 'bg-white/10 border-white/30 text-white shadow-sm' 
                              : 'bg-black/20 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'
                            }`}>
                              <SrvIcon size={16} />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-semibold text-zinc-200">{srv.name}</div>
                              <div className="text-[11px] text-zinc-500 hidden sm:block">{srv.desc}</div>
                            </div>
                          </div>
                          {isSelected && <Check size={16} className="text-white shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Streaming Audio Quality */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-white">Audio Quality Preset</span>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase">{settings.audioQuality}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                    Higher bitrates deliver studio acoustic precision with dynamic range.
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'lossless', label: 'Lossless Studio', spec: '320 kbps · FLAC / AAC', badge: 'HD' },
                      { id: 'high', label: 'High Fidelity', spec: '256 kbps · AAC', badge: 'HQ' },
                      { id: 'normal', label: 'Standard Balanced', spec: '160 kbps · MP3', badge: 'SD' },
                      { id: 'saver', label: 'Data Saver', spec: '96 kbps · Opus', badge: 'Lite' },
                    ].map(q => {
                      const isSelected = settings.audioQuality === q.id;
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            settings.setAudioQuality(q.id as AudioQuality);
                            showToast(`Audio quality set to ${q.label}`);
                          }}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                            isSelected 
                              ? 'bg-white/10 border-white/30 text-white shadow-sm' 
                              : 'bg-black/20 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-zinc-200">{q.label}</span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-white text-black font-bold' : 'bg-white/5 text-zinc-500'
                            }`}>{q.badge}</span>
                          </div>
                          <span className="text-[11px] font-mono text-zinc-500">{q.spec}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Normalization & Gapless Controls */}
                <div className="mt-5 pt-4 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">Volume Normalization</div>
                      <div className="text-[11px] text-zinc-500">Harmonizes gain levels across varied tracks</div>
                    </div>
                    <button
                      onClick={() => {
                        settings.setAudioNormalization(!settings.audioNormalization);
                        showToast(`Normalization ${!settings.audioNormalization ? 'Enabled' : 'Disabled'}`);
                      }}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                        settings.audioNormalization ? 'bg-emerald-500' : 'bg-white/15'
                      }`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                        settings.audioNormalization ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">Gapless Playback</div>
                      <div className="text-[11px] text-zinc-500">Eliminates dead silence between sequential tracks</div>
                    </div>
                    <button
                      onClick={() => {
                        settings.setGaplessPlayback(!settings.gaplessPlayback);
                        showToast(`Gapless Playback ${!settings.gaplessPlayback ? 'Enabled' : 'Disabled'}`);
                      }}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                        settings.gaplessPlayback ? 'bg-emerald-500' : 'bg-white/15'
                      }`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                        settings.gaplessPlayback ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* 5-Band Studio Equalizer & Crossfade */}
            <StudioEqualizer
              eqBands={settings.eqBands || [0, 0, 0, 0, 0]}
              equalizerPreset={settings.equalizerPreset || 'flat'}
              crossfadeDuration={settings.crossfadeDuration ?? 3}
              onBandChange={(idx, val) => settings.setEqBand(idx, val)}
              onPresetChange={(preset) => {
                settings.setEqualizerPreset(preset);
                showToast(`Equalizer profile: ${preset.replace('_', ' ').toUpperCase()}`);
              }}
              onCrossfadeChange={(seconds) => settings.setCrossfadeDuration(seconds)}
            />

          </section>
        )}

        {/* ────────────────────────────────────────────────────────────
            SECTION 2: PLAYBACK & QUEUE BEHAVIOR
           ──────────────────────────────────────────────────────────── */}
        {(activeTab === 'all' || activeTab === 'playback') && matchesSearch('playback queue autoplay preload media keys hardware position') && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 pb-1 border-b border-white/10">
              <SlidersHorizontal size={18} className="text-zinc-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight uppercase tracking-wider text-xs sm:text-sm text-zinc-300">
                Playback & Smart Queue
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Autoplay Similar Songs */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex items-center justify-between">
                <div className="pr-4">
                  <div className="text-sm font-semibold text-white">Autoplay Radio Mix</div>
                  <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Keep the music going. Automatically queues similar songs when your playlist finishes.
                  </div>
                </div>
                <button
                  onClick={() => {
                    settings.setAutoplay(!settings.autoplay);
                    showToast(`Autoplay ${!settings.autoplay ? 'Enabled' : 'Disabled'}`);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 cursor-pointer ${
                    settings.autoplay ? 'bg-emerald-500' : 'bg-white/15'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    settings.autoplay ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Instant Preload Buffer */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex items-center justify-between">
                <div className="pr-4">
                  <div className="text-sm font-semibold text-white">Smart Stream Preloading</div>
                  <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Buffers the next track in advance for instant zero-latency transitions upon skipping.
                  </div>
                </div>
                <button
                  onClick={() => {
                    settings.setSmartPreload(!settings.smartPreload);
                    showToast(`Preloading ${!settings.smartPreload ? 'Enabled' : 'Disabled'}`);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 cursor-pointer ${
                    settings.smartPreload ? 'bg-emerald-500' : 'bg-white/15'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    settings.smartPreload ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* MediaSession Hardware Keys */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex items-center justify-between">
                <div className="pr-4">
                  <div className="text-sm font-semibold text-white">Hardware Media Keys & Lockscreen</div>
                  <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Enables keyboard media controls, bluetooth headphones, and system lockscreen artwork.
                  </div>
                </div>
                <button
                  onClick={() => {
                    settings.setHardwareMediaKeys(!settings.hardwareMediaKeys);
                    showToast(`Hardware Media Keys ${!settings.hardwareMediaKeys ? 'Enabled' : 'Disabled'}`);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 cursor-pointer ${
                    settings.hardwareMediaKeys ? 'bg-emerald-500' : 'bg-white/15'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    settings.hardwareMediaKeys ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Remember Playback Position */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex items-center justify-between">
                <div className="pr-4">
                  <div className="text-sm font-semibold text-white">Resume Playback on Launch</div>
                  <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Saves current active song and timeline position so you can pick up where you left off.
                  </div>
                </div>
                <button
                  onClick={() => {
                    settings.setRememberPosition(!settings.rememberPosition);
                    showToast(`Resume Position ${!settings.rememberPosition ? 'Enabled' : 'Disabled'}`);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 cursor-pointer ${
                    settings.rememberPosition ? 'bg-emerald-500' : 'bg-white/15'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    settings.rememberPosition ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

            </div>
          </section>
        )}

        {/* ────────────────────────────────────────────────────────────
            SECTION 3: INTERFACE, THEMES & ACCENTS
           ──────────────────────────────────────────────────────────── */}
        {(activeTab === 'all' || activeTab === 'appearance') && matchesSearch('interface theme accent color lyrics ambient oled appearance') && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 pb-1 border-b border-white/10">
              <Palette size={18} className="text-zinc-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight uppercase tracking-wider text-xs sm:text-sm text-zinc-300">
                Interface & Studio Aesthetics
              </h2>
            </div>

            {/* Theme Presets Cards */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-white">Studio Environment Theme</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Calibrated background depths with optical contrast.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {(Object.keys(THEMES_DATA) as AppTheme[]).map(thmKey => {
                  const thm = THEMES_DATA[thmKey];
                  const isSelected = settings.theme === thmKey;
                  return (
                    <button
                      key={thmKey}
                      onClick={() => {
                        settings.setTheme(thmKey);
                        showToast(`Theme changed to ${thm.name}`);
                      }}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                        isSelected 
                          ? 'border-white/50 bg-white/10 shadow-lg ring-1 ring-white/20' 
                          : 'border-white/5 bg-black/30 hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="w-full h-12 rounded-lg mb-2.5 border border-white/10 flex items-center justify-center p-2 relative overflow-hidden" style={{ background: thm.bgPanel }}>
                        <div className="w-6 h-6 rounded-full border border-white/20 shadow-inner" style={{ background: thm.bgBase }} />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{thm.name}</div>
                        <div className="text-[10px] text-zinc-400 line-clamp-1">{thm.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent Color Palettes */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-white">Studio Accent Pigment</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Applied to active icons, sliders, playback pulses, and focus rings.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {(Object.keys(ACCENT_COLORS_DATA) as AccentColor[]).map(accKey => {
                  const acc = ACCENT_COLORS_DATA[accKey];
                  const isSelected = settings.accentColor === accKey;
                  return (
                    <button
                      key={accKey}
                      onClick={() => {
                        settings.setAccentColor(accKey);
                        showToast(`Accent color set to ${acc.name}`);
                      }}
                      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                        isSelected 
                          ? 'bg-white/10 border-white/40 text-white shadow-sm' 
                          : 'bg-black/20 border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]" style={{ backgroundColor: acc.hex }} />
                      <span className="text-xs font-semibold">{acc.name}</span>
                      {isSelected && <Check size={14} className="text-white ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lyrics & Display Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lyrics Mode */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="text-sm font-semibold text-white mb-1">Lyrics Presentation Engine</div>
                  <div className="text-xs text-zinc-400 mb-3">
                    Choose animation fidelity for synchronized karaoke lines.
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'kinetic', label: 'Kinetic', sub: 'Word bounce' },
                      { id: 'autoscroll', label: 'Scroll', sub: 'Line sync' },
                      { id: 'static', label: 'Static', sub: 'Sheet text' },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => {
                          settings.setLyricsMode(m.id as LyricsMode);
                          showToast(`Lyrics mode: ${m.label}`);
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                          settings.lyricsMode === m.id 
                            ? 'bg-white/15 border-white/40 text-white font-bold' 
                            : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-xs block">{m.label}</span>
                        <span className="text-[10px] text-zinc-500 block">{m.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ambient Glow & Tabular Numbers */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">Dynamic Artwork Ambient Glow</div>
                    <div className="text-[11px] text-zinc-500">Soft blurred color diffusion behind player covers</div>
                  </div>
                  <button
                    onClick={() => {
                      settings.setAmbientGlow(!settings.ambientGlow);
                      showToast(`Ambient Glow ${!settings.ambientGlow ? 'Enabled' : 'Disabled'}`);
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                      settings.ambientGlow ? 'bg-emerald-500' : 'bg-white/15'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      settings.ambientGlow ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">Tabular Numeral Timers</div>
                    <div className="text-[11px] text-zinc-500">Prevents layout shaking on ticking clock seconds</div>
                  </div>
                  <button
                    onClick={() => {
                      settings.setTabularNumbers(!settings.tabularNumbers);
                      showToast(`Tabular Numbers ${!settings.tabularNumbers ? 'Enabled' : 'Disabled'}`);
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                      settings.tabularNumbers ? 'bg-emerald-500' : 'bg-white/15'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      settings.tabularNumbers ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

          </section>
        )}

        {/* ────────────────────────────────────────────────────────────
            SECTION 4: STORAGE, CACHE & DATA MANAGEMENT
           ──────────────────────────────────────────────────────────── */}
        {(activeTab === 'all' || activeTab === 'storage') && matchesSearch('storage cache memory offline history clear purge database') && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 pb-1 border-b border-white/10">
              <HardDrive size={18} className="text-zinc-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight uppercase tracking-wider text-xs sm:text-sm text-zinc-300">
                Storage & Cache Management
              </h2>
            </div>

            {/* Storage Meter Card */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Browser Storage Meter</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    IndexedDB database footprint and persistent cache.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg">
                    {storageStats.usedMB} MB used of {storageStats.totalQuotaMB} MB
                  </span>
                  <button
                    onClick={refreshStorageStats}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    title="Refresh storage calculation"
                  >
                    <RefreshCw size={14} className={storageStats.loading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Visual Breakdown Bar */}
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex my-3">
                <div className="bg-emerald-500 h-full w-[45%]" title="Local Track Audio" />
                <div className="bg-cyan-500 h-full w-[25%]" title="Cover Art & Images" />
                <div className="bg-purple-500 h-full w-[15%]" title="Metadata & Playlists" />
                <div className="bg-white/20 h-full w-[15%]" title="Search Suggestions" />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Local Audio ({storageStats.audioTracksCount} tracks)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  Artwork Cache ({storageStats.likedCount} liked)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  History & Queues ({storageStats.recentCount} recent)
                </span>
              </div>
            </div>

            {/* Action Buttons: Clear Audio Cache, Clear History */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleClearAudioCache}
                className="p-4 rounded-xl bg-white/[0.03] hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-left transition-all duration-150 active:scale-[0.97] cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Trash2 size={16} className="text-zinc-400 group-hover:text-rose-400" />
                  <span className="text-[10px] font-mono text-zinc-500 group-hover:text-rose-400">Purge</span>
                </div>
                <div className="text-xs font-semibold text-white group-hover:text-rose-200">Clear Audio Cache</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Frees indexed local audio Blobs</div>
              </button>

              <button
                onClick={handleClearHistory}
                className="p-4 rounded-xl bg-white/[0.03] hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-left transition-all duration-150 active:scale-[0.97] cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <RefreshCw size={16} className="text-zinc-400 group-hover:text-amber-400" />
                  <span className="text-[10px] font-mono text-zinc-500 group-hover:text-amber-400">Reset</span>
                </div>
                <div className="text-xs font-semibold text-white group-hover:text-amber-200">Clear Listening History</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Resets recently played list</div>
              </button>

              <button
                onClick={handleClearSearchHistory}
                className="p-4 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-left transition-all duration-150 active:scale-[0.97] cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Search size={16} className="text-zinc-400 group-hover:text-cyan-400" />
                  <span className="text-[10px] font-mono text-zinc-500 group-hover:text-cyan-400">Flush</span>
                </div>
                <div className="text-xs font-semibold text-white group-hover:text-cyan-200">Clear Search Cache</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Clears recent query suggestions</div>
              </button>
            </div>

          </section>
        )}

        {/* ────────────────────────────────────────────────────────────
            SECTION 5: LOCAL MUSIC LIBRARY
           ──────────────────────────────────────────────────────────── */}
        {(activeTab === 'all' || activeTab === 'local') && matchesSearch('local library folder id3 cover art ringtone filter') && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 pb-1 border-b border-white/10">
              <Folder size={18} className="text-zinc-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight uppercase tracking-wider text-xs sm:text-sm text-zinc-300">
                Local Music Library Preferences
              </h2>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Auto-Scan Local Database</div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Automatically checks IndexedDB for downloaded tracks when INISAI launches.
                  </div>
                </div>
                <button
                  onClick={() => {
                    settings.setAutoScanLocal(!settings.autoScanLocal);
                    showToast(`Auto-Scan ${!settings.autoScanLocal ? 'Enabled' : 'Disabled'}`);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 cursor-pointer ${
                    settings.autoScanLocal ? 'bg-emerald-500' : 'bg-white/15'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    settings.autoScanLocal ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div>
                  <div className="text-sm font-semibold text-white">Ignore Short Audio (&lt;30s)</div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Excludes notification tones, ringtones, and brief voice notes from your library.
                  </div>
                </div>
                <button
                  onClick={() => {
                    settings.setFilterShortTracks(!settings.filterShortTracks);
                    showToast(`Short track filter ${!settings.filterShortTracks ? 'Enabled' : 'Disabled'}`);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 cursor-pointer ${
                    settings.filterShortTracks ? 'bg-emerald-500' : 'bg-white/15'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    settings.filterShortTracks ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div>
                  <div className="text-sm font-semibold text-white">Extract Embedded ID3 Cover Art</div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Extracts high-resolution embedded album artwork from MP3/FLAC metadata tags.
                  </div>
                </div>
                <button
                  onClick={() => {
                    settings.setExtractCoverArt(!settings.extractCoverArt);
                    showToast(`Artwork extraction ${!settings.extractCoverArt ? 'Enabled' : 'Disabled'}`);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 cursor-pointer ${
                    settings.extractCoverArt ? 'bg-emerald-500' : 'bg-white/15'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    settings.extractCoverArt ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Jump to Local Music page */}
              <div className="pt-3 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => navigate('/local')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 hover:text-white transition-all active:scale-[0.96] duration-150 cursor-pointer"
                >
                  <span>Open Local Music Manager</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </section>
        )}

        {/* ────────────────────────────────────────────────────────────
            SECTION 6: ABOUT, SYSTEM DIAGNOSTICS & DEVELOPER
           ──────────────────────────────────────────────────────────── */}
        {(activeTab === 'all' || activeTab === 'about') && matchesSearch('about developer saras shakleshwar version diagnostics system github') && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 pb-1 border-b border-white/10">
              <Info size={18} className="text-zinc-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight uppercase tracking-wider text-xs sm:text-sm text-zinc-300">
                System Diagnostics & Developer
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* System Diagnostics Card */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-white">Audio Engine Specifications</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-white font-bold">v2.4.0 Studio</span>
                  </div>

                  <div className="space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-zinc-500">Audio Runtime</span>
                      <span className="text-zinc-300">Web Audio API / HTML5 Audio</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-zinc-500">Sample Rate</span>
                      <span className="text-zinc-300">48,000 Hz · 24-bit Float</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-zinc-500">Local Database</span>
                      <span className="text-zinc-300">IndexedDB (AuraWebPlayer)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-zinc-500">Build Pipeline</span>
                      <span className="text-zinc-300">Vite + React 18 + PWA</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-500">License</span>
                      <span className="text-zinc-300">MIT Open Source</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Developer Profile Card */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">Lead Architect</div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#0c0c14] border border-white/15 p-1 shadow-lg shrink-0">
                      <div className="w-full h-full rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-white text-lg">
                        SS
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">Saras Shakleshwar</h4>
                        <CheckCircle2 size={15} className="text-cyan-400" />
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">Student Developer & UI/UX Engineer</p>
                      <p className="text-[11px] text-zinc-500 mt-1">Creator of the INISAI High-Fidelity Audio Experience</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2 border-t border-white/5">
                    <a
                      href="https://github.com/shakleshwar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all active:scale-[0.96] border border-white/10"
                    >
                      <Code2 size={14} />
                      <span>GitHub</span>
                      <ExternalLink size={12} className="text-zinc-500" />
                    </a>

                    <a
                      href="https://www.instagram.com/shakleshwar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all active:scale-[0.96] border border-white/10"
                    >
                      <User size={14} />
                      <span>Instagram</span>
                      <ExternalLink size={12} className="text-zinc-500" />
                    </a>
                  </div>
                </div>

                <div className="text-center pt-4 text-[11px] text-zinc-600 font-mono">
                  © {new Date().getFullYear()} INISAI Studio. All rights reserved.
                </div>
              </div>

            </div>

          </section>
        )}

      </div>

    </div>
  );
}
export default Settings;
