import React, { useState, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function Gallery() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [activeFolder, setActiveFolder] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Custom Slideshow Configuration State
  const [showSlideshowConfig, setShowSlideshowConfig] = useState(false);
  const [isSlideshowRunning, setIsSlideshowRunning] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [slideshowSpeed, setSlideshowSpeed] = useState(3000); // Default 3s
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const loadPhysicalGallery = () => {
    if (window.AndroidNative && window.AndroidNative.getSovereignGalleryPhotos) {
      try {
        const rawJson = window.AndroidNative.getSovereignGalleryPhotos();
        const parsed = JSON.parse(rawJson);
        setGalleryItems(parsed);
      } catch (err) {
        console.error("Gallery scan error:", err);
      }
    }
  };

  useEffect(() => {
    loadPhysicalGallery();
  }, []);

  // Customizable Slideshow Loop Engine
  useEffect(() => {
    let interval;
    if (isSlideshowRunning && !isPaused && galleryItems.length > 0) {
      interval = setInterval(() => {
        setSlideshowIndex(prev => {
          if (isShuffle) {
            return Math.floor(Math.random() * galleryItems.length);
          }
          if (prev + 1 >= galleryItems.length) {
            if (!isLooping) {
              setIsSlideshowRunning(false);
              return prev;
            }
            return 0;
          }
          return prev + 1;
        });
      }, slideshowSpeed);
    }
    return () => clearInterval(interval);
  }, [isSlideshowRunning, isPaused, galleryItems.length, slideshowSpeed, isShuffle, isLooping]);

  const filteredItems = galleryItems.filter(item => {
    if (activeFolder === 'All') return true;
    if (activeFolder === 'Photos') return item.type === 'image';
    if (activeFolder === 'Videos') return item.type === 'video';
    return item.folder === activeFolder;
  });

  const deleteItem = (item) => {
    if (item.absolutePath && window.AndroidNative && window.AndroidNative.shredFileByAbsolutePath) {
      window.AndroidNative.shredFileByAbsolutePath(item.absolutePath);
    } else if (item.uri && window.AndroidNative && window.AndroidNative.shredFileByUri) {
      window.AndroidNative.shredFileByUri(item.uri);
    }
    setGalleryItems(prev => prev.filter(i => i.id !== item.id));
    setSelectedItem(null);
    setTimeout(() => loadPhysicalGallery(), 500);
  };

  const startCustomSlideshow = () => {
    if (filteredItems.length === 0) return;
    setSlideshowIndex(0);
    setIsPaused(false);
    setShowSlideshowConfig(false);
    setIsSlideshowRunning(true);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      
      {/* Header */}
      <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🖼️ Auto-Import Secure Gallery
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Auto-scans device media with customizable slideshow.
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={loadPhysicalGallery}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 text-cyan-400 font-bold text-xs rounded-xl shadow"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowSlideshowConfig(!showSlideshowConfig)}
            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl shadow flex items-center gap-1"
          >
            <span>▶️</span>
            <span>Slideshow</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold py-2 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      {/* SLIDESHOW CUSTOMIZATION MODAL */}
      {showSlideshowConfig && (
        <div className="bg-zinc-900/95 p-4 rounded-2xl border border-emerald-500/50 space-y-3">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            ⚙️ Slideshow Customization Settings
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-zinc-400 font-mono uppercase">Display Speed (Interval)</label>
              <select
                value={slideshowSpeed}
                onChange={e => setSlideshowSpeed(Number(e.target.value))}
                className="w-full bg-black border border-zinc-800 text-white rounded-xl p-2 mt-1 focus:outline-none focus:border-cyan-500 font-bold"
              >
                <option value={1000}>⚡ 1 Second</option>
                <option value={2000}>⚡ 2 Seconds</option>
                <option value={3000}>⏱️ 3 Seconds (Default)</option>
                <option value={5000}>⏱️ 5 Seconds</option>
                <option value={10000}>🐢 10 Seconds</option>
                <option value={15000}>🐢 15 Seconds</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-mono uppercase">Playback Mode</label>
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={`w-full py-2 px-3 rounded-xl border mt-1 font-bold ${
                  isShuffle ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-black text-zinc-300 border-zinc-800'
                }`}
              >
                {isShuffle ? '🔀 Shuffle Order' : '➡️ Sequential Order'}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                isLooping ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-black text-zinc-500 border-zinc-800'
              }`}
            >
              🔁 Loop Continuously: {isLooping ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={startCustomSlideshow}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase rounded-xl shadow"
            >
              ▶ Start Custom Slideshow
            </button>
          </div>
        </div>
      )}

      {/* ALBUM / FOLDER SELECTOR CAROUSEL */}
      <div className="flex space-x-1 overflow-x-auto text-xs font-bold bg-zinc-900/80 p-2 rounded-2xl border border-zinc-800">
        {['All', 'Photos', 'Videos', 'Sovereign Camera', 'Camera', 'Screenshots', 'Downloads', 'Pictures'].map(folder => (
          <button
            key={folder}
            onClick={() => setActiveFolder(folder)}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeFolder === folder ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {folder}
          </button>
        ))}
      </div>

      {/* AUTO-SCAN MEDIA GRID */}
      {filteredItems.length === 0 ? (
        <div className="bg-zinc-900/60 p-8 border-2 border-dashed border-zinc-800 rounded-2xl text-center space-y-2">
          <span className="text-3xl">🖼️</span>
          <div className="text-xs font-bold text-zinc-300">No Media Found in "{activeFolder}"</div>
          <p className="text-[10px] text-zinc-500 max-w-xs mx-auto">
            Media snapped with Camera or downloaded to device storage auto-imports here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group relative rounded-xl overflow-hidden bg-black border border-zinc-800 aspect-square cursor-pointer hover:border-cyan-500 transition-all flex items-center justify-center"
            >
              {item.type === 'video' ? (
                <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center relative">
                  <span className="text-3xl">🎥</span>
                  <span className="text-[9px] font-mono text-cyan-400 mt-1 font-bold">VIDEO</span>
                </div>
              ) : (
                <img src={item.cleanUrl} alt={item.name} className="w-full h-full object-cover" />
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 flex justify-between items-end">
                <span className="text-[9px] font-mono text-cyan-300 font-bold truncate max-w-[75%]">{item.name}</span>
                <span className="text-[8px] bg-emerald-500/80 text-black font-black px-1 rounded uppercase">
                  {item.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MEDIA INSPECTOR MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-4 flex flex-col justify-between overflow-y-auto">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              🔬 {selectedItem.type === 'video' ? 'Native Video Player' : 'Media Inspector'}
            </h3>
            <button
              onClick={() => setSelectedItem(null)}
              className="p-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold"
            >
              ✕ Close
            </button>
          </div>

          <div className="my-auto space-y-4 max-w-lg mx-auto w-full py-4">
            <div className="rounded-2xl overflow-hidden border border-zinc-800 max-h-80 bg-black flex justify-center items-center relative">
              {selectedItem.type === 'video' ? (
                <video src={selectedItem.cleanUrl} controls autoPlay className="w-full max-h-80 object-contain" />
              ) : (
                <img src={selectedItem.cleanUrl} alt="Preview" className="max-h-80 object-contain" />
              )}
            </div>

            <div className="bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-500">File Name:</span>
                <span className="text-white font-bold truncate max-w-[200px]">{selectedItem.name}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-500">Storage Size:</span>
                <span className="text-cyan-300">{selectedItem.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Album Category:</span>
                <span className="text-emerald-400 font-bold">{selectedItem.folder}</span>
              </div>
            </div>

            <button
              onClick={() => deleteItem(selectedItem)}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg"
            >
              🗑️ Shred & Remove from Device
            </button>
          </div>
        </div>
      )}

      {/* FULL-SCREEN CUSTOM SLIDESHOW OVERLAY */}
      {isSlideshowRunning && galleryItems.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 select-none">
          
          {/* Top Control Overlay */}
          <div className="flex justify-between items-center z-10 bg-black/80 p-3 rounded-2xl border border-zinc-800 backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-emerald-400 font-bold">
                ▶️ Slideshow ({slideshowIndex + 1} / {galleryItems.length})
              </span>
              {isShuffle && <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded-md font-bold">SHUFFLE</span>}
            </div>

            <div className="flex space-x-2 items-center">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`text-xs px-3 py-1 rounded-xl font-bold border ${
                  isPaused ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-800 text-white border-zinc-700'
                }`}
              >
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>

              <button
                onClick={() => setIsSlideshowRunning(false)}
                className="text-xs bg-red-600 text-white px-3 py-1 rounded-xl font-bold shadow"
              >
                ⏹️ Exit
              </button>
            </div>
          </div>

          {/* Center Frame Viewport with Manual Navigation Arrows */}
          <div className="flex-1 flex items-center justify-between my-auto relative">
            <button
              onClick={() => setSlideshowIndex(prev => (prev - 1 + galleryItems.length) % galleryItems.length)}
              className="absolute left-2 z-20 p-3 bg-black/60 hover:bg-black text-white rounded-full border border-zinc-700 font-bold text-sm"
            >
              ◀
            </button>

            <div className="w-full h-full flex items-center justify-center p-2">
              {galleryItems[slideshowIndex].type === 'video' ? (
                <video src={galleryItems[slideshowIndex].cleanUrl} autoPlay muted className="max-h-full max-w-full object-contain" />
              ) : (
                <img src={galleryItems[slideshowIndex].cleanUrl} alt="Slideshow Frame" className="max-h-full max-w-full object-contain transition-all duration-300" />
              )}
            </div>

            <button
              onClick={() => setSlideshowIndex(prev => (prev + 1) % galleryItems.length)}
              className="absolute right-2 z-20 p-3 bg-black/60 hover:bg-black text-white rounded-full border border-zinc-700 font-bold text-sm"
            >
              ▶
            </button>
          </div>

          {/* Bottom Caption Overlay */}
          <div className="bg-black/80 p-2 rounded-xl border border-zinc-800 text-center font-mono text-xs text-cyan-400 z-10 truncate">
            {galleryItems[slideshowIndex].name} • {galleryItems[slideshowIndex].folder}
          </div>
        </div>
      )}

      <ToolFooter
        title="Auto-Import Gallery Engine"
        details="Automatically indexes all device photos and video recordings into local album viewports."
        disclaimer="Zero cloud syncing telemetry."
      />
    </div>
  );
}
