import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { Filesystem, Encoding } from '@capacitor/filesystem';

export function Shredder({ onNavigate }) {
  const { indexedFiles = [], runGlobalScan, isScanning } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [shreddingId, setShreddingId] = useState(null);
  const [nukedFiles, setNukedFiles] = useState(new Set());

  const sourceFiles = indexedFiles.length > 0 ? indexedFiles : [];
  
  const visibleFiles = sourceFiles.filter(f => !nukedFiles.has(f.name));
  const filtered = visibleFiles.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()) || (f.path && f.path.toLowerCase().includes(searchTerm.toLowerCase())));

  const handleNuke = async (file) => {
    const confirmNuke = window.confirm(`WARNING: You are about to permanently delete ${file.name} from your device. This cannot be undone. Proceed?`);
    if (!confirmNuke) return;

    setShreddingId(file.name);
    
    try {
      const targetPath = file.path || file.src; // Must have the absolute native path
      
      if (!targetPath) {
        throw new Error("Cannot locate absolute file path for native deletion.");
      }

      // Step 1: Corrupt the file at the OS level by overwriting it with blank data
      await Filesystem.writeFile({
        path: targetPath,
        data: '0000000000000000000000000000000000000000',
        encoding: Encoding.UTF8
      });

      // Step 2: Unlink and permanently delete from the Android file system
      await Filesystem.deleteFile({
        path: targetPath
      });

      // Step 3: Remove from UI
      setNukedFiles(prev => new Set(prev).add(file.name));
      
    } catch (error) {
      alert(`❌ Shredding Failed: ${error.message}\n(Make sure the app has 'All Files Access' permissions in Android settings)`);
    } finally {
      setShreddingId(null);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen flex flex-col animate-fadeIn relative z-10">
      
      <div className="flex justify-between items-center border-b border-zinc-900 pb-4 pt-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-2xl drop-shadow">☣️</span> File Shredder</h2>
          <p className="text-xs text-zinc-400 mt-1">OS-level data corruption and unlinking.</p>
        </div>
        <button onClick={runGlobalScan} className="bg-zinc-900/80 backdrop-blur border border-zinc-700 hover:border-cyan-500 text-cyan-400 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md">
          {isScanning ? 'Scanning...' : 'Rescan Storage'}
        </button>
      </div>

      <input 
        type="text" 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
        placeholder="Filter by name or path..." 
        className="w-full bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl px-5 py-4 text-xs text-white font-mono focus:outline-none shrink-0 placeholder-zinc-600 shadow-inner"
      />

      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 pt-2">
        INDEXED FILES ({visibleFiles.length})
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {filtered.length === 0 ? (
          <div className="text-center text-zinc-500 font-mono text-xs py-12 bg-black/40 rounded-3xl border border-zinc-900/50">
            No files found matching criteria.
          </div>
        ) : (
          filtered.map((file, idx) => (
            <div key={idx} className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-3xl p-5 flex justify-between items-center shadow-lg transition-all">
              <div className="overflow-hidden pr-4 flex-1">
                <h4 className="text-sm font-bold text-white truncate">{file.name}</h4>
                <p className="text-[10px] text-zinc-500 font-mono truncate mt-1">
                  {file.path || `/storage/emulated/0/DCIM/`}
                </p>
                <p className="text-[9px] text-zinc-400 font-mono uppercase mt-1 tracking-widest">
                  {file.ext || file.name.split('.').pop()} File
                </p>
              </div>
              <button 
                onClick={() => handleNuke(file)}
                disabled={shreddingId === file.name}
                className={`px-5 py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all shadow-lg border ${
                  shreddingId === file.name 
                    ? 'bg-zinc-800 text-zinc-500 border-zinc-700 animate-pulse shadow-inner' 
                    : 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-red-900/50 active:scale-95'
                }`}
              >
                {shreddingId === file.name ? 'ZEROING' : 'NUKE'}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 space-y-3 pt-2">
        <p className="text-[10px] text-zinc-400 leading-relaxed px-2 text-justify">
          <span className="font-bold text-zinc-300">ℹ️ About File Shredder:</span> This module executes a native OS overwrite with empty data followed by an unlinking command. Note: Hardware-level wear-leveling on modern Android UFS storage means physical sector zero-filling is impossible without root access, but this method prevents standard OS-level recovery.
        </p>
        <div className="bg-red-950/20 backdrop-blur border border-red-900/50 p-4 rounded-3xl shadow-inner">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><span>⚠️</span> Warning:</p>
          <p className="text-[10px] text-red-300/80 font-mono">Files destroyed here are permanently deleted from your device.</p>
        </div>
      </div>

    </div>
  );
}
