import { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Music, Trash2, FolderOpen, ListMusic, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import { parseID3Tags } from '../lib/id3';
import { useAudioStore } from '../store/useAudioStore';
import { TrackContextMenu } from '../components/ui/TrackContextMenu';
import { CreatePlaylistModal } from '../components/ui/CreatePlaylistModal';
import { PlaylistContextMenu } from '../components/ui/PlaylistContextMenu';
import type { Track } from '../types';

export function LocalMusic() {
 const navigate = useNavigate();
 const [activeTab, setActiveTab] = useState<'playlists' | 'local'>('playlists');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [localTracks, setLocalTracks] = useState<Track[]>([]);
 const [isImporting, setIsImporting] = useState(false);
 const fileInputRef = useRef<HTMLInputElement>(null);
 const folderInputRef = useRef<HTMLInputElement>(null);
 
 const { setQueue, playTrack, queue, isPlaying, currentIndex, play, pause, playlists } = useAudioStore();

 useEffect(() => {
 db.loadAllLocalTracks().then(tracks => {
 setLocalTracks(tracks);
 }).catch(e => console.error("Failed to load tracks", e));
 }, []);

 const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = e.target.files;
 if (!files || files.length === 0) return;

 setIsImporting(true);
 
 const newTracks: Track[] = [];
 
 for (let i = 0; i < files.length; i++) {
 const file = files[i];
 if (!file.type.startsWith('audio/')) continue;
 
 try {
 const metadata = await parseID3Tags(file);
 
 const trackMetadata = {
 id: crypto.randomUUID(),
 title: metadata.title,
 artist: metadata.artist,
 coverArtUrl: metadata.coverArtUrl,
 };
 
 const savedTrack = await db.saveTrack(file, trackMetadata);
 newTracks.push(savedTrack);
 } catch (err) {
 console.error("Error processing file", file.name, err);
 }
 }
 
 setLocalTracks(prev => [...prev, ...newTracks]);
 setIsImporting(false);
 
 if (fileInputRef.current) {
 fileInputRef.current.value = '';
 }
 };

 const handlePlay = (index: number) => {
 const isSameQueue = queue.length === localTracks.length && queue.every((t, i) => t.id === localTracks[i].id);
 
 if (!isSameQueue) {
 setQueue(localTracks);
 }
 
 if (currentIndex === index && isPlaying) {
 pause();
 } else if (currentIndex === index && !isPlaying) {
 play();
 } else {
 playTrack(index);
 }
 };

 const clearAll = async () => {
 if (confirm("Are you sure you want to remove all local tracks from your device?")) {
 await db.clearLocalTracks();
 setLocalTracks([]);
 }
 };

 return (
 <div className="animate-fade-in min-h-screen bg-[#030304]">
 {/* Header */}
 <div className="px-6 md:px-10 pt-16 pb-8 border-b border-white/[0.04]">
 <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">Your Library</h1>
 <p className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest mb-8">Playlists & Local Music</p>
 
 {/* Tabs */}
 <div className="flex items-center gap-2 bg-white/[0.02] p-1.5 rounded-2xl w-fit border border-white/[0.04]">
 <button 
 onClick={() => setActiveTab('playlists')}
 className={`px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ${activeTab === 'playlists' ? 'bg-white/10 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'}`}
 >
 Playlists
 </button>
 <button 
 onClick={() => setActiveTab('local')}
 className={`px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ${activeTab === 'local' ? 'bg-white/10 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'}`}
 >
 Local Files
 </button>
 </div>
 </div>

 <div className="px-6 md:px-10 pt-8">
 {activeTab === 'playlists' ? (
 <div className="animate-fade-in">
 <div className="flex items-center justify-between mb-8">
 <h2 className="text-2xl font-black text-white">Your Playlists</h2>
 <button 
 onClick={() => setIsModalOpen(true)}
 className="flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-950 font-black uppercase tracking-widest text-[11px] rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_4px_16px_rgba(255,255,255,0.2)]"
 >
 <Plus size={16} />
 Create Playlist
 </button>
 </div>
 
 {playlists.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/[0.08] rounded-[32px] bg-white/[0.01]">
 <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-6 border border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
 <ListMusic size={32} className="text-white"/>
 </div>
 <h3 className="text-xl font-black text-white mb-2 tracking-tight">No playlists yet</h3>
 <p className="text-[14px] font-medium text-zinc-500 max-w-xs">
 Create your first playlist to start organizing your favorite tracks.
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
 {playlists.map((playlist) => (
 <div 
 key={playlist.id} 
 className="group cursor-pointer flex flex-col"
 onClick={() => navigate(`/playlist/${playlist.id}`)}
 >
 <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 shadow-lg mb-4 border border-white/[0.04]">
 {playlist.tracks.length > 0 && playlist.tracks[0].coverArtUrl ? (
 <img src={playlist.tracks[0].coverArtUrl} alt={playlist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
 ) : (
 <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
 <ListMusic className="text-zinc-600 w-12 h-12 drop-shadow-md"/>
 </div>
 )}
 
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
 <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-zinc-950 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
 <Play size={20} fill="currentColor"className="ml-1"/>
 </div>
 </div>
 </div>
 
 <div className="px-1 mt-1 flex items-start justify-between gap-2">
 <div className="min-w-0">
 <h3 className="font-bold text-[15px] truncate text-white group-hover:text-emerald-400 transition-colors">{playlist.name}</h3>
 <p className="text-[13px] font-medium text-zinc-500 mt-0.5">{playlist.tracks.length} track{playlist.tracks.length !== 1 && 's'}</p>
 </div>
 <div className="shrink-0 md:opacity-0 group-hover:opacity-100 transition-opacity"onClick={e => e.stopPropagation()}>
 <PlaylistContextMenu playlist={playlist} />
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 ) : (
 <div className="animate-fade-in">
 <div className="flex items-center justify-between mb-8">
 <h2 className="text-2xl font-black text-white">Local Files</h2>
 <div className="flex gap-3 items-center">
 {localTracks.length > 0 && (
 <button 
 onClick={clearAll}
 className="flex items-center gap-2 px-5 py-2.5 text-[11px] text-rose-400 hover:text-white bg-rose-400/10 hover:bg-rose-500/20 border border-rose-400/20 hover:border-rose-400/40 rounded-full transition-all font-bold tracking-widest uppercase"
 >
 <Trash2 size={15} />
 Clear
 </button>
 )}
 <div className="flex bg-white rounded-full p-0.5 shadow-[0_4px_16px_rgba(255,255,255,0.2)]">
 <button 
 onClick={() => fileInputRef.current?.click()}
 disabled={isImporting}
 className="flex items-center gap-2 px-5 py-2 text-zinc-950 font-black uppercase tracking-widest text-[11px] rounded-full hover:bg-zinc-100 active:scale-95 transition-all disabled:opacity-50"
 >
 <Upload size={14} />
 {isImporting ? 'Importing…' : 'Import'}
 </button>
 <button 
 onClick={() => folderInputRef.current?.click()}
 disabled={isImporting}
 className="flex items-center gap-2 px-5 py-2 text-zinc-950 font-black uppercase tracking-widest text-[11px] rounded-full hover:bg-zinc-100 active:scale-95 transition-all disabled:opacity-50 border-l border-zinc-200"
 >
 <FolderOpen size={14} />
 Folder
 </button>
 </div>
 <input 
 type="file"
 ref={fileInputRef} 
 onChange={handleFileSelect} 
 multiple 
 accept="audio/*"
 className="hidden"
 />
 <input 
 type="file"
 ref={folderInputRef} 
 onChange={handleFileSelect} 
 /* @ts-expect-error webkitdirectory is non-standard but supported by most modern browsers */
 webkitdirectory=""
 directory=""
 multiple 
 accept="audio/*"
 className="hidden"
 />
 </div>
 </div>

 {localTracks.length === 0 && !isImporting ? (
 <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/[0.08] rounded-[32px] bg-white/[0.01]">
 <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-6 border border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
 <FolderOpen size={32} className="text-white"/>
 </div>
 <h3 className="text-xl font-black text-white mb-2 tracking-tight">No local music found</h3>
 <p className="text-[14px] font-medium text-zinc-500 max-w-sm">
 Import MP3, FLAC, or other audio files from your device. Files are securely cached for offline playback.
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
 {localTracks.map((track, idx) => {
 const isCurrentlyPlaying = currentIndex === idx && queue[idx]?.id === track.id && isPlaying;
 
 return (
 <div 
 key={track.id} 
 className="group cursor-pointer flex flex-col"
 onClick={() => handlePlay(idx)}
 >
 <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 shadow-lg mb-4 border border-white/[0.04]">
 {track.coverArtUrl ? (
 <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
 ) : (
 <div className="w-full h-full flex items-center justify-center bg-zinc-900">
 <Music className="text-zinc-700 w-12 h-12"/>
 </div>
 )}
 
 <div className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300 ${isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
 <div className={`w-14 h-14 rounded-full bg-white flex items-center justify-center text-zinc-950 shadow-[0_8px_24px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-110 ${isCurrentlyPlaying ? 'scale-100' : 'scale-75 group-hover:scale-100'}`}>
 {isCurrentlyPlaying ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor"className="ml-1"/>}
 </div>
 </div>
 </div>
 
 <div className="flex items-start justify-between gap-2 px-1">
 <div className="flex-1 min-w-0">
 <h3 className={`font-bold text-[15px] truncate transition-colors ${isCurrentlyPlaying ? 'text-white' : 'text-zinc-100 group-hover:text-white'}`}>{track.title}</h3>
 <p className="text-[13px] font-medium text-zinc-500 truncate mt-0.5 group-hover:text-zinc-400 transition-colors">{track.artist}</p>
 </div>
 <div onClick={e => e.stopPropagation()} className="shrink-0 -mr-2">
 <TrackContextMenu track={track} />
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}
 </div>

 <CreatePlaylistModal 
 isOpen={isModalOpen} 
 onClose={() => setIsModalOpen(false)} 
 />
 </div>
 );
}
