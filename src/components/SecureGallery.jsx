import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';

export function SecureGallery({ onNavigate }) {
  const { indexedFiles, isScanning, runGlobalScan } = useStorage();
  const [filter, setFilter] = useState('All');
  const [selectedMedia, setSelectedMedia] = useState(null);

  const mediaFiles = indexedFiles.filter(f => ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm'].includes(f.ext));
  
  const filteredFiles = mediaFiles.filter(f => {
    if (filter === 'Photos') return ['jpg', 'jpeg', 'png', 'webp'].includes(f.ext);
    if (filter === 'Videos') return ['mp4', 'webm'].includes(f.ext);
    if (filter === 'Camera') return f.name.startsWith('SOV_');
    return true;
  });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-900 pb-3 pt-2">
         <div>
           <h2 className="text-xl font-bold text-white flex items-center gap-2">🖼️ Secure Gallery</h2>
           <p className="text-xs text-zinc-400 mt-1">Local catalog ({mediaFiles.length} items)</p>
         </div>
         <button onClick={runGlobalScan} className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95">
           {isScanning ? 'Scanning...' : 'Refresh'}
         </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 overflow-x-auto no-scrollbar">
        {['All', 'Photos', 'Videos', 'Camera'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors ${filter === f ? 'theme-accent-bg text-black shadow' : 'text-zinc-400 hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Clean Grid (No Nuke Buttons) */}
      <div className="grid grid-cols-2 gap-3">
        {filteredFiles.map((f, idx) => (
           <div key={idx} onClick={() => setSelectedMedia(f)} className="aspect-square bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden relative cursor-pointer active:scale-95 transition-transform">
             {['mp4', 'webm'].includes(f.ext) ? (
                <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                  <span className="text-4xl">🎬</span>
                  <span className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded text-[9px] font-bold">VIDEO</span>
                </div>
             ) : (
                <img src={f.src} alt={f.name} className="w-full h-full object-cover" loading="lazy" />
             )}
             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
               <p className="text-[10px] text-zinc-300 truncate font-mono">{f.name}</p>
             </div>
           </div>
        ))}
      </div>

      {filteredFiles.length === 0 && !isScanning && (
        <div className="text-center text-zinc-500 text-xs font-mono py-12">No media found.</div>
      )}

      {/* Fullscreen Lightbox Viewer */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col animate-fadeIn">
           <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
             <p className="text-xs font-mono text-zinc-300 truncate pr-4">{selectedMedia.name}</p>
             <button onClick={() => setSelectedMedia(null)} className="bg-zinc-900 text-white px-4 py-2 rounded-full text-xs font-bold border border-zinc-700 active:scale-95">Close</button>
           </div>
           <div className="flex-1 flex items-center justify-center p-4">
             {['mp4', 'webm'].includes(selectedMedia.ext) ? (
                <video src={selectedMedia.src} controls autoPlay className="max-w-full max-h-full rounded-lg" />
             ) : (
                <img src={selectedMedia.src} className="max-w-full max-h-full object-contain rounded-lg" />
             )}
           </div>
        </div>
      )}
    </div>
  );
}
