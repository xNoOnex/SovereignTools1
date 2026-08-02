import React, { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useStorage } from '../context/StorageContext';
import { useSettings } from '../context/SettingsContext';

export function SecureGallery({ onNavigate }) {
  const { indexedFiles, isScanning, runGlobalScan, removeFileFromState } = useStorage();
  const { currentTheme } = useSettings();
  
  const [activeTab, setActiveTab] = useState('All');
  const [previewIndex, setPreviewIndex] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const photoExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic'];
  const videoExts = ['mp4', 'webm', 'mkv', 'avi', 'mov', '3gp'];

  const mediaFiles = indexedFiles.filter(f => photoExts.includes(f.ext) || videoExts.includes(f.ext));

  const displayedFiles = mediaFiles.filter(f => {
    if (activeTab === 'Photos') return photoExts.includes(f.ext);
    if (activeTab === 'Videos') return videoExts.includes(f.ext);
    if (activeTab === 'Camera') return f.path.toLowerCase().includes('camera') || f.path.toLowerCase().includes('dcim');
    return true;
  });

  const nextPreview = (e) => {
    if (e) e.stopPropagation();
    if (previewIndex !== null && displayedFiles.length > 0) {
      setPreviewIndex((previewIndex + 1) % displayedFiles.length);
    }
  };

  const prevPreview = (e) => {
    if (e) e.stopPropagation();
    if (previewIndex !== null && displayedFiles.length > 0) {
      setPreviewIndex((previewIndex - 1 + displayedFiles.length) % displayedFiles.length);
    }
  };

  const nukeFile = async (filePath, e) => {
    if (e) e.stopPropagation();
    try {
      await Filesystem.deleteFile({
        path: filePath,
        directory: Directory.ExternalStorage
      });
      removeFileFromState(filePath);
      setPreviewIndex(null);
      setStatusMsg('☣️ File permanently nuked');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('❌ Shredding failed');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const currentPreviewItem = previewIndex !== null ? displayedFiles[previewIndex] : null;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-zinc-900 pb-3 pt-2">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">🖼️ Secure Gallery</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Local catalog ({mediaFiles.length} items)</p>
        </div>
        <button onClick={runGlobalScan} disabled={isScanning} className={`border text-xs px-3 py-1.5 rounded-xl font-bold shadow ${currentTheme.badge}`}>
          {isScanning ? 'Scanning...' : 'Refresh'}
        </button>
      </div>

      {statusMsg && (
        <div className={`p-2 rounded-xl text-xs font-bold text-center shadow ${currentTheme.badge}`}>
          {statusMsg}
        </div>
      )}

      {/* CATEGORY TABS */}
      <div className="flex gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 overflow-x-auto no-scrollbar">
        {['All', 'Photos', 'Videos', 'Camera'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`py-1.5 px-3 text-xs font-bold rounded-xl transition-all shrink-0 ${
              activeTab === cat ? `${currentTheme.bg} text-black shadow scale-105` : 'text-zinc-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MEDIA GRID */}
      <div className="bg-zinc-900/60 p-3 rounded-3xl border border-zinc-800 min-h-[360px]">
        {displayedFiles.length === 0 ? (
          <div className="text-center py-24 text-xs text-zinc-500 font-mono">No media found.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1 pr-1">
            {displayedFiles.map((item, idx) => {
              const isVideo = videoExts.includes(item.ext);
              return (
                <div 
                  key={idx}
                  onClick={() => setPreviewIndex(idx)}
                  className="group relative bg-black border border-zinc-800 rounded-2xl overflow-hidden aspect-square cursor-pointer hover:border-zinc-600 transition-all shadow-md flex flex-col justify-end"
                >
                  {!isVideo ? (
                    <img src={item.src} alt={item.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-cyan-400">
                      <span className="text-3xl">🎬</span>
                    </div>
                  )}
                  <div className="relative z-10 bg-gradient-to-t from-black via-black/80 to-transparent p-2 space-y-1">
                    <p className="text-[10px] text-white font-mono truncate">{item.name}</p>
                    <button onClick={(e) => nukeFile(item.path, e)} className="w-full bg-red-600/90 hover:bg-red-600 text-white text-[9px] font-bold py-1 rounded-lg">
                      ☣️ NUKE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TRUE EDGE-TO-EDGE FULLSCREEN LIGHTBOX MODAL */}
      {currentPreviewItem && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center select-none overflow-hidden animate-fadeIn">
          
          {/* FLOATING HEADER CONTROLS OVERLAY */}
          <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-center bg-black/60 backdrop-blur-md border border-zinc-800 p-2.5 rounded-2xl shadow-2xl">
            <span className="text-xs font-mono text-white truncate max-w-[200px] font-bold">
              [{previewIndex + 1}/{displayedFiles.length}] {currentPreviewItem.name}
            </span>
            <button 
              onClick={() => setPreviewIndex(null)} 
              className="bg-zinc-800 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center border border-zinc-700 active:scale-90"
            >
              ✕
            </button>
          </div>

          {/* PREV BUTTON */}
          <button
            onClick={prevPreview}
            className="absolute left-3 z-30 bg-black/70 text-white w-12 h-12 rounded-full border border-zinc-700 text-xl font-bold flex items-center justify-center shadow-2xl active:scale-90"
          >
            ◀
          </button>

          {/* FULLSCREEN IMAGE / VIDEO DISPLAY */}
          <div className="w-screen h-screen flex items-center justify-center bg-black p-0 m-0">
            {!videoExts.includes(currentPreviewItem.ext) ? (
              <img 
                src={currentPreviewItem.src} 
                alt={currentPreviewItem.name} 
                className="w-full h-full object-contain" 
              />
            ) : (
              <video 
                src={currentPreviewItem.src} 
                controls 
                autoPlay 
                className="w-full h-full object-contain" 
              />
            )}
          </div>

          {/* NEXT BUTTON */}
          <button
            onClick={nextPreview}
            className="absolute right-3 z-30 bg-black/70 text-white w-12 h-12 rounded-full border border-zinc-700 text-xl font-bold flex items-center justify-center shadow-2xl active:scale-90"
          >
            ▶
          </button>

          {/* FLOATING FOOTER NUKE BUTTON */}
          <div className="absolute bottom-6 left-6 right-6 z-30">
            <button
              onClick={(e) => nukeFile(currentPreviewItem.path, e)}
              className="w-full bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs py-3 rounded-2xl border border-red-500 shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <span>☣️</span> NUKE PERMANENTLY
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
