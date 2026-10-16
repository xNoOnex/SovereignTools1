import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useStorage } from '../context/StorageContext';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import CryptoJS from 'crypto-js';

// Volatile RAM cache cleared on unmount
const volatileMediaCache = new Map();

const detectMediaKind = (file, dataUri = '') => {
  const ext = (file?.ext || file?.name?.split('.').pop() || '').toLowerCase();
  if (dataUri.startsWith('data:video/') || ['mp4', 'webm', 'mov', 'mkv', 'ogg'].includes(ext)) return 'video';
  if (dataUri.startsWith('data:image/gif') || ext === 'gif') return 'gif';
  return 'image';
};

const readVaultOrDeviceFile = async (file) => {
  try {
    return await Filesystem.readFile({
      path: file.name || file.path,
      directory: Directory.Data,
      encoding: Encoding.UTF8
    });
  } catch {
    return await Filesystem.readFile({
      path: file.path,
      encoding: Encoding.UTF8
    });
  }
};

const SecureMediaNode = ({ file, className, onClick, isFullscreen = false, zoom = 1 }) => {
  const [mediaSrc, setMediaSrc] = useState(() => volatileMediaCache.get(file.path) || null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setError(false);

    if (volatileMediaCache.has(file.path)) {
      setMediaSrc(volatileMediaCache.get(file.path));
      return;
    }

    const loadSecureMedia = async () => {
      try {
        if (file.path.endsWith('.aes') || file.ext === 'aes') {
          const contents = await readVaultOrDeviceFile(file);
          const masterKey = window.__SOVEREIGN_KEY__;
          if (!masterKey) throw new Error('Vault Locked');

          const rawPayload = typeof contents.data === 'string' ? contents.data : String(contents.data);
          const bytes = CryptoJS.AES.decrypt(rawPayload, masterKey);
          const decryptedBase64 = bytes.toString(CryptoJS.enc.Utf8);

          if (!decryptedBase64 || !decryptedBase64.startsWith('data:')) {
            throw new Error('Decryption failed');
          }
          volatileMediaCache.set(file.path, decryptedBase64);
          if (isMounted) setMediaSrc(decryptedBase64);
        } else {
          const converted = Capacitor.convertFileSrc(file.path);
          volatileMediaCache.set(file.path, converted);
          if (isMounted) setMediaSrc(converted);
        }
      } catch (e) {
        if (isMounted) setError(true);
      }
    };

    loadSecureMedia();
    return () => { isMounted = false; };
  }, [file.path, file.name, file.ext]);

  if (error) {
    return (
      <div onClick={onClick} className={`bg-zinc-900 flex items-center justify-center flex-col gap-1 p-2 ${className}`}>
        <span className="text-red-500 text-lg">⚠️</span>
        <span className="text-[8px] text-red-400 font-mono tracking-widest uppercase text-center">Locked / Corrupted</span>
      </div>
    );
  }

  if (!mediaSrc) {
    return (
      <div onClick={onClick} className={`bg-zinc-900 flex items-center justify-center ${className}`}>
        <span className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kind = detectMediaKind(file, mediaSrc);
  const scaleStyle = isFullscreen && zoom !== 1 ? { transform: `scale(${zoom})`, transition: 'transform 0.2s ease' } : undefined;

  if (kind === 'video') {
    return isFullscreen ? (
      <video
        src={mediaSrc}
        controls
        autoPlay
        loop
        playsInline
        onClick={onClick}
        style={scaleStyle}
        className={className}
      />
    ) : (
      <div onClick={onClick} className={`relative ${className}`}>
        <video src={mediaSrc} muted playsInline preload="metadata" className="w-full h-full object-cover pointer-events-none" />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <span className="w-8 h-8 rounded-full bg-black/70 border border-cyan-400 text-cyan-400 flex items-center justify-center text-xs">▶</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={mediaSrc}
      alt={file.name}
      loading="lazy"
      onClick={onClick}
      style={scaleStyle}
      className={className}
    />
  );
};

export function SecureGallery({ onNavigate }) {
  const storageCtx = useStorage() || {};
  const { indexedFiles = [], isScanning = false, runGlobalScan } = storageCtx;

  const [vaultFiles, setVaultFiles] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [activeFolder, setActiveFolder] = useState('ALL');
  const [mediaFilter, setMediaFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('NEWEST');

  // Viewer, Slideshow & Shuffle State
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [slideSpeed, setSlideSpeed] = useState(4000);
  const [isRandom, setIsRandom] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showInspector, setShowInspector] = useState(false);

  // Batch Selection & Import State
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [stripExif, setStripExif] = useState(true);

  // Native Canvas Editor State
  const [editingFile, setEditingFile] = useState(null);
  const [editSourceSrc, setEditSourceSrc] = useState(null);
  const [editConfig, setEditConfig] = useState({
    rotate: 0, flipH: false, flipV: false,
    brightness: 100, contrast: 100, saturate: 100,
    tacticalFilter: 'NONE', aspect: 'FREE'
  });

  const fileInputRef = useRef(null);
  const editorCanvasRef = useRef(null);

  const scanInternalVault = useCallback(async () => {
    try {
      const res = await Filesystem.readdir({ path: '', directory: Directory.Data });
      const items = (res.files || []).map(item => {
        const name = typeof item === 'string' ? item : item.name;
        const ext = (name.split('.').pop() || '').toLowerCase();
        return {
          name,
          path: name,
          ext,
          folder: 'AES_VAULT',
          mtime: item?.mtime || Date.now(),
          size: item?.size || 0,
          isInternalVault: true
        };
      }).filter(f => ['aes', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm'].includes(f.ext));
      setVaultFiles(items);
    } catch (e) {
      console.warn('Internal vault scan skipped:', e);
    }
  }, []);

  useEffect(() => {
    scanInternalVault();
    return () => { volatileMediaCache.clear(); };
  }, [scanInternalVault]);

  const allMediaFiles = useMemo(() => {
    const validExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'mp4', 'webm', 'mov', 'mkv', 'aes'];
    const external = indexedFiles.filter(f => validExts.includes(f.ext?.toLowerCase()));
    const combined = [...vaultFiles];
    const seen = new Set(vaultFiles.map(v => v.name));
    external.forEach(f => {
      if (!seen.has(f.name)) {
        seen.add(f.name);
        combined.push(f);
      }
    });
    return combined;
  }, [indexedFiles, vaultFiles]);

  const folders = useMemo(() => {
    const set = new Set(allMediaFiles.map(f => f.folder || 'STORAGE'));
    return ['ALL', ...Array.from(set).sort()];
  }, [allMediaFiles]);

  const displayedMedia = useMemo(() => {
    let list = allMediaFiles.filter(f => {
      if (activeFolder !== 'ALL' && (f.folder || 'STORAGE') !== activeFolder) return false;
      if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      const cached = volatileMediaCache.get(f.path) || '';
      const kind = detectMediaKind(f, cached);
      const isAes = f.ext === 'aes' || f.path.endsWith('.aes');

      if (mediaFilter === 'VAULT') return isAes;
      if (mediaFilter === 'VIDEO') return kind === 'video' || f.name.includes('_vid_');
      if (mediaFilter === 'GIF') return kind === 'gif' || f.name.includes('_gif_');
      if (mediaFilter === 'IMAGE') return kind === 'image' && !f.name.includes('_vid_') && !f.name.includes('_gif_');
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'NAME') return a.name.localeCompare(b.name);
      const timeA = a.mtime || 0;
      const timeB = b.mtime || 0;
      return sortBy === 'OLDEST' ? timeA - timeB : timeB - timeA;
    });

    if (isRandom && shuffleOrder.length === list.length) {
      return shuffleOrder.map(i => list[i]).filter(Boolean);
    }
    return list;
  }, [allMediaFiles, activeFolder, searchQuery, mediaFilter, sortBy, isRandom, shuffleOrder]);

  const triggerRandomize = useCallback(() => {
    setIsRandom(prev => {
      const nextState = !prev;
      if (nextState) {
        const indices = Array.from({ length: displayedMedia.length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        setShuffleOrder(indices);
      } else {
        setShuffleOrder([]);
      }
      return nextState;
    });
  }, [displayedMedia.length]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    if (displayedMedia.length === 0) return;
    setZoomLevel(1);
    setSelectedIndex(prev => {
      if (prev === null) return null;
      if (isRandom) return Math.floor(Math.random() * displayedMedia.length);
      return (prev + 1) % displayedMedia.length;
    });
  }, [displayedMedia.length, isRandom]);

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    if (displayedMedia.length === 0) return;
    setZoomLevel(1);
    setSelectedIndex(prev => {
      if (prev === null) return null;
      return (prev - 1 + displayedMedia.length) % displayedMedia.length;
    });
  }, [displayedMedia.length]);

  useEffect(() => {
    if (!isSlideshow || selectedIndex === null || displayedMedia.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, slideSpeed);
    return () => clearInterval(timer);
  }, [isSlideshow, selectedIndex, slideSpeed, displayedMedia.length, handleNext]);

  const readFileAsDataURL = (file, shouldStripExif) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const result = reader.result;
      const isStaticImg = file.type.startsWith('image/') && !file.type.includes('gif');
      if (!shouldStripExif || !isStaticImg) return resolve(result);

      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve(c.toDataURL('image/jpeg', 0.94));
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.readAsDataURL(file);
  });

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const masterKey = window.__SOVEREIGN_KEY__;
    if (!masterKey) return alert('Vault locked. Unlock master PIN before encrypting media.');

    setIsImporting(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64Data = await readFileAsDataURL(file, stripExif);
        const encryptedData = CryptoJS.AES.encrypt(base64Data, masterKey).toString();
        const tag = file.type.startsWith('video/') ? 'vid' : file.type.includes('gif') ? 'gif' : 'img';
        const fileName = `stealth_${tag}_${Date.now()}_${i}.aes`;

        await Filesystem.writeFile({
          path: fileName,
          data: encryptedData,
          directory: Directory.Data,
          encoding: Encoding.UTF8
        });
        volatileMediaCache.set(fileName, base64Data);
      }
      await scanInternalVault();
      if (runGlobalScan) runGlobalScan();
    } catch (err) {
      console.error('Import error:', err);
      alert('Failed to encrypt and import selected media.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFiles = async (targets) => {
    if (!targets.length || !window.confirm(`Permanently shred ${targets.length} item(s)?`)) return;
    for (const file of targets) {
      try {
        await Filesystem.deleteFile({ path: file.name || file.path, directory: Directory.Data });
      } catch {
        try { await Filesystem.deleteFile({ path: file.path }); } catch {}
      }
      volatileMediaCache.delete(file.path);
    }
    setSelectedPaths([]);
    setSelectMode(false);
    setSelectedIndex(null);
    await scanInternalVault();
    if (runGlobalScan) runGlobalScan();
  };

  const handleExportCurrent = (file) => {
    const src = volatileMediaCache.get(file.path);
    if (!src) return alert('Media still decrypting.');
    const a = document.createElement('a');
    a.href = src;
    const ext = detectMediaKind(file, src) === 'video' ? 'mp4' : detectMediaKind(file, src) === 'gif' ? 'gif' : 'jpg';
    a.download = `sovereign_export_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const openNativeEditor = (file) => {
    const src = volatileMediaCache.get(file.path);
    if (!src) return alert('Wait for media to finish decrypting.');
    if (detectMediaKind(file, src) === 'video') {
      return alert('Video stream active. Use fullscreen playback controls.');
    }
    setEditConfig({
      rotate: 0, flipH: false, flipV: false,
      brightness: 100, contrast: 100, saturate: 100,
      tacticalFilter: 'NONE', aspect: 'FREE'
    });
    setEditSourceSrc(src);
    setEditingFile(file);
  };

  useEffect(() => {
    if (!editingFile || !editSourceSrc || !editorCanvasRef.current) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = editorCanvasRef.current;
      const ctx = canvas.getContext('2d');
      let srcX = 0, srcY = 0, srcW = img.naturalWidth, srcH = img.naturalHeight;

      if (editConfig.aspect !== 'FREE') {
        const [aw, ah] = editConfig.aspect.split(':').map(Number);
        const targetRatio = aw / ah;
        const currentRatio = srcW / srcH;
        if (currentRatio > targetRatio) {
          srcW = srcH * targetRatio;
          srcX = (img.naturalWidth - srcW) / 2;
        } else {
          srcH = srcW / targetRatio;
          srcY = (img.naturalHeight - srcH) / 2;
        }
      }

      const rad = (editConfig.rotate * Math.PI) / 180;
      const swapped = Math.abs(editConfig.rotate / 90) % 2 === 1;
      canvas.width = swapped ? srcH : srcW;
      canvas.height = swapped ? srcW : srcH;

      let filterStr = `brightness(${editConfig.brightness}%) contrast(${editConfig.contrast}%) saturate(${editConfig.saturate}%)`;
      if (editConfig.tacticalFilter === 'GRAY') filterStr += ' grayscale(100%)';
      if (editConfig.tacticalFilter === 'INVERT') filterStr += ' invert(100%)';
      if (editConfig.tacticalFilter === 'NVG') filterStr += ' sepia(100%) hue-rotate(70deg) saturate(300%) contrast(130%)';

      ctx.save();
      ctx.filter = filterStr;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.scale(editConfig.flipH ? -1 : 1, editConfig.flipV ? -1 : 1);
      ctx.drawImage(img, srcX, srcY, srcW, srcH, -srcW / 2, -srcH / 2, srcW, srcH);
      ctx.restore();
    };
    img.src = editSourceSrc;
  }, [editingFile, editSourceSrc, editConfig]);

  const saveEditedMedia = async (overwrite = false) => {
    if (!editorCanvasRef.current || !editingFile) return;
    const masterKey = window.__SOVEREIGN_KEY__;
    if (!masterKey) return alert('Vault locked.');

    try {
      const updatedBase64 = editorCanvasRef.current.toDataURL('image/jpeg', 0.94);
      const encrypted = CryptoJS.AES.encrypt(updatedBase64, masterKey).toString();
      const targetName = overwrite && editingFile.path.endsWith('.aes')
        ? (editingFile.name || editingFile.path)
        : `stealth_edit_${Date.now()}.aes`;

      await Filesystem.writeFile({
        path: targetName,
        data: encrypted,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });
      volatileMediaCache.set(targetName, updatedBase64);
      setEditingFile(null);
      await scanInternalVault();
    } catch (e) {
      alert('Failed to save edited image to AES vault.');
    }
  };

  const currentFile = selectedIndex !== null ? displayedMedia[selectedIndex] : null;

  const toggleSelectPath = (path) => {
    setSelectedPaths(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-32 select-none text-white min-h-screen animate-fadeIn">
      <input
        type="file"
        multiple
        accept="image/*,video/*,.gif"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {isImporting && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center">
          <div className="w-14 h-14 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-cyan-400 font-black tracking-widest uppercase text-base animate-pulse">Encrypting Payloads</h2>
          <p className="text-zinc-400 font-mono text-[10px] mt-1">
            {stripExif ? 'Scrubbing EXIF & wrapping in AES-256...' : 'Wrapping media into AES-256 Vault...'}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-zinc-900 pb-3 pt-1 flex justify-between items-end gap-2">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <span className="text-cyan-400">🖼️</span> Secure Gallery
          </h2>
          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
            {isScanning ? 'Scanning sectors...' : `${displayedMedia.length} assets (${vaultFiles.length} in AES Vault)`}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 justify-end">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning || isImporting}
            className="bg-cyan-600/20 border border-cyan-500 text-cyan-300 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider active:scale-95"
          >
            + Encrypt
          </button>
          <button
            onClick={triggerRandomize}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase border transition-all ${
              isRandom ? 'bg-purple-600/30 border-purple-400 text-purple-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
            }`}
          >
            🔀 Shuffle
          </button>
          <button
            onClick={() => { setSelectMode(!selectMode); setSelectedPaths([]); }}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase border ${
              selectMode ? 'bg-amber-600/30 border-amber-400 text-amber-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
            }`}
          >
            {selectMode ? 'Cancel' : 'Select'}
          </button>
          <button
            onClick={() => { scanInternalVault(); if (runGlobalScan) runGlobalScan(); }}
            disabled={isScanning}
            className="bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase text-zinc-300 active:scale-95"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Search, Sort & EXIF Bar */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search filenames..."
          className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-cyan-500 outline-none"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-[10px] font-bold uppercase text-zinc-300 outline-none"
        >
          <option value="NEWEST">Newest</option>
          <option value="OLDEST">Oldest</option>
          <option value="NAME">A-Z</option>
        </select>
        <button
          onClick={() => setStripExif(!stripExif)}
          className={`px-2.5 py-1.5 rounded-xl text-[9px] font-mono uppercase border ${
            stripExif ? 'bg-emerald-950/60 border-emerald-600 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
          }`}
          title="Strip EXIF Metadata on Import"
        >
          EXIF:{stripExif ? 'SCRUB' : 'KEEP'}
        </button>
      </div>

      {/* Multi-Select Action Bar */}
      {selectMode && (
        <div className="bg-zinc-900/90 border border-amber-500/40 rounded-xl p-2.5 flex justify-between items-center">
          <span className="text-xs font-mono text-amber-300">{selectedPaths.length} selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPaths(displayedMedia.map(f => f.path))}
              className="px-2.5 py-1 bg-zinc-800 rounded-lg text-[10px] font-bold uppercase"
            >
              All
            </button>
            <button
              onClick={() => handleDeleteFiles(displayedMedia.filter(f => selectedPaths.includes(f.path)))}
              disabled={!selectedPaths.length}
              className="px-3 py-1 bg-red-600/30 border border-red-500 text-red-300 rounded-lg text-[10px] font-bold uppercase disabled:opacity-40"
            >
              🗑️ Shred Selected
            </button>
          </div>
        </div>
      )}

      {/* Media Type Pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {['ALL', 'VAULT', 'IMAGE', 'VIDEO', 'GIF'].map(type => (
          <button
            key={type}
            onClick={() => setMediaFilter(type)}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase shrink-0 transition-all ${
              mediaFilter === type ? 'bg-cyan-500 text-black font-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}
          >
            {type === 'VAULT' ? '🔒 AES Vault' : type}
          </button>
        ))}
      </div>

      {/* Virtual Folder Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {folders.map(folder => (
          <button
            key={folder}
            onClick={() => setActiveFolder(folder)}
            className={`px-3 py-1 rounded-xl text-[9px] font-mono uppercase shrink-0 ${
              activeFolder === folder ? 'bg-zinc-800 text-cyan-400 border border-cyan-500/50' : 'bg-zinc-950 text-zinc-500 border border-zinc-900'
            }`}
          >
            📁 {folder}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      {displayedMedia.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-8 text-center text-zinc-500 font-mono text-xs">
          No media found for current filter. Tap "+ Encrypt" to ingest photos, GIFs, or videos into the AES Vault.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {displayedMedia.map((file, idx) => {
            const isSelected = selectedPaths.includes(file.path);
            const isAes = file.ext === 'aes' || file.path.endsWith('.aes');
            return (
              <div
                key={file.path || idx}
                className={`aspect-square bg-zinc-900 border rounded-xl overflow-hidden cursor-pointer relative group transition-all ${
                  isSelected ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-zinc-800 hover:border-cyan-500/50'
                }`}
              >
                <SecureMediaNode
                  file={file}
                  onClick={() => {
                    if (selectMode) toggleSelectPath(file.path);
                    else { setZoomLevel(1); setSelectedIndex(idx); }
                  }}
                  className="w-full h-full object-cover"
                />
                {isAes && (
                  <span className="absolute top-1.5 left-1.5 bg-black/70 border border-cyan-500/40 text-cyan-300 text-[8px] px-1.5 py-0.5 rounded font-mono pointer-events-none">
                    AES
                  </span>
                )}
                {selectMode && (
                  <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold pointer-events-none ${
                    isSelected ? 'bg-amber-400 border-black text-black' : 'bg-black/60 border-white/60 text-transparent'
                  }`}>
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FULLSCREEN VIEWER MODAL */}
      {selectedIndex !== null && currentFile && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-fadeIn">
          {/* Top Bar with High-Visibility Exit & Slideshow Controls */}
          <div className="flex flex-col gap-2 p-3 bg-zinc-950/90 border-b border-zinc-800 z-30">
            <div className="flex justify-between items-center gap-2">
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-mono text-zinc-200 truncate">{currentFile.name}</span>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  {currentFile.folder || 'VAULT'} • {selectedIndex + 1} / {displayedMedia.length}
                </span>
              </div>

              <button
                onClick={() => { setIsSlideshow(false); setSelectedIndex(null); }}
                className="px-4 py-2 bg-red-600/20 border border-red-500 text-red-300 rounded-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-wider active:scale-95 shrink-0"
              >
                ✕ EXIT
              </button>
            </div>

            {/* Viewer Secondary Controls: Slideshow, Speed, Randomize, Zoom */}
            <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsSlideshow(!isSlideshow)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                    isSlideshow ? 'bg-cyan-500 text-black border-cyan-400 font-black animate-pulse' : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                  }`}
                >
                  {isSlideshow ? '⏸ Pause Show' : '▶ Slideshow'}
                </button>
                <button
                  onClick={() => setSlideSpeed(s => s === 3000 ? 5000 : s === 5000 ? 8000 : 3000)}
                  className="px-2 py-1 rounded-lg text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-cyan-400"
                >
                  {slideSpeed / 1000}s
                </button>
                <button
                  onClick={triggerRandomize}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                    isRandom ? 'bg-purple-600/30 border-purple-400 text-purple-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  🔀 {isRandom ? 'Random ON' : 'Random'}
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoomLevel(z => z >= 3 ? 1 : +(z + 0.5).toFixed(1))}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300"
                >
                  🔍 {zoomLevel}x
                </button>
                <button
                  onClick={() => setShowInspector(!showInspector)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300"
                >
                  ℹ️
                </button>
              </div>
            </div>
          </div>

          {/* Main Media Stage */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black">
            <button
              onClick={handlePrev}
              className="absolute left-2 z-20 w-11 h-11 rounded-full bg-black/60 border border-zinc-700 text-white flex items-center justify-center text-lg active:scale-90"
            >
              ‹
            </button>

            <SecureMediaNode
              file={currentFile}
              isFullscreen={true}
              zoom={zoomLevel}
              onClick={e => e.stopPropagation()}
              className="max-w-full max-h-full object-contain"
            />

            <button
              onClick={handleNext}
              className="absolute right-2 z-20 w-11 h-11 rounded-full bg-black/60 border border-zinc-700 text-white flex items-center justify-center text-lg active:scale-90"
            >
              ›
            </button>

            {showInspector && (
              <div className="absolute top-3 left-3 right-3 bg-zinc-950/95 border border-cyan-500/40 rounded-xl p-3 z-30 font-mono text-[10px] space-y-1">
                <div className="text-cyan-400 font-bold uppercase">Asset Telemetry</div>
                <div>File: {currentFile.name}</div>
                <div>Path: {currentFile.path}</div>
                <div>Protection: {currentFile.path.endsWith('.aes') ? 'AES-256 Encrypted Vault' : 'Plaintext Storage'}</div>
              </div>
            )}
          </div>

          {/* Bottom Action Bar (Split layout avoids overlapping center floating Home button) */}
          <div className="p-3 pb-6 bg-zinc-950/90 border-t border-zinc-800 flex justify-between items-center z-30">
            <div className="flex gap-2">
              <button
                onClick={() => openNativeEditor(currentFile)}
                className="px-3.5 py-2 bg-cyan-600/20 border border-cyan-500 text-cyan-300 rounded-xl text-xs font-bold uppercase"
              >
                ✎ Edit
              </button>
              <button
                onClick={() => handleExportCurrent(currentFile)}
                className="px-3.5 py-2 bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-bold uppercase"
              >
                📥 Export
              </button>
            </div>

            <div className="w-14" />

            <button
              onClick={() => handleDeleteFiles([currentFile])}
              className="px-4 py-2 bg-red-600/20 border border-red-500 text-red-400 rounded-xl text-xs font-bold uppercase"
            >
              🗑️ Shred
            </button>
          </div>
        </div>
      )}

      {/* NATIVE IMAGE EDITOR MODAL */}
      {editingFile && (
        <div className="fixed inset-0 bg-black/95 z-[120] flex flex-col p-3 animate-fadeIn">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400">✎ Sovereign Studio Editor</span>
            <button
              onClick={() => setEditingFile(null)}
              className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-bold text-zinc-300"
            >
              ✕ Cancel
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-hidden my-2 bg-zinc-950 rounded-xl border border-zinc-900">
            <canvas ref={editorCanvasRef} className="max-w-full max-h-full object-contain" />
          </div>

          <div className="space-y-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-[10px]">
            {/* Transforms & Crop */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              <button onClick={() => setEditConfig(c => ({ ...c, rotate: (c.rotate - 90) % 360 }))} className="px-2.5 py-1.5 bg-zinc-800 rounded-lg font-bold">↺ -90°</button>
              <button onClick={() => setEditConfig(c => ({ ...c, rotate: (c.rotate + 90) % 360 }))} className="px-2.5 py-1.5 bg-zinc-800 rounded-lg font-bold">↻ +90°</button>
              <button onClick={() => setEditConfig(c => ({ ...c, flipH: !c.flipH }))} className="px-2.5 py-1.5 bg-zinc-800 rounded-lg font-bold">↔ Flip H</button>
              <button onClick={() => setEditConfig(c => ({ ...c, flipV: !c.flipV }))} className="px-2.5 py-1.5 bg-zinc-800 rounded-lg font-bold">↕ Flip V</button>
              {['FREE', '1:1', '16:9', '4:3'].map(asp => (
                <button
                  key={asp}
                  onClick={() => setEditConfig(c => ({ ...c, aspect: asp }))}
                  className={`px-2.5 py-1.5 rounded-lg font-bold ${editConfig.aspect === asp ? 'bg-cyan-500 text-black' : 'bg-zinc-800 text-zinc-300'}`}
                >
                  {asp}
                </button>
              ))}
            </div>

            {/* Tactical Filters */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {['NONE', 'GRAY', 'NVG', 'INVERT'].map(flt => (
                <button
                  key={flt}
                  onClick={() => setEditConfig(c => ({ ...c, tacticalFilter: flt }))}
                  className={`px-3 py-1 rounded-lg font-mono uppercase ${editConfig.tacticalFilter === flt ? 'bg-emerald-500 text-black font-bold' : 'bg-zinc-800 text-zinc-400'}`}
                >
                  {flt}
                </button>
              ))}
            </div>

            {/* Adjustment Sliders */}
            <div className="grid grid-cols-3 gap-2 font-mono">
              <label className="flex flex-col">
                <span>Bright ({editConfig.brightness}%)</span>
                <input type="range" min="40" max="180" value={editConfig.brightness} onChange={e => setEditConfig(c => ({ ...c, brightness: +e.target.value }))} />
              </label>
              <label className="flex flex-col">
                <span>Contrast ({editConfig.contrast}%)</span>
                <input type="range" min="40" max="200" value={editConfig.contrast} onChange={e => setEditConfig(c => ({ ...c, contrast: +e.target.value }))} />
              </label>
              <label className="flex flex-col">
                <span>Sat ({editConfig.saturate}%)</span>
                <input type="range" min="0" max="250" value={editConfig.saturate} onChange={e => setEditConfig(c => ({ ...c, saturate: +e.target.value }))} />
              </label>
            </div>

            <div className="flex gap-2 pt-1 pb-4">
              <button
                onClick={() => saveEditedMedia(false)}
                className="flex-1 py-2 bg-cyan-500 text-black font-black uppercase rounded-xl text-xs"
              >
                💾 Save New .AES
              </button>
              {editingFile.path.endsWith('.aes') && (
                <button
                  onClick={() => saveEditedMedia(true)}
                  className="flex-1 py-2 bg-amber-500/20 border border-amber-500 text-amber-300 font-black uppercase rounded-xl text-xs"
                >
                  ⚡ Overwrite Vault File
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecureGallery;
