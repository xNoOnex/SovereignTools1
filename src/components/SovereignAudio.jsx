import React, { useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { useStorage } from '../context/StorageContext';

export function SovereignAudio({ onNavigate }) {
  const { runGlobalScan } = useStorage();
  const { 
    getAudioFiles, currentTrack, isPlaying, progress, duration, 
    playTrack, play, pause, seek, nextTrack, prevTrack,
    playlists, createPlaylist, deletePlaylist, toggleTrackInPlaylist
  } = useAudio();
  
  const [activeTab, setActiveTab] = useState('Library');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePlaylistView, setActivePlaylistView] = useState(null);
  const [showAddToMenu, setShowAddToMenu] = useState(null); // Used to expand the row

  const libraryFiles = getAudioFiles();
  const filteredLibrary = libraryFiles.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCreatePlaylist = () => {
    const name = prompt("Enter new playlist name:");
    if (name) createPlaylist(name);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-32 select-none font-sans text-white min-h-screen flex flex-col relative z-10 animate-fadeIn">
      
      <div className="flex justify-between items-center border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-2xl drop-shadow">🎧</span> Sovereign Audio</h2>
          <p className="text-[10px] text-zinc-400 mt-1 font-mono">Native background media engine.</p>
        </div>
        <button onClick={runGlobalScan} className="bg-zinc-900 border border-zinc-700 text-cyan-400 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 shadow">Rescan</button>
      </div>

      <div className="flex gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 shrink-0">
        {['Now Playing', 'Library', 'Playlists'].map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setActivePlaylistView(null); }} className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === tab ? 'theme-accent-bg text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}>
            {tab} {tab === 'Library' && `(${libraryFiles.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'Now Playing' && (
        <div className="flex-1 flex flex-col justify-center space-y-8 px-4 animate-fadeIn">
          <div className="aspect-square w-full max-w-[280px] mx-auto rounded-3xl bg-black border border-zinc-800 shadow-[0_0_30px_var(--glass-border)] flex items-center justify-center overflow-hidden relative group">
            {currentTrack ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/20 to-purple-900/20 opacity-50 z-0"></div>
                <span className="text-8xl drop-shadow-2xl z-10 group-hover:scale-110 transition-transform duration-500">🎵</span>
              </>
            ) : (
              <span className="text-6xl opacity-20">🔇</span>
            )}
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-white truncate px-4">{currentTrack ? currentTrack.name : 'No Track Selected'}</h3>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">{currentTrack ? 'Playing from Local Storage' : 'Select a track from Library'}</p>
          </div>

          <div className="space-y-3 px-2">
            <input type="range" min="0" max={duration || 100} value={progress} onChange={(e) => seek(Number(e.target.value))} className="w-full accent-[var(--accent-text)] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex justify-center items-center gap-8 pt-4">
            <button onClick={prevTrack} className="text-2xl text-zinc-400 hover:text-white active:scale-95 transition-all">⏮</button>
            <button onClick={() => isPlaying ? pause() : play()} className="w-20 h-20 flex items-center justify-center theme-accent-bg text-black rounded-full text-3xl shadow-[0_0_20px_var(--glass-border)] active:scale-95 transition-transform">
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button onClick={nextTrack} className="text-2xl text-zinc-400 hover:text-white active:scale-95 transition-all">⏭</button>
          </div>
        </div>
      )}

      {activeTab === 'Library' && (
        <div className="flex-1 flex flex-col space-y-4 animate-fadeIn">
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="🔍 Search local audio..." className="w-full bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl px-5 py-4 text-xs text-white font-mono focus:outline-none shrink-0 shadow-inner" />
          
          <div className="flex-1 space-y-2 overflow-y-auto pb-4">
            {filteredLibrary.length === 0 ? (
              <div className="text-center text-zinc-500 font-mono text-xs py-12">No audio files found.</div>
            ) : (
              filteredLibrary.map((file, idx) => (
                <div key={idx} className={`bg-zinc-900/80 backdrop-blur border rounded-3xl p-4 flex flex-col shadow transition-all ${currentTrack?.src === file.src ? 'border-[var(--accent-text)]' : 'border-zinc-800'}`}>
                  
                  {/* MAIN ROW */}
                  <div className="flex justify-between items-center w-full">
                    <div className="overflow-hidden pr-4 flex-1 cursor-pointer" onClick={() => { playTrack(file, filteredLibrary); setActiveTab('Now Playing'); }}>
                      <h4 className={`text-xs font-bold truncate ${currentTrack?.src === file.src ? 'theme-accent-text' : 'text-white'}`}>{file.name}</h4>
                      <p className="text-[9px] text-zinc-500 font-mono truncate mt-1">{file.path || 'Local Storage'}</p>
                    </div>
                    
                    <button onClick={() => setShowAddToMenu(showAddToMenu === file.src ? null : file.src)} className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl text-lg active:scale-95 transition-colors border ${showAddToMenu === file.src ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-black border-zinc-700 hover:border-zinc-500'}`}>
                      {showAddToMenu === file.src ? '✕' : '+'}
                    </button>
                  </div>

                  {/* INLINE ACCORDION DROPDOWN (Fixes Clipping) */}
                  {showAddToMenu === file.src && (
                    <div className="w-full mt-4 pt-4 border-t border-zinc-800/80 animate-fadeIn">
                      <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">Add to Playlist</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.keys(playlists).map(pName => {
                          const inPlaylist = playlists[pName].find(t => t.src === file.src);
                          return (
                            <button key={pName} onClick={() => toggleTrackInPlaylist(pName, file)} className="bg-black p-3 rounded-xl text-xs text-left truncate flex justify-between items-center border border-zinc-800 active:scale-95 transition-transform hover:border-zinc-600">
                              <span className="truncate text-zinc-300">{pName}</span>
                              {inPlaylist && <span className="theme-accent-text font-bold">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'Playlists' && !activePlaylistView && (
        <div className="flex-1 flex flex-col space-y-4 animate-fadeIn">
          <button onClick={handleCreatePlaylist} className="w-full py-4 theme-glass-panel border border-[var(--glass-border)] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow active:scale-95">
            + Create New Playlist
          </button>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {Object.keys(playlists).map(pName => (
              <div key={pName} onClick={() => setActivePlaylistView(pName)} className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-5 flex justify-between items-center shadow cursor-pointer hover:border-zinc-700 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-black border border-zinc-700 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
                    {pName === 'Favorites' ? '⭐' : '💿'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{pName}</h4>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">{playlists[pName].length} Tracks</p>
                  </div>
                </div>
                <span className="text-zinc-600 font-bold px-2">❯</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Playlists' && activePlaylistView && (
        <div className="flex-1 flex flex-col space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between bg-zinc-900/90 backdrop-blur p-4 rounded-3xl border border-zinc-800 shadow-xl shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setActivePlaylistView(null)} className="text-xl px-3 py-2 bg-black rounded-xl border border-zinc-700 active:scale-95">⬅️</button>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{activePlaylistView}</h3>
                <p className="text-[9px] text-zinc-400 font-mono">{playlists[activePlaylistView].length} Tracks</p>
              </div>
            </div>
            {activePlaylistView !== 'Favorites' && (
              <button onClick={() => { if(window.confirm('Delete playlist?')) { deletePlaylist(activePlaylistView); setActivePlaylistView(null); } }} className="bg-red-950/40 text-red-500 px-3 py-2 rounded-xl text-[10px] font-bold border border-red-900/50">Delete</button>
            )}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pb-4">
            {playlists[activePlaylistView].length === 0 ? (
              <div className="text-center text-zinc-500 font-mono text-xs py-12">Playlist is empty.</div>
            ) : (
              playlists[activePlaylistView].map((file, idx) => (
                <div key={idx} className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-4 flex justify-between items-center shadow">
                  <div className="overflow-hidden pr-4 flex-1 cursor-pointer" onClick={() => { playTrack(file, playlists[activePlaylistView]); setActiveTab('Now Playing'); }}>
                    <h4 className="text-xs font-bold truncate text-white">{file.name}</h4>
                  </div>
                  <button onClick={() => toggleTrackInPlaylist(activePlaylistView, file)} className="w-10 h-10 flex items-center justify-center bg-red-950/30 border border-red-900/50 text-red-500 rounded-xl text-[10px] font-bold active:scale-95">
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
