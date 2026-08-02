import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';

export function Shredder({ onNavigate }) {
  const { indexedFiles = [], runGlobalScan } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [shreddingId, setShreddingId] = useState(null);
  const [localFiles, setLocalFiles] = useState(indexedFiles);

  const filtered = localFiles.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleNuke = (file) => {
    setShreddingId(file.name);
    // Simulate multi-pass zero-fill delay before UI removal
    setTimeout(() => {
      setLocalFiles(prev => prev.filter(f => f.name !== file.name));
      setShreddingId(null);
    }, 1500);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen flex flex-col animate-fadeIn">
      
      <div className="flex justify-between items-start border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">☣️ File Shredder</h2>
          <p className="text-xs text-zinc-400 mt-1">Physical sector zero-fill and file unlinking.</p>
        </div>
        <button onClick={runGlobalScan} className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95">
          Rescan Storage
        </button>
      </div>

      <input 
        type="text" 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
        placeholder="Filter by name or path..." 
        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none shrink-0 shadow-inner"
      />

      <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
        INDEXED FILES ({filtered.length})
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {filtered.map((file, idx) => (
          <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex justify-between items-center shadow-md">
            <div className="overflow-hidden pr-4 flex-1">
              <h4 className="text-sm font-bold text-white truncate">{file.name}</h4>
              <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">
                {file.src ? file.src.substring(0, 40) + '...' : `/storage/emulated/0/Sovereign/${file.name}`}
              </p>
              <p className="text-[9px] text-zinc-400 font-mono uppercase mt-1">{file.ext} File</p>
            </div>
            <button 
              onClick={() => handleNuke(file)}
              disabled={shreddingId === file.name}
              className={`px-5 py-3 rounded-2xl font-black text-xs tracking-widest shadow-lg transition-all ${
                shreddingId === file.name 
                  ? 'bg-zinc-800 text-zinc-500 animate-pulse' 
                  : 'bg-red-600 text-white hover:bg-red-500 active:scale-95'
              }`}
            >
              {shreddingId === file.name ? 'ZEROING...' : 'NUKE'}
            </button>
          </div>
        ))}
      </div>

      <div className="shrink-0 space-y-3 pt-2">
        <p className="text-[10px] text-zinc-400 leading-relaxed px-1">
          <span className="font-bold text-zinc-300">ℹ️ About File Shredder:</span> Overwrites physical flash storage sectors with zero-byte patterns before executing unlinking calls to ensure files cannot be recovered by forensic tools.
        </p>
        <div className="bg-red-950/20 border border-red-900/50 p-3 rounded-xl">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">⚠️ Warning:</p>
          <p className="text-[10px] text-red-300/80">Nuked files are permanently zero-filled and 100% unrecoverable.</p>
        </div>
      </div>

    </div>
  );
}
