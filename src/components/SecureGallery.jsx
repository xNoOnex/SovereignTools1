import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStorage } from '../context/StorageContext';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import CryptoJS from 'crypto-js';

// --- LAZY DECRYPTION NODE ---
// This component decrypts the AES payload directly into volatile RAM for rendering.
// It never writes the decrypted image to the flash storage.
const SecureImageNode = ({ file, className, onClick }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadSecureMedia = async () => {
      try {
        if (file.path.endsWith('.aes')) {
          // Read ciphertext
          const contents = await Filesystem.readFile({
            path: file.path,
            encoding: Encoding.UTF8
          });
          
          const masterKey = window.__SOVEREIGN_KEY__;
          if (!masterKey) throw new Error("Vault locked.");

          // Decrypt to Base64 Data URI
          const bytes = CryptoJS.AES.decrypt(contents.data, masterKey);
          const decryptedBase64 = bytes.toString(CryptoJS.enc.Utf8);
          
          if (!decryptedBase64) throw new Error("Decryption failed.");
          if (isMounted) setImgSrc(decryptedBase64);
        } else {
          // Fallback for older plaintext images in the vault
          if (isMounted) setImgSrc(Capacitor.convertFileSrc(file.path));
        }
      } catch (e) {
        if (isMounted) setError(true);
      }
    };

    loadSecureMedia();
    return () => { isMounted = false; };
  }, [file.path]);

  if (error) {
    return (
      <div onClick={onClick} className={`bg-zinc-800 flex items-center justify-center flex-col gap-2 ${className}`}>
        <span className="text-red-500 text-xl">⚠️</span>
        <span className="text-[8px] text-red-400 font-mono tracking-widest uppercase">Corrupted</span>
      </div>
    );
  }

  if (!imgSrc) {
    return (
      <div onClick={onClick} className={`bg-zinc-900 flex items-center justify-center ${className}`}>
        <span className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <img 
      src={imgSrc} 
      alt={file.name} 
      loading="lazy" 
      onClick={onClick}
      className={className}
    />
  );
};
// ----------------------------

export function SecureGallery({ onNavigate }) {
  const { indexedFiles, isScanning, runGlobalScan } = useStorage();
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [activeFolder, setActiveFolder] = useState('ALL');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const imageFiles = useMemo(() => {
    return indexedFiles.filter(f => 
      ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'aes'].includes(f.ext?.toLowerCase())
    );
  }, [indexedFiles]);

  const folders = useMemo(() => {
    const folderSet = new Set(imageFiles.map(f => f.folder));
    return ['ALL', ...Array.from(folderSet).sort()];
  }, [imageFiles]);

  const displayedImages = useMemo(() => {
    if (activeFolder === 'ALL') return imageFiles;
    return imageFiles.filter(f => f.folder === activeFolder);
  }, [imageFiles, activeFolder]);

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

  // --- SECURE IMPORT HANDLER ---
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const masterKey = window.__SOVEREIGN_KEY__;
    if (!masterKey) return alert("Vault locked. Cannot ingest payloads.");

    setIsImporting(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Convert local file to Base64
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
          reader.readAsDataURL(file);
        });

        // Wrap in AES-256
        const encryptedData = CryptoJS.AES.encrypt(base64Data, masterKey).toString();
        
        // Write to Vault
        const fileName = `stealth_import_${Date.now()}_${i}.aes`;
        await Filesystem.writeFile({
          path: fileName,
          data: encryptedData,
          directory: Directory.Data,
          encoding: Encoding.UTF8
        });
      }
      
      alert(`✅ ${files.length} payloads secured in Vault.\n\n⚠️ IMPORTANT: OS Sandboxing prevents automatic deletion. You must manually delete the original files from your device's public gallery.`);
      if (runGlobalScan) runGlobalScan();
      
    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to encrypt and import payloads.");
    } finally {
      setIsImporting(false);
      // Reset input so the same files can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-32 select-none text-white min-h-screen animate-fadeIn">
      
      {/* INVISIBLE FILE INPUT */}
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
      />

      {/* IMPORTING OVERLAY */}
      {isImporting && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center">
           <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-6"></div>
           <h2 className="text-cyan-500 font-black tracking-[0.2em] uppercase text-lg animate-pulse">Ingesting Payloads</h2>
           <p className="text-zinc-400 font-mono text-[10px] mt-2">Encrypting public media into vault...</p>
        </div>
      )}

      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3">
            <span className="text-3xl text-cyan-400">🖼️</span> Secure Gallery
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {isScanning ? 'Running deep sector scan...' : `Indexed ${imageFiles.length} images across storage.`}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isScanning || isImporting} 
            className="bg-cyan-600/20 border border-cyan-500 text-cyan-400 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 disabled:opacity-50 transition-all"
          >
            Import
          </button>
          <button 
            onClick={runGlobalScan} 
            disabled={isScanning} 
            className="bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 disabled:opacity-50"
          >
            {isScanning ? 'Scanning...' : 'Rescan'}
          </button>
        </div>
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
              className="aspect-square bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-cyan-500/50 transition-all active:scale-95 relative group shadow-md"
            >
              <SecureImageNode 
                file={file} 
                onClick={() => setSelectedImageIndex(idx)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
              X
            </button>
          </div>

          {/* Main Image Area */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden" onClick={() => setSelectedImageIndex(null)}>
            
            {/* Left Prev Hitbox */}
            <div onClick={handlePrev} className="absolute left-0 inset-y-0 w-1/4 z-20 flex items-center justify-start p-4 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
              {selectedImageIndex > 0 && <div className="w-12 h-12 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white text-xl border border-zinc-700 shadow-xl">{"<"}</div>}
            </div>

            <SecureImageNode 
              file={displayedImages[selectedImageIndex]} 
              onClick={(e) => e.stopPropagation()} 
              className="max-w-full max-h-screen object-contain"
            />

            {/* Right Next Hitbox */}
            <div onClick={handleNext} className="absolute right-0 inset-y-0 w-1/4 z-20 flex items-center justify-end p-4 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
              {selectedImageIndex < displayedImages.length - 1 && <div className="w-12 h-12 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white text-xl border border-zinc-700 shadow-xl">{">"}</div>}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10 text-center pointer-events-none">
            <span className="bg-zinc-900/80 backdrop-blur border border-zinc-700 px-3 py-1.5 rounded-xl text-[9px] font-mono text-zinc-400 truncate inline-block max-w-full shadow-lg">
              {displayedImages[selectedImageIndex].path}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
