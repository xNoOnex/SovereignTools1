import React, { useState, useEffect, useRef } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export function SovereignAudio() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');

  const audioRef = useRef(new Audio());

  const walkAudio = async (folderPath = '', depth = 0) => {
    if (depth > 4) return [];
    let results = [];
    try {
      const res = await Filesystem.readdir({
        path: folderPath,
        directory: Directory.ExternalStorage
      });

      for (const item of res.files) {
        const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
        if (item.type === 'directory') {
          if (!item.name.startsWith('.') && item.name !== 'Android') {
            const sub = await walkAudio(fullPath, depth + 1);
            results = [...results, ...sub];
          }
        } else {
          if (item.name.match(/\.(mp3|wav|flac|aac|m4a|ogg|opus)$/i)) {
            const webUrl = Capacitor.convertFileSrc(`/storage/emulated/0/${fullPath}`);
            results.push({ name: item.name, path: fullPath, src: webUrl });
          }
        }
      }
    } catch (e) {}
    return results;
  };

  const scanDeep = async () => {
    setLoading(true);
    const audioFiles = await walkAudio('');
    setTracks(audioFiles);
    setLoading(false);
  };

  const selectTrack = (track) => {
    if (currentTrack?.path === track.path) {
      togglePlay();
      return;
    }

    audioRef.current.pause();
    audioRef.current = new Audio(track.src);
    setCurrentTrack(track);
    
    audioRef.current.play();
    setIsPlaying(true);

    audioRef.current.ontimeupdate = () => {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    };

    audioRef.current.onended = () => setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  const shredTrack = async (filePath, e) => {
    if (e) e.stopPropagation();
    try {
      if (currentTrack?.path === filePath) {
        audioRef.current.pause();
        setCurrentTrack(null);
        setIsPlaying(false);
      }
      await Filesystem.deleteFile({
        path: filePath,
        directory: Directory.ExternalStorage
      });
      setTracks(prev => prev.filter(t => t.path !== filePath));
      setStatusMsg(`☣️ Shredded: ${filePath.split('/').pop()}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('❌ Shredding failed.');
    }
  };

  useEffect(() => {
    scanDeep();
    return () => { audioRef.current.pause(); };
  }, []);

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">🎧 Sovereign Audio</h2>
          <p className="text-xs text-zinc-400">Offline playback engine ({tracks.length} tracks)</p>
        </div>
        <button onClick={scanDeep} className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold shadow">
          {loading ? 'Scanning...' : 'Rescan'}
        </button>
      </div>

      {statusMsg && (
        <div className="bg-red-950/90 border border-red-500/50 text-red-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg">
          {statusMsg}
        </div>
      )}

      {/* ACTIVE NOW PLAYING DECK */}
      <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 shadow-xl space-y-4 text-center">
        <div className="w-20 h-20 bg-black border border-zinc-800 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-inner text-cyan-400">
          {isPlaying ? '🎵' : '🎧'}
        </div>

        <div>
          <h3 className="text-sm font-bold text-white truncate max-w-xs mx-auto">
            {currentTrack ? currentTrack.name : 'No Track Selected'}
          </h3>
          <p className="text-[10px] text-cyan-400 font-mono truncate max-w-xs mx-auto mt-0.5">
            {currentTrack ? currentTrack.path : 'Select a track from the library below'}
          </p>
        </div>

        {/* TIME SCRUBBER */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={progress}
            onChange={handleSeek}
            disabled={!currentTrack}
            className="w-full accent-cyan-500 bg-black rounded-lg h-1.5 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-zinc-500">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* PLAY CONTROLS */}
        <button
          onClick={togglePlay}
          disabled={!currentTrack}
          className={`px-8 py-2.5 rounded-2xl font-bold text-xs shadow-lg transition-all border ${
            isPlaying 
              ? 'bg-amber-500 text-black border-amber-400' 
              : 'bg-cyan-500 text-black border-cyan-400'
          }`}
        >
          {isPlaying ? '⏸️ PAUSE' : '▶️ PLAY'}
        </button>
      </div>

      {/* TRACK LIBRARY LIST */}
      <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 min-h-[220px]">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
          Indexed Tracks ({tracks.length})
        </h3>

        {loading ? (
          <div className="text-center py-12 text-xs text-cyan-400 animate-pulse font-mono">
            🎧 Indexing audio streams across storage...
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-12 text-xs text-zinc-500 font-mono">
            No audio files detected on storage.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {tracks.map((t, idx) => {
              const isThisActive = currentTrack?.path === t.path;
              return (
                <div
                  key={idx}
                  onClick={() => selectTrack(t)}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    isThisActive
                      ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                      : 'bg-black/60 border-zinc-800 hover:border-zinc-700 text-white'
                  }`}
                >
                  <div className="overflow-hidden flex-1 mr-3">
                    <p className="text-xs font-bold truncate">{t.name}</p>
                    <p className="text-[8px] font-mono text-zinc-500 truncate">{t.path}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold">{isThisActive && isPlaying ? '⏸️' : '▶️'}</span>
                    <button
                      onClick={(e) => shredTrack(t.path, e)}
                      className="bg-red-600/80 hover:bg-red-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg border border-red-500/40"
                    >
                      Shred
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
