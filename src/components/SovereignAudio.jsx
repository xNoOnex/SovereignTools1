import React, { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { ToolFooter } from './ToolFooter';

export function SovereignAudio() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  const scanAudio = async () => {
    setLoading(true);
    let found = [];
    const targetFolders = ['Music', 'Download', 'DCIM'];

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
      } catch (err) {
        // Folder inaccessible or empty
      }
    }

    setTracks(found);
    setLoading(false);
  };

  // AUTOMATIC SCAN ON MOUNT
  useEffect(() => {
    scanAudio();
  }, []);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">🎧 Sovereign Audio</h2>
          <p className="text-xs text-zinc-400">Local media engine & playlist manager</p>
        </div>
        <button onClick={scanAudio} className="bg-cyan-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold">
          {loading ? 'Scanning...' : 'Rescan'}
        </button>
      </div>

      <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 min-h-[220px]">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
          Local Tracks ({tracks.length})
        </h3>

        {loading ? (
          <div className="text-center py-12 text-xs text-cyan-400 animate-pulse font-mono">
            🎧 Automatically scanning audio files in Music & Downloads...
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-12 text-xs text-zinc-500 font-mono">
            No audio tracks found. Add MP3 or WAV files to your device.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tracks.map((t, idx) => (
              <div key={idx} className="bg-black/60 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white truncate max-w-[200px]">{t.name}</p>
                  <p className="text-[9px] text-zinc-400 font-mono">{t.path}</p>
                </div>
                <span className="text-xs text-cyan-400">▶️</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToolFooter title="Audio Engine" details="Indexes local audio files automatically." disclaimer="Zero cloud sync telemetry." />
    </div>
  );
}
