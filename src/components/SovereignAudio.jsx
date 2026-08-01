import React, { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';

export function SovereignAudio() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

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
            results.push({ name: item.name, path: fullPath });
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

  const shredTrack = async (filePath) => {
    try {
      await Filesystem.deleteFile({
        path: filePath,
        directory: Directory.ExternalStorage
      });
      setTracks(prev => prev.filter(t => t.path !== filePath));
      setStatusMsg(`☣️ Shredded: ${filePath.split('/').pop()}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('❌ Failed to shred audio.');
    }
  };

  useEffect(() => { scanDeep(); }, []);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">🎧 Sovereign Audio</h2>
          <p className="text-xs text-zinc-400">Deep storage audio index ({tracks.length} tracks)</p>
        </div>
        <button onClick={scanDeep} className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold">
          {loading ? 'Scanning...' : 'Deep Rescan'}
        </button>
      </div>

      {statusMsg && (
        <div className="bg-red-950/90 border border-red-500/50 text-red-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg">
          {statusMsg}
        </div>
      )}

      <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 min-h-[260px]">
        {loading ? (
          <div className="text-center py-16 text-xs text-cyan-400 animate-pulse font-mono">
            🎧 Traversing full phone directory for audio streams...
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-16 text-xs text-zinc-500 font-mono">
            No audio files detected anywhere on device storage.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tracks.map((t, idx) => (
              <div key={idx} className="bg-black/60 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between">
                <div className="overflow-hidden flex-1 mr-2">
                  <p className="text-xs font-bold text-white truncate">{t.name}</p>
                  <p className="text-[8px] text-cyan-400 font-mono truncate">{t.path}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-cyan-400 cursor-pointer">▶️</span>
                  <button
                    onClick={() => shredTrack(t.path)}
                    className="bg-red-600/80 hover:bg-red-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg border border-red-500/40"
                  >
                    Shred
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
