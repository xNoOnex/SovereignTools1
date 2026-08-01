import React, { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export function SecureGallery() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [previewItem, setPreviewItem] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const walkDirectory = async (folderPath = '', depth = 0) => {
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
            const sub = await walkDirectory(fullPath, depth + 1);
            results = [...results, ...sub];
          }
        } else {
          if (item.name.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mkv)$/i)) {
            // Convert native path to WebView streamable URL
            const webUrl = Capacitor.convertFileSrc(`/storage/emulated/0/${fullPath}`);
            results.push({
              name: item.name,
              path: fullPath,
              src: webUrl,
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

  const shredItem = async (filePath, e) => {
    if (e) e.stopPropagation();
    try {
      await Filesystem.deleteFile({
        path: filePath,
        directory: Directory.ExternalStorage
      });
      setMediaFiles(prev => prev.filter(f => f.path !== filePath));
      if (previewItem?.path === filePath) setPreviewItem(null);
      setStatusMsg(`☣️ Shredded: ${filePath.split('/').pop()}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('❌ Shredding failed.');
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
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-xl font-bold text-white">Secure Gallery</h2>
          <p className="text-xs text-zinc-400">Local viewports ({mediaFiles.length} cataloged)</p>
        </div>
        <button onClick={scanDeep} className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold shadow">
          {loading ? 'Scanning...' : 'Deep Scan'}
        </button>
      </div>

      {statusMsg && (
        <div className="bg-red-950/90 border border-red-500/50 text-red-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg">
          {statusMsg}
        </div>
      )}

      {/* CATEGORY TABS */}
      <div className="flex space-x-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
        {['All', 'Photos', 'Videos'].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${filter === cat ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400 hover:text-white'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* MEDIA GRID WITH VISUAL THUMBNAILS */}
      <div className="bg-zinc-900 p-3 rounded-3xl border border-zinc-800 min-h-[300px]">
        {loading ? (
          <div className="text-center py-20 text-xs text-cyan-400 animate-pulse font-mono">
            🔍 Generating thumbnail viewports across device storage...
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20 text-xs text-zinc-500 font-mono">
            No media found matching filter.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-h-[480px] overflow-y-auto p-1">
            {displayed.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => setPreviewItem(item)}
                className="group relative bg-black border border-zinc-800 rounded-2xl overflow-hidden aspect-square cursor-pointer hover:border-cyan-500 transition-all flex flex-col justify-end"
              >
                {item.type === 'photo' ? (
                  <img src={item.src} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center text-cyan-400 font-bold text-2xl">
                    🎬
                  </div>
                )}
                
                {/* CARD OVERLAY */}
                <div className="relative z-10 bg-gradient-to-t from-black via-black/80 to-transparent p-2 space-y-1">
                  <p className="text-[10px] text-white font-mono truncate">{item.name}</p>
                  <button
                    onClick={(e) => shredItem(item.path, e)}
                    className="w-full bg-red-600/90 hover:bg-red-600 text-white text-[9px] font-bold py-1 rounded-lg border border-red-500/50"
                  >
                    ☣️ Shred
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FULLSCREEN LIGHTBOX PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/95 z-50 p-4 flex flex-col justify-between items-center backdrop-blur-md">
          <div className="w-full flex justify-between items-center border-b border-zinc-800 pb-3">
            <span className="text-xs font-mono text-cyan-400 truncate max-w-[200px]">{previewItem.name}</span>
            <button onClick={() => setPreviewItem(null)} className="text-zinc-400 text-lg font-bold px-3">✕</button>
          </div>

          <div className="flex-1 w-full max-w-lg flex items-center justify-center my-4 overflow-hidden">
            {previewItem.type === 'photo' ? (
              <img src={previewItem.src} alt={previewItem.name} className="max-h-full max-w-full object-contain rounded-2xl border border-zinc-800" />
            ) : (
              <video src={previewItem.src} controls autoPlay className="max-h-full max-w-full rounded-2xl border border-zinc-800" />
            )}
          </div>

          <div className="w-full max-w-lg flex gap-3">
            <button
              onClick={() => shredItem(previewItem.path)}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-3 rounded-2xl shadow border border-red-400"
            >
              ☣️ Permanently Shred File
            </button>
            <button
              onClick={() => setPreviewItem(null)}
              className="px-6 bg-zinc-800 text-zinc-300 text-xs font-bold py-3 rounded-2xl border border-zinc-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
