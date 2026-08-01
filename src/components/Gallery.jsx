import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useDeviceStorage } from '../hooks/useDeviceStorage';
import { ToolFooter } from './ToolFooter';

export function Gallery() {
  const { galleryItems, rescanGallery, deleteFile } = useDeviceStorage();
  const [activeFolder, setActiveFolder] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    rescanGallery();
  }, [rescanGallery]);

  const filteredItems = galleryItems.filter(item => {
    if (activeFolder === 'All') return true;
    if (activeFolder === 'Photos') return item.type === 'image';
    if (activeFolder === 'Videos') return item.type === 'video';
    return item.folder === activeFolder;
  });

  const getMediaSrc = (cleanUrl) => {
    if (!cleanUrl) return '';
    if (cleanUrl.startsWith('content://')) {
      return Capacitor.convertFileSrc(cleanUrl);
    }
    return cleanUrl;
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Secure Gallery
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Device media catalog with local viewports.
          </p>
        </div>
        <button
          onClick={rescanGallery}
          className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-cyan-400 font-bold text-xs rounded-xl shadow"
        >
          Refresh
        </button>
      </div>

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

      {filteredItems.length === 0 ? (
        <div className="bg-zinc-900/60 p-8 border border-dashed border-zinc-800 rounded-2xl text-center text-xs text-zinc-500">
          No media found in "{activeFolder}".
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
                  <span className="text-2xl">🎥</span>
                  <span className="text-[9px] font-mono text-cyan-400 mt-1 font-bold">VIDEO</span>
                </div>
              ) : (
                <img
                  src={getMediaSrc(item.cleanUrl)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 flex justify-between items-end">
                <span className="text-[9px] font-mono text-cyan-300 font-bold truncate max-w-[75%]">{item.name}</span>
                <span className="text-[8px] bg-cyan-500/80 text-black font-black px-1 rounded uppercase">
                  {item.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-4 flex flex-col justify-between overflow-y-auto">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Media Inspector
            </h3>
            <button
              onClick={() => setSelectedItem(null)}
              className="p-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold"
            >
              ✕ Close
            </button>
          </div>

          <div className="my-auto space-y-4 max-w-lg mx-auto w-full py-4">
            <div className="rounded-2xl overflow-hidden border border-zinc-800 max-h-80 bg-black flex justify-center items-center">
              {selectedItem.type === 'video' ? (
                <video src={getMediaSrc(selectedItem.cleanUrl)} controls autoPlay className="w-full max-h-80 object-contain" />
              ) : (
                <img src={getMediaSrc(selectedItem.cleanUrl)} alt="Preview" className="max-h-80 object-contain" />
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
              onClick={() => {
                deleteFile(selectedItem);
                setSelectedItem(null);
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg"
            >
              Shred & Remove from Device
            </button>
          </div>
        </div>
      )}

      <ToolFooter
        title="Gallery Catalog"
        details="Local indexing engine using Android MediaStore ContentResolver URIs."
        disclaimer="Zero telemetry or remote backups."
      />
    </div>
  );
}
