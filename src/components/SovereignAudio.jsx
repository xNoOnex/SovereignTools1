import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { useAudio } from '../context/AudioContext';

export function SovereignAudio({ onNavigate }) {
  const { isScanning, runGlobalScan } = useStorage();
  const {
    currentTrack, isPlaying, progress, duration, isShuffle, isRepeat,
    audioTracks, favorites, statusMsg,
    togglePlay, playTrack, skipTrack, jumpTime, seekTo,
    setIsShuffle, setIsRepeat, toggleFavorite, nukeTrack
  } = useAudio();

  const [activeSubTab, setActiveSubTab] = useState('Now Playing');
  const [searchQuery, setSearchQuery] = useState('');

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const displayedTracks = audioTracks.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-zinc-900 pb-3 pt-2">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🎧 Sovereign Audio
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Offline background audio engine ({audioTracks.length} tracks indexed)
          </p>
        </div>
        <button 
          onClick={runGlobalScan}
          disabled={isScanning}
          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-400 text-xs px-3 py-1.5 rounded-xl font-bold shadow transition-all active:scale-95"
        >
          {isScanning ? 'Scanning...' : 'Refresh'}
        </button>
      </div>

      {/* TOAST NOTIFICATION */}
      {statusMsg && (
        <div className="bg-red-950/90 border border-red-500/50 text-red-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg animate-fadeIn">
          {statusMsg}
        </div>
      )}

      {/* SUBTAB TRAY */}
      <div className="flex space-x-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900">
        {['Now Playing', `Library (${audioTracks.length})`, 'Playlists'].map(tab => {
          const tabKey = tab.startsWith('Library') ? 'Library' : tab;
          const isActive = activeSubTab === tabKey;
          return (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tabKey)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                isActive 
                  ? 'bg-cyan-500 text-black shadow-md scale-105' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: NOW PLAYING */}
      {activeSubTab === 'Now Playing' && (
        <div className="bg-zinc-900/80 p-6 rounded-3xl border border-zinc-800 space-y-6 text-center shadow-2xl relative overflow-hidden">
          <div className="w-48 h-48 bg-black border border-zinc-800 rounded-3xl mx-auto flex flex-col items-center justify-center relative shadow-inner group">
            <div className={`text-6xl transition-transform duration-500 ${isPlaying ? 'scale-110' : 'scale-100 opacity-60'}`}>
              🎵
            </div>
            {isPlaying && (
              <div className="flex gap-1 items-end h-4 mt-3">
                <div className="w-1 bg-cyan-400 animate-pulse h-full"></div>
                <div className="w-1 bg-cyan-400 animate-pulse h-2/3 delay-75"></div>
                <div className="w-1 bg-cyan-400 animate-pulse h-4/5 delay-150"></div>
                <div className="w-1 bg-cyan-400 animate-pulse h-1/2 delay-100"></div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-white truncate max-w-xs mx-auto">
              {currentTrack ? currentTrack.name : 'No Track Selected'}
            </h3>
            <p className="text-xs text-cyan-400 font-mono truncate max-w-xs mx-auto">
              {currentTrack ? currentTrack.path : 'Select a track from library'}
            </p>
          </div>

          <div className="space-y-1 pt-2">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              disabled={!currentTrack}
              className="w-full accent-cyan-400 bg-black rounded-lg h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-1">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center max-w-xs mx-auto pt-2">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-2 rounded-xl text-lg transition-all ${
                isShuffle ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'text-zinc-600'
              }`}
              title="Shuffle"
            >
              🔀
            </button>

            <button
              onClick={() => skipTrack('prev')}
              disabled={!currentTrack}
              className="text-2xl text-zinc-300 hover:text-white active:scale-90 transition-transform disabled:opacity-30"
            >
              ⏮️
            </button>

            <button
              onClick={() => jumpTime(-10)}
              disabled={!currentTrack}
              className="text-lg text-zinc-400 hover:text-white active:scale-90 transition-transform disabled:opacity-30"
              title="-10 Seconds"
            >
              ⏪
            </button>

            <button
              onClick={togglePlay}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shadow-lg transition-all active:scale-90 border ${
                isPlaying
                  ? 'bg-amber-500 text-black border-amber-400 shadow-amber-500/20'
                  : 'bg-cyan-500 text-black border-cyan-400 shadow-cyan-500/20'
              }`}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            <button
              onClick={() => jumpTime(10)}
              disabled={!currentTrack}
              className="text-lg text-zinc-400 hover:text-white active:scale-90 transition-transform disabled:opacity-30"
              title="+10 Seconds"
            >
              ⏩
            </button>

            <button
              onClick={() => skipTrack('next')}
              disabled={!currentTrack}
              className="text-2xl text-zinc-300 hover:text-white active:scale-90 transition-transform disabled:opacity-30"
            >
              ⏭️
            </button>

            <button
              onClick={() => setIsRepeat(!isRepeat)}
              className={`p-2 rounded-xl text-lg transition-all ${
                isRepeat ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'text-zinc-600'
              }`}
              title="Repeat Track"
            >
              🔁
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 2: LIBRARY */}
      {activeSubTab === 'Library' && (
        <div className="space-y-3">
          <div className="bg-black border border-zinc-800 rounded-2xl px-3 py-2 flex items-center gap-2">
            <span className="text-xs text-zinc-500">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search indexed tracks by name or path..."
              className="w-full bg-transparent text-xs text-white font-mono focus:outline-none placeholder-zinc-600"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-zinc-500 font-bold">✕</button>
            )}
          </div>

          <div className="bg-zinc-900/80 p-3 rounded-3xl border border-zinc-800 min-h-[300px]">
            {isScanning ? (
              <div className="text-center py-20 text-xs text-cyan-400 animate-pulse font-mono">
                🎧 Indexing local audio streams...
              </div>
            ) : displayedTracks.length === 0 ? (
              <div className="text-center py-20 text-xs text-zinc-500 font-mono">
                No audio files found.
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {displayedTracks.map((track, idx) => {
                  const isThisActive = currentTrack?.path === track.path;
                  const isFav = favorites.some(f => f.path === track.path);

                  return (
                    <div
                      key={idx}
                      onClick={() => playTrack(track)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isThisActive
                          ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 shadow-md'
                          : 'bg-black/60 border-zinc-800 hover:border-zinc-700 text-white'
                      }`}
                    >
                      <div className="overflow-hidden flex-1 mr-3">
                        <p className="text-xs font-bold truncate">{track.name}</p>
                        <p className="text-[9px] font-mono text-zinc-500 truncate mt-0.5">{track.path}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => toggleFavorite(track, e)}
                          className={`text-xs p-1 ${isFav ? 'text-amber-400' : 'text-zinc-600'}`}
                        >
                          ★
                        </button>

                        <span className="text-xs font-bold px-2 py-1 bg-zinc-800 rounded-lg">
                          {isThisActive && isPlaying ? '⏸️' : '▶️'}
                        </span>

                        <button
                          onClick={(e) => nukeTrack(track.path, e)}
                          className="bg-red-600/80 hover:bg-red-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg border border-red-500/40 active:scale-95 transition-transform"
                        >
                          NUKE
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: PLAYLISTS */}
      {activeSubTab === 'Playlists' && (
        <div className="bg-zinc-900/80 p-4 rounded-3xl border border-zinc-800 space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Favorites & Custom Playlists ({favorites.length})
            </h3>
          </div>

          {favorites.length === 0 ? (
            <div className="text-center py-16 text-xs text-zinc-500 font-mono space-y-1">
              <p className="text-lg">⭐</p>
              <p>No favorites added yet.</p>
              <p className="text-[10px] text-zinc-600">Tap the ★ icon on any track in your library to add it here.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto">
              {favorites.map((track, idx) => (
                <div
                  key={idx}
                  onClick={() => playTrack(track)}
                  className="bg-black p-3 rounded-2xl border border-zinc-800 flex items-center justify-between cursor-pointer"
                >
                  <div className="overflow-hidden flex-1 mr-2">
                    <p className="text-xs font-bold text-white truncate">{track.name}</p>
                    <p className="text-[9px] font-mono text-zinc-500 truncate">{track.path}</p>
                  </div>
                  <button
                    onClick={(e) => toggleFavorite(track, e)}
                    className="text-xs text-red-400 font-bold px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
