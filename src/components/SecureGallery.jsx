import React, { useState, useEffect, useRef } from 'react';
import { useStorage } from '../context/StorageContext';
import { StatusBar } from '@capacitor/status-bar';

export function SecureGallery({ onNavigate }) {
  const { indexedFiles, runGlobalScan } = useStorage();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(null); // null = grid view
  const [zoomScale, setZoomScale] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showUI, setShowUI] = useState(true);

  // Slideshow State
  const [slideshow, setSlideshow] = useState({
    active: false,
    interval: 3, // seconds
    shuffle: false,
    repeat: true
  });

  const mediaFiles = indexedFiles.filter(f => 
    ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(f.ext?.toLowerCase())
  );
  
  const filteredMedia = mediaFiles.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- FULLSCREEN HARDWARE CONTROL ---
  const openFullScreen = async (index) => {
    setActiveIndex(index);
    setZoomScale(1);
    setShowUI(true);
    try { await StatusBar.hide(); } catch (e) {} // Hide Android clock/battery
  };

  const closeFullScreen = async () => {
    setActiveIndex(null);
    setSlideshow(prev => ({ ...prev, active: false }));
    try { await StatusBar.show(); } catch (e) {} // Restore Android clock/battery
  };

  // --- NAVIGATION LOGIC ---
  const nextImage = (e) => {
    if (e) e.stopPropagation();
    setZoomScale(1);
    setActiveIndex(prev => {
      if (slideshow.shuffle) return Math.floor(Math.random() * filteredMedia.length);
      if (prev === filteredMedia.length - 1) return slideshow.repeat ? 0 : prev;
      return prev + 1;
    });
  };

  const prevImage = (e) => {
    if (e) e.stopPropagation();
    setZoomScale(1);
    setActiveIndex(prev => {
      if (prev === 0) return filteredMedia.length - 1;
      return prev - 1;
    });
  };

  // --- SLIDESHOW ENGINE ---
  useEffect(() => {
    let timer;
    if (slideshow.active && activeIndex !== null) {
      setShowUI(false); // Auto-hide UI during slideshow
      timer = setInterval(nextImage, slideshow.interval * 1000);
    }
    return () => clearInterval(timer);
  }, [slideshow, activeIndex, filteredMedia.length]);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen relative z-10 animate-fadeIn">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-2xl drop-shadow">🖼️</span> Secure Gallery</h2>
          <p className="text-[10px] text-zinc-400 mt-1 font-mono">Offline EXIF-free visualizer.</p>
        </div>
        <button onClick={runGlobalScan} className="bg-zinc-900 border border-zinc-700 text-cyan-400 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 shadow">Rescan</button>
      </div>

      <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="🔍 Search images..." className="w-full bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl px-5 py-4 text-xs text-white font-mono focus:outline-none shadow-inner" />

      {/* GRID VIEW */}
      <div className="grid grid-cols-3 gap-2 pb-4">
        {filteredMedia.length === 0 ? (
          <div className="col-span-3 text-center text-zinc-500 font-mono text-xs py-12">No images indexed.</div>
        ) : (
          filteredMedia.map((file, idx) => (
            <div key={idx} onClick={() => openFullScreen(idx)} className="aspect-square bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow cursor-pointer active:scale-95 transition-transform">
              <img src={file.src} alt={file.name} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
            </div>
          ))
        )}
      </div>

      {/* IMMERSIVE FULLSCREEN MODAL */}
      {activeIndex !== null && (
        <div className="fixed inset-0 bg-black z-[9999] flex flex-col justify-center items-center overflow-hidden animate-fadeIn" onClick={() => setShowUI(!showUI)}>
          
          {/* TOP UI BAR */}
          <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-6 pt-12 flex justify-between items-start z-50 transition-opacity duration-300 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button onClick={closeFullScreen} className="w-12 h-12 bg-black/50 backdrop-blur border border-zinc-700 rounded-full flex items-center justify-center text-xl active:scale-95">✕</button>
            <div className="flex gap-3">
              <button onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }} className={`w-12 h-12 bg-black/50 backdrop-blur border rounded-full flex items-center justify-center text-xl active:scale-95 ${showSettings ? 'border-[var(--accent-text)] text-[var(--accent-text)]' : 'border-zinc-700'}`}>⚙️</button>
              <button onClick={(e) => { e.stopPropagation(); setSlideshow(p => ({ ...p, active: !p.active })); }} className={`px-4 h-12 bg-black/50 backdrop-blur border rounded-full flex items-center justify-center text-xs font-bold uppercase tracking-widest active:scale-95 ${slideshow.active ? 'border-[var(--accent-text)] text-[var(--accent-text)] shadow-[0_0_15px_var(--glass-border)]' : 'border-zinc-700'}`}>
                {slideshow.active ? '⏸ Pause' : '▶ Play'}
              </button>
            </div>
          </div>

          {/* SLIDESHOW SETTINGS PANEL */}
          {showSettings && showUI && (
            <div className="absolute top-28 right-6 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 p-5 rounded-3xl shadow-2xl z-50 w-64 space-y-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-2">Slideshow Settings</h3>
              
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-mono">Interval (Seconds): {slideshow.interval}s</label>
                <input type="range" min="1" max="10" value={slideshow.interval} onChange={(e) => setSlideshow(p => ({ ...p, interval: Number(e.target.value) }))} className="w-full accent-[var(--accent-text)]" />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 font-mono">Shuffle Orders</span>
                <input type="checkbox" checked={slideshow.shuffle} onChange={(e) => setSlideshow(p => ({ ...p, shuffle: e.target.checked }))} className="accent-[var(--accent-text)] w-4 h-4" />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 font-mono">Loop Endlessly</span>
                <input type="checkbox" checked={slideshow.repeat} onChange={(e) => setSlideshow(p => ({ ...p, repeat: e.target.checked }))} className="accent-[var(--accent-text)] w-4 h-4" />
              </div>
            </div>
          )}

          {/* MAIN IMAGE CONTAINER */}
          <div className="w-full h-full overflow-auto flex items-center justify-center relative touch-pan-x touch-pan-y">
            <img 
              src={filteredMedia[activeIndex].src} 
              alt={filteredMedia[activeIndex].name} 
              className="max-w-none transition-transform duration-200" 
              style={{ 
                transform: `scale(${zoomScale})`,
                width: zoomScale === 1 ? '100%' : 'auto',
                height: zoomScale === 1 ? '100%' : 'auto',
                objectFit: 'contain'
              }} 
            />
          </div>

          {/* INVISIBLE TAP ZONES FOR NAVIGATION */}
          <div className="absolute inset-y-0 left-0 w-1/4 z-40" onClick={prevImage}></div>
          <div className="absolute inset-y-0 right-0 w-1/4 z-40" onClick={nextImage}></div>

          {/* BOTTOM UI BAR (ZOOM & CROP) */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-6 pb-10 flex flex-col items-center gap-4 z-50 transition-opacity duration-300 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={e => e.stopPropagation()}>
            <p className="text-[10px] font-mono text-zinc-400 truncate w-full text-center px-8">{filteredMedia[activeIndex].name}</p>
            
            <div className="flex items-center gap-4 w-full max-w-sm bg-black/60 backdrop-blur border border-zinc-800 p-3 rounded-2xl">
              <button onClick={() => setZoomScale(p => Math.max(1, p - 0.5))} className="w-10 h-10 bg-zinc-900 rounded-xl font-bold active:scale-95 text-lg">-</button>
              <div className="flex-1 text-center text-[10px] font-mono text-[var(--accent-text)] tracking-widest uppercase font-bold">
                Zoom: {zoomScale}x
              </div>
              <button onClick={() => setZoomScale(p => Math.min(5, p + 0.5))} className="w-10 h-10 bg-zinc-900 rounded-xl font-bold active:scale-95 text-lg">+</button>
              <div className="w-px h-8 bg-zinc-800 mx-1"></div>
              <button onClick={() => alert("Non-destructive native cropping requires a dedicated Canvas API processing module. Coming in future update.")} className="px-4 h-10 bg-zinc-900 border border-zinc-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95">
                Crop
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
