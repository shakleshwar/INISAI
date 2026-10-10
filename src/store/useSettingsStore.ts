import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StreamingEngine = 'youtube' | 'soundcloud' | 'spotify' | 'direct';
export type AudioQuality = 'lossless' | 'high' | 'normal' | 'saver';
export type EqPreset = 'flat' | 'bass_boost' | 'vocal_boost' | 'electronic' | 'treble_boost' | 'acoustic' | 'rock';
export type AppTheme = 'obsidian' | 'midnight' | 'cyber' | 'amethyst' | 'oled';
export type AccentColor = 'crimson' | 'cyan' | 'emerald' | 'purple' | 'amber';
export type LyricsMode = 'kinetic' | 'autoscroll' | 'static';

export interface SettingsState {
  // Audio & Streaming
  streamingService: StreamingEngine;
  audioQuality: AudioQuality;
  audioNormalization: boolean;
  crossfadeDuration: number; // 0 to 12s
  gaplessPlayback: boolean;
  equalizerPreset: EqPreset;
  eqBands: [number, number, number, number, number]; // 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz (-12 to +12 dB)

  // Playback & Queue
  autoplay: boolean;
  smartPreload: boolean;
  hardwareMediaKeys: boolean;
  rememberPosition: boolean;

  // Appearance & Theme
  theme: AppTheme;
  accentColor: AccentColor;
  lyricsMode: LyricsMode;
  ambientGlow: boolean;
  tabularNumbers: boolean;

  // Local Library
  autoScanLocal: boolean;
  filterShortTracks: boolean;
  extractCoverArt: boolean;

  // Setters
  setStreamingService: (service: StreamingEngine) => void;
  setAudioQuality: (quality: AudioQuality) => void;
  setAudioNormalization: (enabled: boolean) => void;
  setCrossfadeDuration: (seconds: number) => void;
  setGaplessPlayback: (enabled: boolean) => void;
  setEqualizerPreset: (preset: EqPreset) => void;
  setEqBand: (index: number, val: number) => void;
  setAutoplay: (enabled: boolean) => void;
  setSmartPreload: (enabled: boolean) => void;
  setHardwareMediaKeys: (enabled: boolean) => void;
  setRememberPosition: (enabled: boolean) => void;
  setTheme: (theme: AppTheme) => void;
  setAccentColor: (color: AccentColor) => void;
  setLyricsMode: (mode: LyricsMode) => void;
  setAmbientGlow: (enabled: boolean) => void;
  setTabularNumbers: (enabled: boolean) => void;
  setAutoScanLocal: (enabled: boolean) => void;
  setFilterShortTracks: (enabled: boolean) => void;
  setExtractCoverArt: (enabled: boolean) => void;
  resetAllSettings: () => void;
}

export const EQ_PRESETS_DATA: Record<EqPreset, [number, number, number, number, number]> = {
  flat: [0, 0, 0, 0, 0],
  bass_boost: [6, 4, 1, 0, -1],
  vocal_boost: [-2, 1, 4, 3, 0],
  electronic: [5, 3, -1, 2, 4],
  treble_boost: [-1, 0, 1, 4, 6],
  acoustic: [3, 2, 0, 2, 3],
  rock: [5, 2, -1, 3, 5],
};

export const ACCENT_COLORS_DATA: Record<AccentColor, { hex: string; name: string; rgb: string }> = {
  crimson: { hex: '#ff3366', name: 'Cyber Crimson', rgb: '255, 51, 102' },
  cyan: { hex: '#00f2fe', name: 'Electric Cyan', rgb: '0, 242, 254' },
  emerald: { hex: '#10b981', name: 'Neon Emerald', rgb: '16, 185, 129' },
  purple: { hex: '#a855f7', name: 'Royal Amethyst', rgb: '168, 85, 247' },
  amber: { hex: '#f59e0b', name: 'Solar Amber', rgb: '245, 158, 11' },
};

export const THEMES_DATA: Record<AppTheme, { name: string; desc: string; bgBase: string; bgPanel: string }> = {
  obsidian: { name: 'Obsidian Studio', desc: 'Precision dark studio environment', bgBase: '#000000', bgPanel: '#08080a' },
  midnight: { name: 'Midnight Sapphire', desc: 'Deep cosmic cobalt hues', bgBase: '#040711', bgPanel: '#090e1e' },
  cyber: { name: 'Cyber Matrix', desc: 'Futuristic dark emerald tones', bgBase: '#020a06', bgPanel: '#06140d' },
  amethyst: { name: 'Velvet Amethyst', desc: 'Rich midnight violet gradient', bgBase: '#080410', bgPanel: '#11091d' },
  oled: { name: 'True OLED Black', desc: 'Pure 100% black contrast for OLEDs', bgBase: '#000000', bgPanel: '#000000' },
};

const DEFAULT_SETTINGS = {
  streamingService: (localStorage.getItem('streamingService') as StreamingEngine) || 'youtube',
  audioQuality: 'high' as AudioQuality,
  audioNormalization: true,
  crossfadeDuration: 3,
  gaplessPlayback: true,
  equalizerPreset: 'flat' as EqPreset,
  eqBands: EQ_PRESETS_DATA.flat,
  autoplay: true,
  smartPreload: true,
  hardwareMediaKeys: true,
  rememberPosition: true,
  theme: 'obsidian' as AppTheme,
  accentColor: 'crimson' as AccentColor,
  lyricsMode: 'kinetic' as LyricsMode,
  ambientGlow: true,
  tabularNumbers: true,
  autoScanLocal: true,
  filterShortTracks: true,
  extractCoverArt: true,
};

export function applyThemeTokens(theme: AppTheme, accent: AccentColor) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const t = THEMES_DATA[theme] || THEMES_DATA.obsidian;
  const a = ACCENT_COLORS_DATA[accent] || ACCENT_COLORS_DATA.crimson;

  root.style.setProperty('--color-surface-0', t.bgBase);
  root.style.setProperty('--color-bg-base', t.bgBase);
  root.style.setProperty('--color-bg-panel', t.bgPanel);
  root.style.setProperty('--color-accent', a.hex);
  root.style.setProperty('--color-accent-rgb', a.rgb);
  root.setAttribute('data-app-theme', theme);
  root.setAttribute('data-accent', accent);
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setStreamingService: (service) => {
        localStorage.setItem('streamingService', service);
        set({ streamingService: service });
      },
      setAudioQuality: (quality) => set({ audioQuality: quality }),
      setAudioNormalization: (enabled) => set({ audioNormalization: enabled }),
      setCrossfadeDuration: (seconds) => set({ crossfadeDuration: seconds }),
      setGaplessPlayback: (enabled) => set({ gaplessPlayback: enabled }),
      setEqualizerPreset: (preset) => {
        set({
          equalizerPreset: preset,
          eqBands: [...EQ_PRESETS_DATA[preset]] as [number, number, number, number, number],
        });
      },
      setEqBand: (index, val) => {
        const currentBands = get().eqBands;
        const base = (Array.isArray(currentBands) && currentBands.length === 5)
          ? currentBands
          : EQ_PRESETS_DATA.flat;
        const bands = [...base] as [number, number, number, number, number];
        bands[index] = val;
        set({ eqBands: bands, equalizerPreset: 'flat' });
      },
      setAutoplay: (enabled) => set({ autoplay: enabled }),
      setSmartPreload: (enabled) => set({ smartPreload: enabled }),
      setHardwareMediaKeys: (enabled) => set({ hardwareMediaKeys: enabled }),
      setRememberPosition: (enabled) => set({ rememberPosition: enabled }),
      setTheme: (theme) => {
        applyThemeTokens(theme, get().accentColor);
        set({ theme });
      },
      setAccentColor: (color) => {
        applyThemeTokens(get().theme, color);
        set({ accentColor: color });
      },
      setLyricsMode: (mode) => set({ lyricsMode: mode }),
      setAmbientGlow: (enabled) => set({ ambientGlow: enabled }),
      setTabularNumbers: (enabled) => set({ tabularNumbers: enabled }),
      setAutoScanLocal: (enabled) => set({ autoScanLocal: enabled }),
      setFilterShortTracks: (enabled) => set({ filterShortTracks: enabled }),
      setExtractCoverArt: (enabled) => set({ extractCoverArt: enabled }),
      resetAllSettings: () => {
        localStorage.removeItem('streamingService');
        applyThemeTokens(DEFAULT_SETTINGS.theme, DEFAULT_SETTINGS.accentColor);
        set({ ...DEFAULT_SETTINGS });
      },
    }),
    {
      name: 'inisai_settings_store',
      merge: (persistedState, currentState) => {
        const p = (persistedState as Partial<SettingsState>) || {};
        const safeEqBands = (Array.isArray(p.eqBands) && p.eqBands.length === 5)
          ? p.eqBands
          : (EQ_PRESETS_DATA[p.equalizerPreset || 'flat'] || EQ_PRESETS_DATA.flat);

        return {
          ...currentState,
          ...p,
          eqBands: [...safeEqBands] as [number, number, number, number, number],
          equalizerPreset: p.equalizerPreset || 'flat',
          crossfadeDuration: typeof p.crossfadeDuration === 'number' ? p.crossfadeDuration : 3,
          streamingService: (p.streamingService === 'spotify' || p.streamingService === 'direct') ? 'youtube' : (p.streamingService || 'youtube'),
          theme: (p.theme && THEMES_DATA[p.theme]) ? p.theme : 'obsidian',
          accentColor: (p.accentColor && ACCENT_COLORS_DATA[p.accentColor]) ? p.accentColor : 'crimson',
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeTokens(state.theme || 'obsidian', state.accentColor || 'crimson');
          if (state.streamingService) {
            localStorage.setItem('streamingService', state.streamingService);
          }
        }
      },
    }
  )
);
