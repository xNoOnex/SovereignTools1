import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { Capacitor } from '@capacitor/core';

export function SecureGallery({ onNavigate }) {
  const { indexedFiles } = useStorage();
  const [selectedImage, setSelectedImage] = useState(null);

  const imageFiles = indexedFiles.filter(f => 
    ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(f.ext?.toLowerCase())
  );

  const getWebUrl = (path) => {
    if (!path) return '';
    return Capacitor.convertFileSrc(path);
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-32 select-none text-white min-h-screen animate-fadeIn">
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3">
            <span className="text-3xl text-cyan-400">🖼️</span> Secure Gallery
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Local encrypted & native image viewer ({imageFiles.length} indexed)</p>
        </div>
      </div>

      {imageFiles.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 text-center text-zinc-500 font-mono text-xs">
          No local images detected in indexed storage.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {imageFiles.map((file, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedImage(file)}
              className="aspect-square bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-500/50 transition-all active:scale-95 relative group shadow-md"
            >
              <img 
                src={getWebUrl(file.path)} 
                alt={file.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                onError={(e) => { e.target.src = 'https://via.placeholder.com/150/000000/FFFFFF?text=IMAGE+FILE'; }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 text-[9px] font-mono truncate text-zinc-300">
                {file.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 p-4 flex flex-col justify-between animate-fadeIn">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <span className="text-xs font-mono text-zinc-300 truncate max-w-[70%]">{selectedImage.name}</span>
            <button 
              onClick={() => setSelectedImage(null)} 
              className="w-9 h-9 bg-zinc-900 rounded-full flex items-center justify-center text-sm font-bold border border-zinc-700 active:scale-95"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
            <img 
              src={getWebUrl(selectedImage.path)} 
              alt={selectedImage.name} 
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl" 
            />
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-2xl text-[10px] font-mono text-zinc-400 truncate">
            Path: {selectedImage.path}
          </div>
        </div>
      )}
    </div>
  );
}
