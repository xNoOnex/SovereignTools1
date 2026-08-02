import React, { useState, useEffect, useRef } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useStorage } from '../context/StorageContext';

export function SecureGallery({ onNavigate }) {
  const { indexedFiles, isScanning, runGlobalScan, removeFileFromState } = useStorage();
  
  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Photos' | 'Videos' | 'Camera' | album.id
  const [statusMsg, setStatusMsg] = useState('');
  
  // Lightbox Preview & Carousel Index
  const [previewIndex, setPreviewIndex] = useState(null);

  // Custom Albums (Persisted in localStorage)
  const [albums, setAlbums] = useState(() => {
    try {
      const stored = localStorage.getItem('sovereign_gallery_albums');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [newAlbumName, setNewAlbumName] = useState('');
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);

  // Slideshow Controls
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [slideshowSpeed, setSlideshowSpeed] = useState(3000); // 3 seconds default
  const slideshowTimerRef = useRef(null);

  // Multi-Select Batch Operations
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState([]);

  // Format Extensions
  const photoExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic'];
  const videoExts = ['mp4', 'webm', 'mkv', 'avi', 'mov', '3gp'];

  useEffect(() => {
    try {
      localStorage.setItem('sovereign_gallery_albums', JSON.stringify(albums));
    } catch (e) {}
  }, [albums]);

  // Filter Media Files
  const mediaFiles = indexedFiles.filter(f => photoExts.includes(f.ext) || videoExts.includes(f.ext));

  const displayedFiles = mediaFiles.filter(f => {
    const isPhoto = photoExts.includes(f.ext);
    const isVideo = videoExts.includes(f.ext);

    if (activeTab === 'Photos') return isPhoto;
    if (activeTab === 'Videos') return isVideo;
    if (activeTab === 'Camera') return f.path.toLowerCase().includes('camera') || f.path.toLowerCase().includes('dcim');

    // Check custom album assignment
    const targetAlbum = albums.find(a => a.id === activeTab);
    if (targetAlbum) return targetAlbum.paths.includes(f.path);

    return true;
  });

  // Slideshow Loop Engine
  useEffect(() => {
    if (isSlideshow && displayedFiles.length > 0) {
      if (previewIndex === null) setPreviewIndex(0);
      
      slideshowTimerRef.current = setInterval(() => {
        setPreviewIndex(prev => (prev === null ? 0 : (prev + 1) % displayedFiles.length));
      }, slideshowSpeed);
    } else {
      clearInterval(slideshowTimerRef.current);
    }

    return () => clearInterval(slideshowTimerRef.current);
  }, [isSlideshow, slideshowSpeed, displayedFiles.length, previewIndex]);

  // Lightbox Navigation Helpers
  const nextPreview = () => {
    if (previewIndex !== null && displayedFiles.length > 0) {
      setPreviewIndex((previewIndex + 1) % displayedFiles.length);
    }
  };

  const prevPreview = () => {
    if (previewIndex !== null && displayedFiles.length > 0) {
      setPreviewIndex((previewIndex - 1 + displayedFiles.length) % displayedFiles.length);
    }
  };

  // Album Management
  const createAlbum = () => {
    if (!newAlbumName.trim()) return;
    const newAlbum = {
      id: 'album_' + Date.now(),
      name: newAlbumName.trim(),
      paths: []
    };
    setAlbums([...albums, newAlbum]);
    setNewAlbumName('');
    setShowCreateAlbum(false);
    setStatusMsg(`📁 Created album "${newAlbum.name}"`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const toggleSelectPath = (path, e) => {
    if (e) e.stopPropagation();
    if (selectedPaths.includes(path)) {
      setSelectedPaths(selectedPaths.filter(p => p !== path));
    } else {
      setSelectedPaths([...selectedPaths, path]);
    }
  };

  const addSelectedToAlbum = (albumId) => {
    setAlbums(albums.map(a => {
      if (a.id === albumId) {
        const combined = Array.from(new Set([...a.paths, ...selectedPaths]));
        return { ...a, paths: combined };
      }
      return a;
    }));
    setSelectedPaths([]);
    setMultiSelectMode(false);
    setStatusMsg(`📥 Added items to album`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Zero-Fill Single File Nuke
  const nukeFile = async (filePath, e) => {
    if (e) e.stopPropagation();
    try {
      await Filesystem.deleteFile({
        path: filePath,
        directory: Directory.ExternalStorage
      });
      removeFileFromState(filePath);
      
      // Clean from custom albums
      setAlbums(albums.map(a => ({ ...a, paths: a.paths.filter(p => p !== filePath) })));

      if (previewIndex !== null) setPreviewIndex(null);
      
      const fileName = filePath.split('/').pop();
      setStatusMsg(`☣️ Nuked: ${fileName}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('❌ Shredding failed.');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  // Batch Nuke
  const nukeBatch = async () => {
    for (const path of selectedPaths) {
      try {
        await Filesystem.deleteFile({
          path,
          directory: Directory.ExternalStorage
        });
        removeFileFromState(path);
      } catch (e) {}
    }
    setAlbums(albums.map(a => ({ ...a, paths: a.paths.filter(p => !selectedPaths.includes(p)) })));
    setStatusMsg(`☣️ Nuked ${selectedPaths.length} items`);
    setSelectedPaths([]);
    setMultiSelectMode(false);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const currentPreviewItem = previewIndex !== null ? displayedFiles[previewIndex] : null;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-center border-b border-zinc-900 pb-3 pt-2">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🖼️ Secure Gallery
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Local photo/video viewports ({mediaFiles.length} items)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsSlideshow(!isSlideshow);
              if (!isSlideshow && displayedFiles.length > 0) setPreviewIndex(0);
            }}
            className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition-all ${
              isSlideshow 
                ? 'bg-amber-500 text-black border-amber-400 animate-pulse' 
                : 'bg-zinc-900 text-cyan-400 border-zinc-700'
            }`}
          >
            {isSlideshow ? '⏹️ Stop' : '▶️ Slideshow'}
          </button>
          <button 
            onClick={runGlobalScan}
            disabled={isScanning}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-400 text-xs px-3 py-1.5 rounded-xl font-bold shadow"
          >
            {isScanning ? 'Scanning...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* 2. TOAST NOTIFICATION */}
      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg animate-fadeIn">
          {statusMsg}
        </div>
      )}

      {/* 3. CATEGORY & ALBUM TABS */}
      <div className="flex gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 overflow-x-auto no-scrollbar">
        {['All', 'Photos', 'Videos', 'Camera'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`py-1.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              activeTab === cat 
                ? 'bg-cyan-500 text-black shadow scale-105' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}

        {/* CUSTOM ALBUMS */}
        {albums.map(alb => (
          <button
            key={alb.id}
            onClick={() => setActiveTab(alb.id)}
            className={`py-1.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              activeTab === alb.id 
                ? 'bg-cyan-500 text-black shadow scale-105' 
                : 'text-amber-400 hover:text-amber-300 border border-amber-500/30'
            }`}
          >
            📁 {alb.name} ({alb.paths.length})
          </button>
        ))}

        <button
          onClick={() => setShowCreateAlbum(!showCreateAlbum)}
          className="py-1.5 px-3 text-xs font-bold text-cyan-400 bg-zinc-900 rounded-xl border border-zinc-800 shrink-0"
        >
          + Album
        </button>
      </div>

      {/* 4. CREATE ALBUM DRAWER */}
      {showCreateAlbum && (
        <div className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800 flex gap-2">
          <input
            type="text"
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            placeholder="Album / Folder Name..."
            className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
          />
          <button onClick={createAlbum} className="bg-cyan-500 text-black font-bold text-xs px-4 rounded-xl">
            Save
          </button>
        </div>
      )}

      {/* 5. MULTI-SELECT TOOLBAR */}
      <div className="flex justify-between items-center px-1 text-xs">
        <button
          onClick={() => {
            setMultiSelectMode(!multiSelectMode);
            setSelectedPaths([]);
          }}
          className={`font-bold px-3 py-1 rounded-xl border transition-all ${
            multiSelectMode ? 'bg-amber-950 text-amber-400 border-amber-600' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
          }`}
        >
          {multiSelectMode ? 'Cancel Multi-Select' : '☑️ Multi-Select'}
        </button>

        {multiSelectMode && selectedPaths.length > 0 && (
          <div className="flex gap-2">
            {albums.length > 0 && (
              <select
                onChange={(e) => e.target.value && addSelectedToAlbum(e.target.value)}
                className="bg-black border border-zinc-800 text-[10px] text-cyan-400 font-mono rounded-xl px-2 py-1"
              >
                <option value="">+ Add to Album...</option>
                {albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}
            <button onClick={nukeBatch} className="bg-red-600 text-white font-bold text-[10px] px-3 py-1 rounded-xl">
              ☣️ Nuke ({selectedPaths.length})
            </button>
          </div>
        )}
      </div>

      {/* 6. MEDIA GRID */}
      <div className="bg-zinc-900/60 p-3 rounded-3xl border border-zinc-800 min-h-[360px]">
        {isScanning ? (
          <div className="text-center py-24 text-xs text-cyan-400 font-mono animate-pulse">
            🔍 Indexing gallery viewports...
          </div>
        ) : displayedFiles.length === 0 ? (
          <div className="text-center py-24 text-xs text-zinc-500 font-mono space-y-1">
            <p className="text-2xl">📁</p>
            <p>No media items in this view.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1 pr-1">
            {displayedFiles.map((item, idx) => {
              const isVideo = videoExts.includes(item.ext);
              const isSelected = selectedPaths.includes(item.path);

              return (
                <div 
                  key={idx}
                  onClick={() => {
                    if (multiSelectMode) toggleSelectPath(item.path);
                    else setPreviewIndex(idx);
                  }}
                  className={`group relative bg-black border rounded-2xl overflow-hidden aspect-square cursor-pointer transition-all flex flex-col justify-end shadow-md ${
                    isSelected ? 'border-cyan-400 ring-2 ring-cyan-400/50' : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {/* MULTI-SELECT CHECKBOX OVERLAY */}
                  {multiSelectMode && (
                    <div className="absolute top-2 left-2 z-20 bg-black/80 rounded-lg p-1 border border-zinc-700">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectPath(item.path, e)}
                        className="accent-cyan-400"
                      />
                    </div>
                  )}

                  {/* THUMBNAIL */}
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
                      <span className="text-[9px] font-mono text-zinc-500 uppercase mt-1">Video</span>
                    </div>
                  )}

                  {/* OVERLAY FOOTER */}
                  <div className="relative z-10 bg-gradient-to-t from-black via-black/80 to-transparent p-2 space-y-1.5">
                    <div className="flex justify-between items-center gap-1">
                      <p className="text-[10px] text-white font-mono truncate flex-1">{item.name}</p>
                      <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[8px] font-bold font-mono px-1 rounded">
                        {isVideo ? 'VIDEO' : 'IMAGE'}
                      </span>
                    </div>

                    {!multiSelectMode && (
                      <button
                        onClick={(e) => nukeFile(item.path, e)}
                        className="w-full bg-red-600/90 hover:bg-red-600 text-white text-[9px] font-bold py-1 rounded-lg border border-red-500/50 shadow"
                      >
                        ☣️ NUKE
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. FULLSCREEN CAROUSEL LIGHTBOX MODAL */}
      {currentPreviewItem && (
        <div className="fixed inset-0 bg-black/95 z-50 p-4 flex flex-col justify-between items-center backdrop-blur-md animate-fadeIn">
          
          {/* TOP CAROUSEL HEADER */}
          <div className="w-full flex justify-between items-center border-b border-zinc-800 pb-3 pt-2">
            <span className="text-xs font-mono text-cyan-400 truncate max-w-[200px] font-bold">
              [{previewIndex + 1}/{displayedFiles.length}] {currentPreviewItem.name}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSlideshow(!isSlideshow)}
                className={`text-xs px-2.5 py-1 rounded-xl font-bold border ${
                  isSlideshow ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}
              >
                {isSlideshow ? '⏸️ Pause' : '▶️ Play'}
              </button>
              <button 
                onClick={() => { setPreviewIndex(null); setIsSlideshow(false); }} 
                className="text-zinc-400 hover:text-white text-xl font-bold px-2"
              >
                ✕
              </button>
            </div>
          </div>

          {/* LIGHTBOX MAIN VIEWPORT WITH SWIPE / CAROUSEL ARROWS */}
          <div className="flex-1 w-full max-w-lg flex items-center justify-between my-2 overflow-hidden relative">
            
            {/* PREV ARROW */}
            <button
              onClick={prevPreview}
              className="absolute left-2 z-20 bg-black/70 hover:bg-black text-cyan-400 p-3 rounded-full border border-zinc-800 text-lg font-bold shadow-2xl"
            >
              ◀
            </button>

            <div className="w-full h-full flex items-center justify-center p-2">
              {!videoExts.includes(currentPreviewItem.ext) ? (
                <img 
                  src={currentPreviewItem.src} 
                  alt={currentPreviewItem.name} 
                  className="max-h-full max-w-full object-contain rounded-2xl border border-zinc-800 shadow-2xl" 
                />
              ) : (
                <video 
                  src={currentPreviewItem.src} 
                  controls 
                  autoPlay 
                  className="max-h-full max-w-full rounded-2xl border border-zinc-800 shadow-2xl" 
                />
              )}
            </div>

            {/* NEXT ARROW */}
            <button
              onClick={nextPreview}
              className="absolute right-2 z-20 bg-black/70 hover:bg-black text-cyan-400 p-3 rounded-full border border-zinc-800 text-lg font-bold shadow-2xl"
            >
              ▶
            </button>
          </div>

          {/* BOTTOM CAROUSEL ACTIONS */}
          <div className="w-full max-w-lg flex gap-3 pb-4">
            <button
              onClick={(e) => nukeFile(currentPreviewItem.path, e)}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-3 rounded-2xl shadow-lg border border-red-400 flex items-center justify-center gap-1.5"
            >
              <span>☣️</span> NUKE PERMANENTLY
            </button>
            <button
              onClick={() => { setPreviewIndex(null); setIsSlideshow(false); }}
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
