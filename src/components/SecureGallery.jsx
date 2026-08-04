import React, { useState, useMemo } from 'react';
import { useStorage } from '../context/StorageContext';
import { Capacitor } from '@capacitor/core';

export function SecureGallery({ onNavigate }) {
  const { indexedFiles, isScanning, runGlobalScan } = useStorage();
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [activeFolder, setActiveFolder] = useState('ALL');

  const imageFiles = useMemo(() => {
    return indexedFiles.filter(f => 
      ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(f.ext?.toLowerCase())
    );
  }, [indexedFiles]);

  // Dynamically generate folder categories based on scanned paths
  const folders = useMemo(() => {
    const folderSet = new Set(imageFiles.map(f => f.folder));
    return ['ALL', ...Array.from(folderSet).sort()];
  }, [imageFiles]);

  const displayedImages = useMemo(() => {
    if (activeFolder === 'ALL') return imageFiles;
    return imageFiles.filter(f => f.folder === activeFolder);
  }, [imageFiles, activeFolder]);

  const getWebUrl = (path) => {
    if (!path) return '';
    return Capacitor.convertFileSrc(path);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (selectedImageIndex !== null && selectedImageIndex < displayedImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-32 select-none text-white min-h-screen animate-fadeIn">
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3">
            <span className="text-3xl text-cyan-400">🖼️</span> Secure Gallery
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {isScanning ? 'Running deep sector scan...' : `Indexed ${imageFiles.length} images across storage.`}
          </p>
        </div>
        <button onClick={runGlobalScan} disabled={isScanning} className="bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 disabled:opacity-50">
          {isScanning ? 'Scanning...' : 'Rescan'}
        </button>
      </div>

      {/* VIRTUAL FOLDER TABS */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {folders.map(folder => (
          <button 
            key={folder} 
            onClick={() => setActiveFolder(folder)}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all shrink-0 ${activeFolder === folder ? 'bg-cyan-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}
          >
            {folder}
          </button>
        ))}
      </div>

      {displayedImages.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 text-center text-zinc-500 font-mono text-xs">
          No images found in {activeFolder === 'ALL' ? 'storage' : `folder '${activeFolder}'`}.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {displayedImages.map((file, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedImageIndex(idx)}
              className="aspect-square bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-cyan-500/50 transition-all active:scale-95 relative group shadow-md"
            >
              <img 
                src={getWebUrl(file.path)} 
                alt={file.name} 
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                onError={(e) => { e.target.src = 'https://via.placeholder.com/150/111111/444444?text=ERROR'; }}
              />
            </div>
          ))}
        </div>
      )}

      {/* FULLSCREEN VIEWER WITH NAVIGATION */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col animate-fadeIn">
          
          {/* Top Bar */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 inset-x-0 z-10">
            <div className="flex flex-col max-w-[75%]">
              <span className="text-xs font-mono text-zinc-300 truncate">{displayedImages[selectedImageIndex].name}</span>
              <span className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest">{displayedImages[selectedImageIndex].folder} • {selectedImageIndex + 1} / {displayedImages.length}</span>
            </div>
            <button 
              onClick={() => setSelectedImageIndex(null)} 
              className="w-10 h-10 bg-zinc-900/80 backdrop-blur rounded-full flex items-center justify-center text-sm font-bold border border-zinc-700 active:scale-95"
            >
              ✕
            </button>
          </div>

          {/* Main Image Area */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden" onClick={() => setSelectedImageIndex(null)}>
            
            {/* Left Prev Hitbox */}
            <div onClick={handlePrev} className="absolute left-0 inset-y-0 w-1/4 z-20 flex items-center justify-start p-4 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
               {selectedImageIndex > 0 && <div className="w-12 h-12 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white text-xl border border-zinc-700 shadow-xl">◀</div>}
            </div>

            <img 
              src={getWebUrl(displayedImages[selectedImageIndex].path)} 
              alt={displayedImages[selectedImageIndex].name} 
              onClick={(e) => e.stopPropagation()} // Prevent closing when tapping image
              className="max-w-full max-h-screen object-contain" 
            />

            {/* Right Next Hitbox */}
            <div onClick={handleNext} className="absolute right-0 inset-y-0 w-1/4 z-20 flex items-center justify-end p-4 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
               {selectedImageIndex < displayedImages.length - 1 && <div className="w-12 h-12 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white text-xl border border-zinc-700 shadow-xl">▶</div>}
            </div>
            
          </div>

          {/* Bottom Bar */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10 text-center">
             <span className="bg-zinc-900/80 backdrop-blur border border-zinc-700 px-3 py-1.5 rounded-xl text-[9px] font-mono text-zinc-400 truncate inline-block max-w-full shadow-lg">
                {displayedImages[selectedImageIndex].path}
             </span>
          </div>
        </div>
      )}
    </div>
  );
}
