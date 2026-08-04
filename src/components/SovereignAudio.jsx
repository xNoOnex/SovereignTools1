import React, { useState, useEffect } from 'react';
import { useStorage } from '../context/StorageContext';

export function SovereignAudio({ globalTrackIndex, isPlaying, handlePlayTrack, togglePlay, stopAudio, handleNextTrack, handlePrevTrack, audioRef }) {
  const { indexedFiles, runGlobalScan } = useStorage();
  const [activeTab, setActiveTab] = useState('LIBRARY');
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(null);

  const audioFiles = indexedFiles.filter(f => ['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg', 'wma'].includes(f.ext?.toLowerCase()));
  const currentTrack = globalTrackIndex !== null ? audioFiles[globalTrackIndex] : null;

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sovereign_playlists');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setPlaylists(parsed);
      }
    } catch (e) {}
  }, []);

  const handleRewind = () => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10); };
  const handleFastForward = () => { if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 10); };

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
    setShowPlaylistMenu(null);
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-36 select-none text-white animate-fadeIn font-sans">
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3"><span className="text-3xl text-cyan-400">🎧</span> Sovereign Audio</h2>
          <p className="text-xs text-zinc-400 mt-1">Global background media engine ({audioFiles.length} tracks)</p>
        </div>
        <button onClick={runGlobalScan} className="bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95">Rescan</button>
      </div>

      {currentTrack && (
        <div className="bg-zinc-900/90 border border-cyan-500/40 p-5 rounded-3xl space-y-4 shadow-2xl animate-fadeIn">
          <div className="flex justify-between items-start">
            <div className="truncate max-w-[80%]">
              <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">Now Playing Globally</span>
              <h3 className="text-sm font-bold text-white truncate mt-0.5">{currentTrack.name}</h3>
              <span className="text-[9px] font-mono text-zinc-500">{currentTrack.folder}</span>
            </div>
            <button onClick={stopAudio} className="text-xs font-mono text-zinc-500 hover:text-white bg-black px-2 py-1 rounded-lg border border-zinc-800">STOP ⏹</button>
          </div>
          <div className="flex items-center justify-center gap-4 pt-2">
            <button onClick={handlePrevTrack} className="w-10 h-10 bg-black rounded-full border border-zinc-800 flex items-center justify-center text-xs active:scale-95">⏮</button>
            <button onClick={handleRewind} className="w-10 h-10 bg-black rounded-full border border-zinc-800 flex items-center justify-center text-xs active:scale-95 text-cyan-400">-10s</button>
            <button onClick={togglePlay} className="w-14 h-14 bg-cyan-500 text-black font-black rounded-full flex items-center justify-center text-lg active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
               {isPlaying ? '⏸' : '▶'}
            </button>
            <button onClick={handleFastForward} className="w-10 h-10 bg-black rounded-full border border-zinc-800 flex items-center justify-center text-xs active:scale-95 text-cyan-400">+10s</button>
            <button onClick={handleNextTrack} className="w-10 h-10 bg-black rounded-full border border-zinc-800 flex items-center justify-center text-xs active:scale-95">⏭</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 shrink-0 shadow-inner">
        <button onClick={() => setActiveTab('LIBRARY')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === 'LIBRARY' ? 'bg-cyan-500 text-black shadow-md' : 'text-zinc-400'}`}>Library ({audioFiles.length})</button>
        <button onClick={() => setActiveTab('PLAYLISTS')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === 'PLAYLISTS' ? 'bg-cyan-500 text-black shadow-md' : 'text-zinc-400'}`}>Playlists ({playlists.length})</button>
      </div>

      {activeTab === 'LIBRARY' && (
        <div className="space-y-2 relative">
          {audioFiles.map((file, idx) => (
            <div key={idx} className="relative">
              <div onClick={() => handlePlayTrack(idx)} className={`p-3.5 rounded-2xl flex justify-between items-center cursor-pointer active:scale-95 transition-all shadow border ${globalTrackIndex === idx ? 'bg-cyan-950/40 border-cyan-500/50' : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'}`}>
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-xl opacity-80">{globalTrackIndex === idx && isPlaying ? '🔊' : '🎵'}</span>
                  <div className="truncate">
                    <span className="text-xs font-bold text-white block truncate">{file.name}</span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">{file.folder} • .{file.ext}</span>
                  </div>
                </div>
                {playlists.length > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); setShowPlaylistMenu(showPlaylistMenu === idx ? null : idx); }} className="text-[9px] font-bold uppercase tracking-widest bg-black text-cyan-400 border border-zinc-800 px-3 py-2 rounded-xl ml-2 shrink-0 active:bg-zinc-800">
                    + P.LIST
                  </button>
                )}
              </div>
              
              {showPlaylistMenu === idx && (
                 <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                    <div className="p-2 border-b border-zinc-800 bg-black/50 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-center">Select Destination</div>
                    <div className="max-h-40 overflow-y-auto">
                       {playlists.map(pl => (
                          <button key={pl.id} onClick={(e) => { e.stopPropagation(); addToPlaylist(pl.id, file); }} className="w-full text-left px-4 py-3 text-xs font-bold text-white hover:bg-cyan-900/40 transition-colors border-b border-zinc-800/50 last:border-0 truncate">
                             {pl.name}
                          </button>
                       ))}
                    </div>
                 </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'PLAYLISTS' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex gap-2">
            <input type="text" value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} placeholder="New playlist name..." className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500" />
            <button onClick={createPlaylist} className="bg-cyan-600 text-white font-bold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-widest active:scale-95">Create</button>
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
                    <div key={i} className="flex justify-between items-center bg-black/50 p-1.5 rounded group">
                        <span className="text-[10px] font-mono text-zinc-400 truncate flex-1 pr-2">{t.name}</span>
                        <button onClick={() => {
                            const updated = playlists.map(p => {
                               if (p.id === pl.id) return { ...p, tracks: p.tracks.filter((_, idx) => idx !== i) };
                               return p;
                            });
                            setPlaylists(updated);
                            localStorage.setItem('sovereign_playlists', JSON.stringify(updated));
                        }} className="text-red-500 font-bold px-2 py-0.5 rounded bg-red-950/30 text-[8px] opacity-50 hover:opacity-100">✕</button>
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
