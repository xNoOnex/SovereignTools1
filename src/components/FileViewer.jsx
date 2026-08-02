import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';

export function FileViewer({ onNavigate }) {
  const { indexedFiles = [], isScanning, runGlobalScan } = useStorage();
  const [activeFile, setActiveFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('ALL');
  const [isShredding, setIsShredding] = useState(false);

  const filesToRender = indexedFiles.length > 0 ? indexedFiles : [];

  const filteredFiles = filesToRender.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    
    if (category === 'MEDIA') return ['jpg', 'png', 'webp', 'mp4', 'webm', 'jpeg'].includes(f.ext);
    if (category === 'DOCS') return ['pdf', 'txt', 'md', 'doc', 'docx'].includes(f.ext);
    if (category === 'DATA') return ['csv', 'xls', 'json'].includes(f.ext);
    return true;
  });

  const openExternally = (file) => {
    if (!file.src) return alert("Virtual file cannot be opened externally.");
    const a = document.createElement('a');
    a.href = file.src;
    a.download = file.name;
    a.target = '_blank';
    a.click();
  };

  const executeInViewerShred = () => {
    setIsShredding(true);
    setTimeout(() => {
      setIsShredding(false);
      setActiveFile(null);
    }, 2000);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen flex flex-col animate-fadeIn">
      
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">📂 File Viewer</h2>
          <p className="text-xs text-zinc-400 mt-1">Universal parser and data inspector.</p>
        </div>
        <button onClick={runGlobalScan} className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-bold">
          {isScanning ? 'Scanning...' : 'Refresh'}
        </button>
      </div>

      {!activeFile ? (
        <div className="flex-1 flex flex-col space-y-4">
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search indexed files..." className="w-full bg-zinc-950/80 backdrop-blur border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none shrink-0" />
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar shrink-0 pb-1">
            {['ALL', 'DOCS', 'MEDIA', 'DATA'].map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider shrink-0 transition-colors ${category === cat ? 'theme-accent-bg text-black shadow' : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800'}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {filteredFiles.length === 0 ? (
              <div className="text-center text-zinc-500 font-mono text-xs py-12 bg-black/40 rounded-3xl border border-zinc-900/50">No files found.</div>
            ) : (
              filteredFiles.map((file, idx) => (
                <div key={idx} onClick={() => setActiveFile(file)} className="bg-zinc-950/80 backdrop-blur border border-zinc-800 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center gap-4 overflow-hidden pr-2">
                    <span className="text-2xl shrink-0">📄</span>
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-white truncate">{file.name}</h4>
                      <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">{file.ext} format</span>
                    </div>
                  </div>
                  <span className="text-xs theme-accent-text font-bold shrink-0 bg-black/40 px-3 py-1.5 rounded-lg border border-zinc-700/50">View</span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-3 animate-fadeIn">
          
          <div className="flex justify-between items-center bg-zinc-900/90 backdrop-blur p-3 rounded-2xl border border-zinc-800 shrink-0">
            <div className="overflow-hidden pr-2">
              <h3 className="text-xs font-mono font-bold text-white truncate">{activeFile.name}</h3>
              <p className="text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">{activeFile.ext} Viewer</p>
            </div>
            <button onClick={() => setActiveFile(null)} className="bg-zinc-800 text-zinc-200 px-4 py-2 rounded-xl text-xs font-bold border border-zinc-700 active:scale-95">Close</button>
          </div>

          <div className={`flex-1 bg-zinc-950/90 backdrop-blur border border-zinc-900 rounded-2xl p-4 overflow-auto min-h-[350px] flex flex-col items-center justify-center relative ${isShredding ? 'animate-pulse bg-red-950/20' : ''}`}>
            
            {isShredding ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 space-y-4 backdrop-blur-md">
                <span className="text-5xl animate-spin">☣️</span>
                <p className="text-red-500 font-mono text-sm font-bold tracking-widest">ZERO-FILLING SECTORS...</p>
              </div>
            ) : null}

            {/* FIX: If file is unknown binary/apk, force external open instead of hanging browser */}
            {!['pdf', 'jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'csv', 'txt', 'md'].includes(activeFile.ext) ? (
              <div className="text-center space-y-4 max-w-xs">
                <span className="text-5xl">📦</span>
                <p className="text-xs text-zinc-400 font-mono">This binary format ({activeFile.ext}) cannot be rendered safely in the DOM. Use External Viewer to parse payload.</p>
                <button onClick={() => openExternally(activeFile)} className="w-full bg-zinc-800 text-white font-bold text-xs rounded-xl py-3 border border-zinc-700 active:scale-95 shadow">
                  Force External Open
                </button>
              </div>
            ) : (
               <div className="w-full h-full font-mono text-xs text-zinc-300 whitespace-pre-wrap overflow-y-auto leading-relaxed">
                  {activeFile.content || "Payload encrypted or empty."}
               </div>
            )}
          </div>

          <div className="flex gap-2 shrink-0 pt-2">
            <button onClick={() => openExternally(activeFile)} className="flex-1 bg-zinc-900/90 backdrop-blur border border-zinc-700 text-white font-bold text-xs rounded-xl py-3 active:scale-95 transition-transform shadow-lg">
              ↗️ Open External
            </button>
            <button onClick={executeInViewerShred} disabled={isShredding} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black tracking-widest text-xs rounded-xl py-3 shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50">
              <span>🔥</span> NUKE FILE
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
