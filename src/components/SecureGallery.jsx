import React, { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { ToolFooter } from './ToolFooter';

export function SecureGallery() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const scanGallery = async () => {
    setLoading(true);
    let found = [];
    
    // Explicitly ask for Android permissions first
    try { await Filesystem.requestPermissions(); } catch (e) { console.warn('Perms bypassed'); }

    // Use native scoped directories instead of absolute paths
    const targetDirs = [Directory.Pictures, Directory.Movies, Directory.Documents];

    for (const dir of targetDirs) {
      try {
        const res = await Filesystem.readdir({ path: '', directory: dir });
        const validMedia = res.files
          .filter(f => f.name.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i))
          .map(f => ({
            name: f.name,
            path: `${dir}/${f.name}`,
            type: f.name.match(/\.(mp4|webm)$/i) ? 'video' : 'photo'
          }));
        found = [...found, ...validMedia];
      } catch (err) {
        console.log(`Skipped ${dir}`);
      }
    }
    setMediaFiles(found);
    setLoading(false);
  };

  useEffect(() => { scanGallery(); }, []);

  const displayedFiles = mediaFiles.filter(f => {
    if (filter === 'Photos') return f.type === 'photo';
    if (filter === 'Videos') return f.type === 'video';
    return true;
  });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none flex flex-col h-screen">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white">Secure Gallery</h2>
          <p className="text-xs text-zinc-400">Local device media catalog</p>
        </div>
        <button onClick={scanGallery} className="bg-cyan-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold">
          {loading ? 'Scanning...' : 'Refresh'}
        </button>
      </div>
      
      <div className="flex space-x-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 shrink-0">
        {['All', 'Photos', 'Videos'].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${filter === cat ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400 hover:text-white'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="text-center py-12 text-xs text-cyan-400 animate-pulse font-mono m-auto">🔍 Scanning native MediaStore...</div>
        ) : displayedFiles.length === 0 ? (
          <div className="text-center py-12 text-xs text-zinc-500 font-mono m-auto">No media files found in Public folders.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 overflow-y-auto p-1 flex-1">
            {displayedFiles.map((item, idx) => (
              <div key={idx} className="bg-black/60 border border-zinc-800 p-3 rounded-2xl flex flex-col justify-between h-24">
                <span className="text-xs text-zinc-200 font-mono truncate">{item.name}</span>
                <span className="text-[9px] text-cyan-400 font-bold uppercase mt-2 truncate">{item.path}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
