import React, { useState } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useStorage } from '../context/StorageContext';

export function SecureGallery({ onNavigate }) {
  const { indexedFiles, isScanning, runGlobalScan, removeFileFromState } = useStorage();
  const [filter, setFilter] = useState('All');
  const [previewItem, setPreviewItem] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  // Extensions classification
  const photoExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic'];
  const videoExts = ['mp4', 'webm', 'mkv', 'avi', 'mov', '3gp'];

  // Filter media files from global indexed storage
  const mediaFiles = indexedFiles.filter(f => {
    const isPhoto = photoExts.includes(f.ext);
    const isVideo = videoExts.includes(f.ext);
    return isPhoto || isVideo;
  });

  const displayedFiles = mediaFiles.filter(f => {
    const isPhoto = photoExts.includes(f.ext);
    const isVideo = videoExts.includes(f.ext);

    if (filter === 'Photos') return isPhoto;
    if (filter === 'Videos') return isVideo;
    if (filter === 'Sovereign Camera') return f.path.toLowerCase().includes('camera') || f.path.toLowerCase().includes('dcim');
    return true;
  });

  const nukeFile = async (filePath, e) => {
    if (e) e.stopPropagation();
    try {
      await Filesystem.deleteFile({
        path: filePath,
        directory: Directory.ExternalStorage
      });
      removeFileFromState(filePath);
      if (previewItem?.path === filePath) setPreviewItem(null);
      
      const fileName = filePath.split('/').pop();
      setStatusMsg(`☣️ Nuked: ${fileName}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('❌ Shredding failed. File may be locked.');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-center border-b border-zinc-900 pb-3 pt-2">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🖼️ Secure Gallery
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Device media catalog with local viewports ({mediaFiles.length} items)
          </p>
        </div>
        <button 
          onClick={runGlobalScan}
          disabled={isScanning}
          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-400 text-xs px-3 py-1.5 rounded-xl font-bold shadow transition-all active:scale-95"
        >
          {isScanning ? 'Scanning...' : 'Refresh'}
        </button>
      </div>

      {/* 2. TOAST NOTIFICATION */}
      {statusMsg && (
        <div className="bg-red-950/90 border border-red-500/50 text-red-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg animate-fadeIn">
          {statusMsg}
        </div>
      )}

      {/* 3. CATEGORY SUBTABS */}
      <div className="flex gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 overflow-x-auto no-scrollbar">
        {['All', 'Photos', 'Videos', 'Sovereign Camera'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              filter === cat 
                ? 'bg-cyan-500 text-black shadow-md scale-105' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. MEDIA GRID */}
      <div className="bg-zinc-900/60 p-3 rounded-3xl border border-zinc-800 min-h-[360px]">
        {isScanning ? (
          <div className="text-center py-24 space-y-2">
            <div className="text-2xl animate-spin inline-block">🔍</div>
            <p className="text-xs text-cyan-400 font-mono animate-pulse">
              Indexing storage media viewports...
            </p>
          </div>
        ) : displayedFiles.length === 0 ? (
          <div className="text-center py-24 text-xs text-zinc-500 font-mono space-y-2">
            <p className="text-xl">📁</p>
            <p>No media found matching current filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-h-[520px] overflow-y-auto p-1 pr-1">
            {displayedFiles.map((item, idx) => {
              const isVideo = videoExts.includes(item.ext);
              return (
                <div 
                  key={idx}
                  onClick={() => setPreviewItem(item)}
                  className="group relative bg-black border border-zinc-800 rounded-2xl overflow-hidden aspect-square cursor-pointer hover:border-cyan-500/80 transition-all flex flex-col justify-end shadow-md"
                >
                  {/* THUMBNAIL / PREVIEW */}
                  {!isVideo ? (
                    <img 
                      src={item.src} 
                      alt={item.name} 
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-cyan-400">
                      <span className="text-3xl">🎬</span>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase mt-1">Video Stream</span>
                    </div>
                  )}

                  {/* OVERLAY BADGES & DETAILS */}
                  <div className="relative z-10 bg-gradient-to-t from-black via-black/80 to-transparent p-2 space-y-1.5">
                    <div className="flex justify-between items-center gap-1">
                      <p className="text-[10px] text-white font-mono truncate flex-1">{item.name}</p>
                      <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[8px] font-bold font-mono px-1.5 py-0.5 rounded">
                        {isVideo ? 'VIDEO' : 'IMAGE'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => nukeFile(item.path, e)}
                      className="w-full bg-red-600/90 hover:bg-red-600 text-white text-[9px] font-bold py-1 rounded-lg border border-red-500/50 shadow transition-all active:scale-95 flex items-center justify-center gap-1"
                    >
                      <span>☣️</span> NUKE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. FULL-SCREEN LIGHTBOX PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/95 z-50 p-4 flex flex-col justify-between items-center backdrop-blur-md animate-fadeIn">
          
          {/* MODAL HEADER */}
          <div className="w-full flex justify-between items-center border-b border-zinc-800 pb-3 pt-2">
            <span className="text-xs font-mono text-cyan-400 truncate max-w-[240px] font-bold">
              {previewItem.name}
            </span>
            <button 
              onClick={() => setPreviewItem(null)} 
              className="text-zinc-400 hover:text-white text-xl font-bold px-3 py-1"
            >
              ✕
            </button>
          </div>

          {/* VIEWPORT CONTENT */}
          <div className="flex-1 w-full max-w-lg flex items-center justify-center my-4 overflow-hidden">
            {!videoExts.includes(previewItem.ext) ? (
              <img 
                src={previewItem.src} 
                alt={previewItem.name} 
                className="max-h-full max-w-full object-contain rounded-2xl border border-zinc-800 shadow-2xl" 
              />
            ) : (
              <video 
                src={previewItem.src} 
                controls 
                autoPlay 
                className="max-h-full max-w-full rounded-2xl border border-zinc-800 shadow-2xl" 
              />
            )}
          </div>

          {/* MODAL ACTIONS */}
          <div className="w-full max-w-lg flex gap-3 pb-4">
            <button
              onClick={() => nukeFile(previewItem.path)}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-3 rounded-2xl shadow-lg border border-red-400 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>☣️</span> NUKE PERMANENTLY
            </button>
            <button
              onClick={() => setPreviewItem(null)}
              className="px-6 bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold py-3 rounded-2xl border border-zinc-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
