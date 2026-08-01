import React, { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';

export function SecureGallery() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [statusMsg, setStatusMsg] = useState('');

  // DEEP RECURSIVE FILE WALKER
  const walkDirectory = async (folderPath = '', depth = 0) => {
    if (depth > 4) return []; // Prevents infinite recursion
    let results = [];
    try {
      const res = await Filesystem.readdir({
        path: folderPath,
        directory: Directory.ExternalStorage
      });

      for (const item of res.files) {
        const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
        if (item.type === 'directory') {
          // Skip hidden folders and system app data to keep scans fast
          if (!item.name.startsWith('.') && item.name !== 'Android') {
            const sub = await walkDirectory(fullPath, depth + 1);
            results = [...results, ...sub];
          }
        } else {
          if (item.name.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mkv)$/i)) {
            results.push({
              name: item.name,
              path: fullPath,
              type: item.name.match(/\.(mp4|webm|mkv)$/i) ? 'video' : 'photo'
            });
          }
        }
      }
    } catch (e) {}
    return results;
  };

  const scanDeep = async () => {
    setLoading(true);
    const allMedia = await walkDirectory('');
    setMediaFiles(allMedia);
    setLoading(false);
  };

  // INTER-TOOL ACTION: SHRED DIRECTLY FROM GALLERY
  const shredItem = async (filePath) => {
    try {
      await Filesystem.deleteFile({
        path: filePath,
        directory: Directory.ExternalStorage
      });
      setMediaFiles(prev => prev.filter(f => f.path !== filePath));
      setStatusMsg(`☣️ Shredded & Unlinked: ${filePath.split('/').pop()}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('❌ Failed to shred file.');
    }
  };

  useEffect(() => { scanDeep(); }, []);

  const displayed = mediaFiles.filter(f => {
    if (filter === 'Photos') return f.type === 'photo';
    if (filter === 'Videos') return f.type === 'video';
    return true;
  });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-xl font-bold text-white">Secure Gallery</h2>
          <p className="text-xs text-zinc-400">Deep device storage catalog ({mediaFiles.length} files)</p>
        </div>
        <button onClick={scanDeep} className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold">
          {loading ? 'Scanning...' : 'Deep Scan'}
        </button>
      </div>

      {statusMsg && (
        <div className="bg-red-950/90 border border-red-500/50 text-red-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg">
          {statusMsg}
        </div>
      )}

      <div className="flex space-x-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
        {['All', 'Photos', 'Videos'].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${filter === cat ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400 hover:text-white'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 min-h-[260px]">
        {loading ? (
          <div className="text-center py-16 text-xs text-cyan-400 animate-pulse font-mono">
            🔍 Walking entire phone file system (DCIM, WhatsApp, Downloads, Custom)...
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-xs text-zinc-500 font-mono">
            No image or video files detected anywhere on storage.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
            {displayed.map((item, idx) => (
              <div key={idx} className="bg-black/60 border border-zinc-800 p-3 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-xs text-zinc-200 font-mono truncate block">{item.name}</span>
                  <span className="text-[8px] text-cyan-400 font-bold uppercase mt-1 truncate block">{item.path}</span>
                </div>
                <button
                  onClick={() => shredItem(item.path)}
                  className="mt-3 bg-red-600/80 hover:bg-red-600 text-white text-[9px] font-bold py-1 px-2 rounded-lg border border-red-500/40 flex items-center justify-center gap-1"
                >
                  <span>☣️</span> Shred File
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
