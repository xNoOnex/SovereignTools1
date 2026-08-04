import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { Capacitor } from '@capacitor/core';

export function SovereignAudio({ onNavigate }) {
  const { indexedFiles, runGlobalScan } = useStorage();
  const [currentTrack, setCurrentTrack] = useState(null);

  const audioFiles = indexedFiles.filter(f => 
    ['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg', 'wma'].includes(f.ext?.toLowerCase())
  );

  const getWebUrl = (path) => {
    if (!path) return '';
    return Capacitor.convertFileSrc(path);
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-32 select-none text-white min-h-screen animate-fadeIn">
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3">
            <span className="text-3xl text-cyan-400">🎧</span> Sovereign Audio
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Native local audio playback engine ({audioFiles.length} tracks)</p>
        </div>
        <button onClick={runGlobalScan} className="bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95">
          Rescan
        </button>
      </div>

      {currentTrack && (
        <div className="bg-zinc-900/90 border border-cyan-500/40 p-4 rounded-3xl space-y-3 shadow-2xl animate-fadeIn">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">Now Playing</span>
              <h3 className="text-sm font-bold text-white truncate max-w-[250px]">{currentTrack.name}</h3>
            </div>
            <button onClick={() => setCurrentTrack(null)} className="text-xs text-zinc-500 hover:text-white">✕</button>
          </div>
          <audio 
            controls 
            autoPlay 
            src={getWebUrl(currentTrack.path)} 
            className="w-full h-10 rounded-xl" 
          />
        </div>
      )}

      <div className="space-y-2">
        {audioFiles.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 text-center text-zinc-500 font-mono text-xs">
            No audio tracks indexed. Run rescan or add .mp3/.flac files to Music/Download folders.
          </div>
        ) : (
          audioFiles.map((file, idx) => (
            <div 
              key={idx} 
              onClick={() => setCurrentTrack(file)}
              className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-2xl flex justify-between items-center cursor-pointer hover:border-cyan-500/40 active:scale-95 transition-all shadow"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-xl opacity-80">🎵</span>
                <div className="truncate">
                  <span className="text-xs font-bold text-white block truncate">{file.name}</span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">{file.folder || 'Storage'} • .{file.ext}</span>
                </div>
              </div>
              <button className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest shrink-0">
                PLAY
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
