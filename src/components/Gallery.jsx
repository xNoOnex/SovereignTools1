import React, { useState, useEffect, useRef } from 'react';
import { ToolFooter } from './ToolFooter';

export function Gallery() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [activeFolder, setActiveFolder] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isFullscreenView, setIsFullscreenView] = useState(false);
  
  // Slideshow State
  const [isSlideshowRunning, setIsSlideshowRunning] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [slideshowSpeed, setSlideshowSpeed] = useState(3000); // 3 seconds
  const [statusMsg, setStatusMsg] = useState('');

  const fileInputRef = useRef(null);

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

  // Automated Slideshow Loop
  useEffect(() => {
    let interval;
    if (isSlideshowRunning && galleryItems.length > 0) {
      interval = setInterval(() => {
        setSlideshowIndex(prev => (prev + 1) % galleryItems.length);
      }, slideshowSpeed);
    }
    return () => clearInterval(interval);
  }, [isSlideshowRunning, galleryItems.length, slideshowSpeed]);

  const handleImport = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const cleanBase64 = canvas.toDataURL('image/jpeg', 0.95);
          const filename = `Scrubbed_${Date.now()}.jpg`;

          if (window.AndroidNative && window.AndroidNative.saveToGallery) {
            window.AndroidNative.saveToGallery(cleanBase64, filename, 'image/jpeg');
          }

          setTimeout(() => loadPhysicalGallery(), 500);
        };
      };
      reader.readAsDataURL(file);
    });

    setStatusMsg(`🖼️ Imported & Saved ${files.length} Photo(s)`);
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const filteredItems = galleryItems.filter(item => {
    if (activeFolder === 'All') return true;
    if (activeFolder === 'Photos') return item.type === 'image';
    if (activeFolder === 'Videos') return item.type === 'video';
    return item.folder === activeFolder;
  });

  const deleteItem = (item) => {
    if (item.uri && window.AndroidNative && window.AndroidNative.shredFileByUri) {
      window.AndroidNative.shredFileByUri(item.uri);
    }
    setGalleryItems(prev => prev.filter(i => i.id !== item.id));
    setSelectedItem(null);
    setIsFullscreenView(false);
    setTimeout(() => loadPhysicalGallery(), 500);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      
      {/* Header */}
      <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🖼️ Persistent Secure Gallery
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Albums, native video streaming player, and automated slideshow.
          </p>
        </div>
        
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
          id="gallery-import-input"
        />
        <label
          htmlFor="gallery-import-input"
          className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
        >
          <span>📥</span>
          <span>Import Media</span>
        </label>
      </div>

      {statusMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold py-2 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      {/* ALBUM / FOLDER SELECTOR CAROUSEL */}
      <div className="flex justify-between items-center bg-zinc-900/80 p-2 rounded-2xl border border-zinc-800">
        <div className="flex space-x-1 overflow-x-auto text-xs font-bold">
          {['All', 'Photos', 'Videos', 'Camera Photos', 'Camera Videos', 'Imported Photos'].map(folder => (
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

        <button
          onClick={() => {
            if (filteredItems.length === 0) return;
            setIsSlideshowRunning(true);
            setSlideshowIndex(0);
          }}
          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl shadow flex items-center gap-1"
        >
          <span>▶️</span>
          <span>Slideshow</span>
        </button>
      </div>

      {/* MEDIA GRID */}
      {filteredItems.length === 0 ? (
        <div className="bg-zinc-900/60 p-8 border-2 border-dashed border-zinc-800 rounded-2xl text-center space-y-2">
          <span className="text-3xl">🖼️</span>
          <div className="text-xs font-bold text-zinc-300">No Media Found in "{activeFolder}"</div>
          <p className="text-[10px] text-zinc-500 max-w-xs mx-auto">
            Photos snapped in Camera mode or imported using the "Import Media" button above will be listed here.
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

      {/* MEDIA INSPECTOR & NATIVE VIDEO STREAMING MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-4 flex flex-col justify-between overflow-y-auto">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              🔬 {selectedItem.type === 'video' ? 'Native Video Streamer' : 'Media Inspector'}
            </h3>
            <button
              onClick={() => setSelectedItem(null)}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold"
            >
              ✕ Close
            </button>
          </div>

          <div className="my-auto space-y-4 max-w-lg mx-auto w-full py-4">
            <div className="rounded-2xl overflow-hidden border border-zinc-800 max-h-80 bg-black flex justify-center items-center relative">
              {selectedItem.type === 'video' ? (
                <video
                  src={selectedItem.cleanUrl}
                  controls
                  autoPlay
                  className="w-full max-h-80 object-contain"
                />
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
                <span className="text-zinc-500">Folder Album:</span>
                <span className="text-emerald-400 font-bold">{selectedItem.folder}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsFullscreenView(true)}
                className="py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow-lg"
              >
                🔲 Full Screen View
              </button>
              <button
                onClick={() => deleteItem(selectedItem)}
                className="py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-xs rounded-xl border border-red-500/40"
              >
                🗑️ Shred & Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN OVERLAY VIEW */}
      {isFullscreenView && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4">
          <div className="flex justify-between items-center z-10">
            <span className="text-xs font-mono text-cyan-400 font-bold">{selectedItem.name}</span>
            <button
              onClick={() => setIsFullscreenView(false)}
              className="px-3 py-1.5 bg-zinc-800 text-white text-xs font-bold rounded-xl"
            >
              ❌ Exit Fullscreen
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center my-auto">
            {selectedItem.type === 'video' ? (
              <video src={selectedItem.cleanUrl} controls autoPlay className="w-full h-full object-contain" />
            ) : (
              <img src={selectedItem.cleanUrl} alt="Fullscreen" className="w-full h-full object-contain" />
            )}
          </div>
        </div>
      )}

      {/* AUTOMATED SLIDESHOW OVERLAY */}
      {isSlideshowRunning && galleryItems.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4">
          <div className="flex justify-between items-center z-10 bg-black/80 p-2.5 rounded-2xl border border-zinc-800">
            <span className="text-xs font-mono text-emerald-400 font-bold">
              ▶️ Slideshow ({slideshowIndex + 1} / {galleryItems.length})
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setSlideshowSpeed(prev => prev === 3000 ? 5000 : prev === 5000 ? 10000 : 3000)}
                className="text-xs bg-zinc-800 text-cyan-300 px-2.5 py-1 rounded-xl border border-zinc-700 font-bold"
              >
                ⏱️ {slideshowSpeed / 1000}s
              </button>
              <button
                onClick={() => setIsSlideshowRunning(false)}
                className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-xl border border-red-500/40 font-bold"
              >
                ⏹️ Stop
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center my-auto">
            {galleryItems[slideshowIndex].type === 'video' ? (
              <video src={galleryItems[slideshowIndex].cleanUrl} autoPlay muted className="w-full h-full object-contain" />
            ) : (
              <img src={galleryItems[slideshowIndex].cleanUrl} alt="Slideshow" className="w-full h-full object-contain transition-all duration-300" />
            )}
          </div>
        </div>
      )}

      <ToolFooter
        title="Persistent Gallery & Streaming Engine"
        details="Renders persistent photos and streams local video recordings directly from device storage."
        disclaimer="All files persist with zero cloud tracking telemetry."
      />
    </div>
  );
}
