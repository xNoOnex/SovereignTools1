import React, { useState, useEffect, useRef } from 'react';
import { useStorage } from '../context/StorageContext';
import { Capacitor } from '@capacitor/core';

export function SovereignAudio({ onNavigate }) {
  const { indexedFiles, runGlobalScan } = useStorage();
  const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('LIBRARY');
  
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const audioRef = useRef(null);

  const audioFiles = indexedFiles.filter(f => 
    ['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg', 'wma'].includes(f.ext?.toLowerCase())
  );

  useEffect(() => {
    const saved = localStorage.getItem('sovereign_playlists');
    if (saved) setPlaylists(JSON.parse(saved));
  }, []);

  const currentTrack = currentTrackIndex !== null ? audioFiles[currentTrackIndex] : null;

  const getWebUrl = (path) => {
    if (!path) return '';
    return Capacitor.convertFileSrc(path);
  };

  // Configure OS MediaSession for background/lockscreen play
  useEffect(() => {
    if (currentTrack && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.name,
        artist: 'Sovereign Audio',
        album: currentTrack.folder || 'Storage'
      });

      navigator.mediaSession.setActionHandler('play', handlePlay);
      navigator.mediaSession.setActionHandler('pause', handlePause);
      navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
      navigator.mediaSession.setActionHandler('seekbackward', handleRewind);
      navigator.mediaSession.setActionHandler('seekforward', handleFastForward);
    }
  }, [currentTrackIndex]);

  const handlePlayTrack = (index) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = getWebUrl(audioFiles[index].path);
      audioRef.current.play();
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleNext = () => {
    if (audioFiles.length === 0) return;
    const nextIdx = (currentTrackIndex + 1) % audioFiles.length;
    handlePlayTrack(nextIdx);
  };

  const handlePrev = () => {
    if (audioFiles.length === 0) return;
    const prevIdx = (currentTrackIndex - 1 + audioFiles.length) % audioFiles.length;
    handlePlayTrack(prevIdx);
  };

  const handleRewind = () => {
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  };

  const handleFastForward = () => {
    if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 10);
  };

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const updated = [...playlists, { id: Date.now(), name: newPlaylistName, tracks: [] }];
    setPlaylists(updated);
    localStorage.setItem('sovereign_playlists', JSON.stringify(updated));
    setNewPlaylistName('');
  };

  const addToPlaylist = (playlistId, track) => {
    const updated = playlists.map(p => {
      if (p.id === playlistId && !p.tracks.some(t => t.path === track.path)) {
        return { ...p, tracks: [...p.tracks, track] };
      }
      return p;
    });
    setPlaylists(updated);
    localStorage.setItem('sovereign_playlists', JSON.stringify(updated));
    alert(`Added to playlist!`);
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-36 select-none text-white min-h-screen animate-fadeIn font-sans">
      <audio ref={audioRef} onEnded={handleNext} className="hidden" />

      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3">
            <span className="text-3xl text-cyan-400">🎧</span> Sovereign Audio
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Native background media engine ({audioFiles.length} tracks)</p>
        </div>
        <button onClick={runGlobalScan} className="bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95">
          Rescan
        </button>
      </div>

      {/* FULL FEATURE MEDIA PLAYER CONTROLS */}
      {currentTrack && (
        <div className="bg-zinc-900/90 border border-cyan-500/40 p-5 rounded-3xl space-y-4 shadow-2xl animate-fadeIn">
          <div className="flex justify-between items-start">
            <div className="truncate max-w-[80%]">
              <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">Now Playing</span>
              <h3 className="text-sm font-bold text-white truncate mt-0.5">{currentTrack.name}</h3>
              <span className="text-[9px] font-mono text-zinc-500">{currentTrack.folder}</span>
            </div>
            <button onClick={handleStop} className="text-xs font-mono text-zinc-500 hover:text-white bg-black px-2 py-1 rounded-lg border border-zinc-800">
              STOP ⏹
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button onClick={handlePrev} className="w-10 h-10 bg-black rounded-full border border-zinc-800 flex items-center justify-center text-xs active:scale-95">⏮</button>
            <button onClick={handleRewind} className="w-10 h-10 bg-black rounded-full border border-zinc-800 flex items-center justify-center text-xs active:scale-95 text-cyan-400">-10s</button>
            
            {isPlaying ? (
              <button onClick={handlePause} className="w-14 h-14 bg-cyan-500 text-black font-black rounded-full flex items-center justify-center text-lg active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.4)]">⏸</button>
            ) : (
              <button onClick={handlePlay} className="w-14 h-14 bg-cyan-500 text-black font-black rounded-full flex items-center justify-center text-lg active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.4)]">▶</button>
            )}

            <button onClick={handleFastForward} className="w-10 h-10 bg-black rounded-full border border-zinc-800 flex items-center justify-center text-xs active:scale-95 text-cyan-400">+10s</button>
            <button onClick={handleNext} className="w-10 h-10 bg-black rounded-full border border-zinc-800 flex items-center justify-center text-xs active:scale-95">⏭</button>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 shrink-0 shadow-inner">
        <button onClick={() => setActiveTab('LIBRARY')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === 'LIBRARY' ? 'bg-cyan-500 text-black shadow-md' : 'text-zinc-400'}`}>
          Library ({audioFiles.length})
        </button>
        <button onClick={() => setActiveTab('PLAYLISTS')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === 'PLAYLISTS' ? 'bg-cyan-500 text-black shadow-md' : 'text-zinc-400'}`}>
          Playlists ({playlists.length})
        </button>
      </div>

      {activeTab === 'LIBRARY' && (
        <div className="space-y-2">
          {audioFiles.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 text-center text-zinc-500 font-mono text-xs">
              No audio tracks indexed. Run rescan or add .mp3/.flac files to storage.
            </div>
          ) : (
            audioFiles.map((file, idx) => (
              <div 
                key={idx} 
                onClick={() => handlePlayTrack(idx)}
                className={`p-3.5 rounded-2xl flex justify-between items-center cursor-pointer active:scale-95 transition-all shadow border ${currentTrackIndex === idx ? 'bg-cyan-950/40 border-cyan-500/50' : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-xl opacity-80">{currentTrackIndex === idx && isPlaying ? '🔊' : '🎵'}</span>
                  <div className="truncate">
                    <span className="text-xs font-bold text-white block truncate">{file.name}</span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">{file.folder} • .{file.ext}</span>
                  </div>
                </div>
                
                {playlists.length > 0 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); addToPlaylist(playlists[0].id, file); }}
                    className="text-[9px] font-mono bg-black text-cyan-400 border border-zinc-800 px-2 py-1 rounded-lg ml-2 shrink-0"
                  >
                    + Playlist
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'PLAYLISTS' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newPlaylistName} 
              onChange={e => setNewPlaylistName(e.target.value)} 
              placeholder="New playlist name..." 
              className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500" 
            />
            <button onClick={createPlaylist} className="bg-cyan-600 text-white font-bold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-widest active:scale-95">
              Create
            </button>
          </div>

          <div className="space-y-3">
            {playlists.map(pl => (
              <div key={pl.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white">{pl.name}</h4>
                  <span className="text-[9px] font-mono text-zinc-500">{pl.tracks.length} tracks</span>
                </div>
                <div className="space-y-1">
                  {pl.tracks.map((t, i) => (
                    <div key={i} className="text-[10px] font-mono text-zinc-400 truncate bg-black/50 p-1.5 rounded">
                      {t.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
