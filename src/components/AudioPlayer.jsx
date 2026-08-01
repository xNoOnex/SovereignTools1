import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useDeviceStorage } from '../hooks/useDeviceStorage';
import { ToolFooter } from './ToolFooter';

export function AudioPlayer() {
  const { audioTracks, rescanAudio } = useDeviceStorage();
  const [activeTab, setActiveTab] = useState('player'); // 'player', 'library', 'playlists'
  
  // Audio State
  const audioRef = useRef(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: None, 1: All, 2: One

  // Playlist State
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null); // null means "All Tracks"
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    const savedPlaylists = localStorage.getItem('sovereign_playlists');
    if (savedPlaylists) {
      try { setPlaylists(JSON.parse(savedPlaylists)); } catch(e) {}
    }
  }, []);

  const savePlaylists = (newPls) => {
    setPlaylists(newPls);
    localStorage.setItem('sovereign_playlists', JSON.stringify(newPls));
  };

  const currentQueue = activePlaylist 
    ? playlists.find(p => p.id === activePlaylist)?.tracks.map(tId => audioTracks.find(t => t.id === tId)).filter(Boolean) || []
    : audioTracks;

  // --- AUDIO CONTROLS ---
  const togglePlay = () => {
    if (!currentTrack && currentQueue.length > 0) {
      playTrack(currentQueue[0]);
      return;
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setTimeout(() => {
      if (audioRef.current) audioRef.current.play();
    }, 50);
  };

  const handleNext = () => {
    if (!currentTrack || currentQueue.length === 0) return;
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * currentQueue.length);
      playTrack(currentQueue[randomIndex]);
      return;
    }
    const currentIndex = currentQueue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < currentQueue.length - 1) {
      playTrack(currentQueue[currentIndex + 1]);
    } else if (repeatMode === 1) {
      playTrack(currentQueue[0]);
    }
  };

  const handlePrev = () => {
    if (!currentTrack || currentQueue.length === 0) return;
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const currentIndex = currentQueue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      playTrack(currentQueue[currentIndex - 1]);
    } else if (repeatMode === 1) {
      playTrack(currentQueue[currentQueue.length - 1]);
    }
  };

  const skipForward = () => { if (audioRef.current) audioRef.current.currentTime += 10; };
  const skipBackward = () => { if (audioRef.current) audioRef.current.currentTime -= 10; };

  const handleTimeUpdate = () => {
    setProgress(audioRef.current.currentTime);
    setDuration(audioRef.current.duration || 0);
  };

  const handleTrackEnd = () => {
    if (repeatMode === 2) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      handleNext();
    }
  };

  const handleSeek = (e) => {
    const newTime = Number(e.target.value);
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // --- PLAYLIST LOGIC ---
  const createPlaylist = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const newPl = { id: Date.now(), name: newPlaylistName.trim(), tracks: [] };
    savePlaylists([...playlists, newPl]);
    setNewPlaylistName('');
  };

  const addToPlaylist = (playlistId, trackId) => {
    const updated = playlists.map(pl => {
      if (pl.id === playlistId && !pl.tracks.includes(trackId)) {
        return { ...pl, tracks: [...pl.tracks, trackId] };
      }
      return pl;
    });
    savePlaylists(updated);
  };

  const deletePlaylist = (id) => {
    if (window.confirm("Delete this playlist?")) {
      savePlaylists(playlists.filter(p => p.id !== id));
      if (activePlaylist === id) setActivePlaylist(null);
    }
  };

  const getMediaSrc = (track) => {
    if (!track || !track.absolutePath) return '';
    return Capacitor.convertFileSrc(track.absolutePath);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      
      {/* HEADER & SUB-TABS */}
      <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">🎧 Sovereign Audio</h2>
          <p className="text-xs text-zinc-400 mt-1">Local media engine & playlist manager.</p>
        </div>
        <button onClick={rescanAudio} className="px-3 py-1.5 bg-zinc-800 text-cyan-400 font-bold text-xs rounded-xl border border-zinc-700">Rescan</button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs font-bold bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800">
        <button onClick={() => setActiveTab('player')} className={`py-2 rounded-xl transition-all ${activeTab === 'player' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400 hover:text-white'}`}>Now Playing</button>
        <button onClick={() => setActiveTab('library')} className={`py-2 rounded-xl transition-all ${activeTab === 'library' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400 hover:text-white'}`}>Library ({audioTracks.length})</button>
        <button onClick={() => setActiveTab('playlists')} className={`py-2 rounded-xl transition-all ${activeTab === 'playlists' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400 hover:text-white'}`}>Playlists</button>
      </div>

      {/* HIDDEN HTML5 AUDIO ELEMENT */}
      <audio 
        ref={audioRef} 
        src={currentTrack ? getMediaSrc(currentTrack) : ''} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={handleTrackEnd}
        onError={(e) => console.log("Audio Error", e)}
      />

      {/* SUB-TAB 1: NOW PLAYING */}
      {activeTab === 'player' && (
        <div className="bg-zinc-900/90 p-6 rounded-3xl border border-zinc-800 space-y-6 flex flex-col items-center shadow-xl">
          <div className="w-48 h-48 bg-black rounded-2xl border border-zinc-700 flex items-center justify-center shadow-inner overflow-hidden relative">
            <div className={`absolute inset-0 bg-cyan-900/20 rounded-2xl ${isPlaying ? 'animate-pulse' : ''}`} />
            <span className="text-6xl z-10 drop-shadow-md">🎵</span>
          </div>

          <div className="text-center w-full space-y-1">
            <h3 className="text-lg font-bold text-white truncate px-4">{currentTrack ? currentTrack.title : 'No Track Selected'}</h3>
            <p className="text-xs text-cyan-400 font-mono truncate">{currentTrack ? currentTrack.artist : 'Select a track from library'}</p>
          </div>

          {/* PROGRESS BAR */}
          <div className="w-full space-y-2">
            <input 
              type="range" 
              min={0} 
              max={duration || 100} 
              value={progress} 
              onChange={handleSeek}
              className="w-full accent-cyan-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono font-bold">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex items-center justify-center space-x-6 w-full">
            <button onClick={() => setIsShuffle(!isShuffle)} className={`text-lg transition-colors ${isShuffle ? 'text-cyan-400' : 'text-zinc-600 hover:text-zinc-400'}`}>🔀</button>
            <button onClick={skipBackward} className="text-zinc-400 hover:text-white text-xl">⏪</button>
            <button onClick={handlePrev} className="text-zinc-300 hover:text-white text-3xl">⏮</button>
            
            <button onClick={togglePlay} className="w-16 h-16 bg-cyan-500 hover:bg-cyan-400 text-black rounded-full flex items-center justify-center text-2xl shadow-lg transform active:scale-95 transition-all">
              {isPlaying ? '⏸' : '▶'}
            </button>
            
            <button onClick={handleNext} className="text-zinc-300 hover:text-white text-3xl">⏭</button>
            <button onClick={skipForward} className="text-zinc-400 hover:text-white text-xl">⏩</button>
            <button 
              onClick={() => setRepeatMode((repeatMode + 1) % 3)} 
              className={`text-lg transition-colors ${repeatMode === 1 ? 'text-cyan-400' : repeatMode === 2 ? 'text-emerald-400' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              {repeatMode === 2 ? '🔂' : '🔁'}
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LIBRARY */}
      {activeTab === 'library' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              {activePlaylist ? `Playlist: ${playlists.find(p=>p.id === activePlaylist)?.name}` : 'All Local Tracks'}
            </span>
            {activePlaylist && (
              <button onClick={() => setActivePlaylist(null)} className="text-[10px] text-cyan-400 bg-zinc-800 px-2 py-1 rounded">View All</button>
            )}
          </div>

          {currentQueue.length === 0 ? (
            <div className="p-8 border border-dashed border-zinc-800 rounded-2xl text-center text-xs text-zinc-500">No tracks found. Add audio files to your device and hit Rescan.</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {currentQueue.map((track, idx) => (
                <div key={track.id} className={`p-3 rounded-2xl border flex justify-between items-center group cursor-pointer transition-colors ${currentTrack?.id === track.id ? 'bg-cyan-900/30 border-cyan-500/50' : 'bg-black border-zinc-800 hover:border-zinc-600'}`}>
                  <div className="flex items-center space-x-3 w-[70%]" onClick={() => playTrack(track)}>
                    <div className="text-xs font-bold text-zinc-500 w-4 text-right">{idx + 1}</div>
                    <div className="truncate">
                      <div className={`text-xs font-bold truncate ${currentTrack?.id === track.id ? 'text-cyan-300' : 'text-white'}`}>{track.title}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{track.artist}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Add to Playlist Dropdown */}
                    <select 
                      onChange={(e) => { addToPlaylist(Number(e.target.value), track.id); e.target.value = ''; }}
                      className="opacity-0 group-hover:opacity-100 bg-zinc-800 text-[9px] text-white border border-zinc-700 rounded px-1 py-1 w-20"
                    >
                      <option value="">+ Playlist</option>
                      {playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <span className="text-[10px] font-mono text-zinc-600">{formatTime(track.duration / 1000)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: PLAYLISTS */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          <form onSubmit={createPlaylist} className="flex space-x-2">
            <input 
              type="text" 
              value={newPlaylistName} 
              onChange={e => setNewPlaylistName(e.target.value)} 
              placeholder="New Playlist Name..." 
              className="flex-1 bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <button type="submit" className="px-4 py-2 bg-cyan-500 text-black font-bold text-xs rounded-xl">Create</button>
          </form>

          <div className="grid grid-cols-2 gap-3">
            {playlists.map(pl => (
              <div key={pl.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 relative group">
                <button 
                  onClick={() => deletePlaylist(pl.id)} 
                  className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-950/50 rounded text-[10px]"
                >✕</button>
                <div 
                  className="cursor-pointer space-y-1"
                  onClick={() => { setActivePlaylist(pl.id); setActiveTab('library'); }}
                >
                  <div className="text-3xl mb-2">💽</div>
                  <div className="text-xs font-bold text-white truncate pr-4">{pl.name}</div>
                  <div className="text-[10px] text-cyan-400 font-mono">{pl.tracks.length} Tracks</div>
                </div>
              </div>
            ))}
            {playlists.length === 0 && (
              <div className="col-span-2 p-8 border border-dashed border-zinc-800 rounded-2xl text-center text-xs text-zinc-500">
                No custom playlists created yet.
              </div>
            )}
          </div>
        </div>
      )}

      <ToolFooter title="Sovereign Media Engine" details="Local file indexer mapping physical audio blobs via MediaStore URIs." disclaimer="Zero DRM checking or cloud sync telemetry." />
    </div>
  );
}
