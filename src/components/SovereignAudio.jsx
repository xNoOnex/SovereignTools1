import React, { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';

export function SovereignAudio() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  const scanAudio = async () => {
    setLoading(true);
    let found = [];
    const targetFolders = ['Download', 'Music', 'DCIM'];

    for (const folder of targetFolders) {
      try {
        const res = await Filesystem.readdir({
          path: folder,
          directory: Directory.ExternalStorage
        });

        const audioFiles = res.files
          .filter(f => f.name.match(/\.(mp3|wav|flac|aac|m4a|ogg)$/i))
          .map(f => ({ name: f.name, path: `${folder}/${f.name}` }));
        found = [...found, ...audioFiles];
      } catch (err) {}
    }

    setTracks(found);
    setLoading(false);
  };

  useEffect(() => { scanAudio(); }, []);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">🎧 Sovereign Audio</h2>
          <p className="text-xs text-zinc-400">Local audio tracks ({tracks.length} found)</p>
        </div>
        <button onClick={scanAudio} className="bg-cyan-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold">
          {loading ? 'Scanning...' : 'Rescan'}
        </button>
      </div>

      <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 min-h-[220px]">
        {loading ? (
          <div className="text-center py-12 text-xs text-cyan-400 animate-pulse font-mono">🎧 Scanning audio in Download & Music folders...</div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-12 text-xs text-zinc-500 font-mono">No audio files found. Drop MP3 or WAV files into Download or Music.</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tracks.map((t, idx) => (
              <div key={idx} className="bg-black/60 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between">
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{t.name}</p>
                  <p className="text-[9px] text-zinc-400 font-mono truncate">{t.path}</p>
                </div>
                <span className="text-xs text-cyan-400 ml-2">▶️</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
