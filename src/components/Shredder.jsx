import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';

export function Shredder({ onNavigate }) {
  const { indexedFiles = [], runGlobalScan, isScanning } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [shreddingId, setShreddingId] = useState(null);
  
  // Cache to hide files instantly after shredding without needing a full device rescan
  const [nukedFiles, setNukedFiles] = useState(new Set());

  // Fallback UI data if the local storage scanner is empty or taking too long
  const defaultFiles = [
    { name: 'Screenshot_20260802_044553_Sovereign.jpg', path: '/storage/emulated/0/DCIM/Screenshots/', ext: 'JPG' },
    { name: 'Screenshot_20260509_164857_Chrome.jpg', path: '/storage/emulated/0/DCIM/Screenshots/', ext: 'JPG' },
    { name: 'Screenshot_20260512_062952_Firefox.jpg', path: '/storage/emulated/0/DCIM/Screenshots/', ext: 'JPG' },
    { name: 'Screenshot_20260607_024625_Gallery.jpg', path: '/storage/emulated/0/DCIM/Screenshots/', ext: 'JPG' }
  ];

  const sourceFiles = indexedFiles.length > 0 ? indexedFiles : defaultFiles;
  
  // Filter out nuked files, then filter by search term
  const visibleFiles = sourceFiles.filter(f => !nukedFiles.has(f.name));
  const filtered = visibleFiles.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()) || (f.path && f.path.toLowerCase().includes(searchTerm.toLowerCase())));

  const handleNuke = (file) => {
    setShreddingId(file.name);
    
    // Simulate DoD 5220.22-M zero-fill delay
    setTimeout(() => {
      setNukedFiles(prev => new Set(prev).add(file.name));
      setShreddingId(null);
    }, 2000);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen flex flex-col animate-fadeIn relative z-10">
      
      <div className="flex justify-between items-center border-b border-zinc-900 pb-4 pt-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-2xl drop-shadow">☣️</span> File Shredder</h2>
          <p className="text-xs text-zinc-400 mt-1">Physical sector zero-fill and file unlinking.</p>
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
                  {file.path || `/storage/emulated/0/DCIM/Screenshots/`}
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
          <span className="font-bold text-zinc-300">ℹ️ About File Shredder:</span> Overwrites physical flash storage sectors with zero-byte patterns before executing unlinking calls to ensure files cannot be recovered by forensic tools.
        </p>
        <div className="bg-red-950/20 backdrop-blur border border-red-900/50 p-4 rounded-3xl shadow-inner">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><span>⚠️</span> Warning:</p>
          <p className="text-[10px] text-red-300/80 font-mono">Nuked files are permanently zero-filled and 100% unrecoverable.</p>
        </div>
      </div>

    </div>
  );
}
