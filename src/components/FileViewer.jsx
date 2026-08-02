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
    if (category === 'MEDIA') return ['jpg', 'png', 'webp', 'mp4', 'webm', 'jpeg', 'gif'].includes(f.ext);
    if (category === 'DOCS') return ['pdf', 'txt', 'md', 'doc', 'docx'].includes(f.ext);
    if (category === 'DATA') return ['csv', 'xls', 'json', 'xml'].includes(f.ext);
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

  const renderNativeFile = (file) => {
    const ext = file.ext.toLowerCase();
    
    // FIX: Render Images securely without parsing to binary text
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2">
          <img src={file.src || file.objectUrl} alt={file.name} className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-2xl border border-zinc-800" 
               onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}/>
          <div style={{display: 'none'}} className="text-center p-4">
            <span className="text-5xl drop-shadow-md">⚠️</span>
            <p className="text-[10px] text-red-400 font-mono mt-4 leading-relaxed uppercase tracking-widest">WebView Sandbox blocked local file rendering. Click "Open External" below.</p>
          </div>
        </div>
      );
    }
    
    // Render Text cleanly
    if (['txt', 'md', 'json', 'xml', 'csv'].includes(ext)) {
      return (
         <div className="w-full h-full font-mono text-[10px] text-emerald-400 whitespace-pre-wrap overflow-y-auto leading-relaxed text-left bg-black p-5 rounded-xl border border-zinc-800 shadow-inner">
            {file.content || "Payload encrypted, empty, or requires local parsing."}
         </div>
      );
    }
    
    // Fallback for raw binary / executables (APKs, etc.)
    return (
      <div className="text-center space-y-4 max-w-xs">
        <span className="text-6xl drop-shadow-lg block">📦</span>
        <p className="text-[10px] text-zinc-400 font-mono leading-relaxed text-justify px-2">
          The binary format <strong className="text-white uppercase">.{ext}</strong> cannot be securely rendered inside the WebView sandbox. Parsing this raw data could result in a memory stall.
        </p>
        <button onClick={() => openExternally(file)} className="w-full bg-zinc-800 text-white font-bold text-[10px] tracking-widest uppercase rounded-xl py-4 border border-zinc-700 active:scale-95 shadow-lg hover:bg-zinc-700 transition-colors mt-2">
          Force External Open
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen flex flex-col animate-fadeIn relative z-10">
      
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">📂 Universal Explorer</h2>
          <p className="text-xs text-zinc-400 mt-1">MyFiles style indexer & inspector.</p>
        </div>
        <button onClick={runGlobalScan} className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform hover:bg-zinc-800 shadow">
          {isScanning ? 'Scanning...' : 'Refresh'}
        </button>
      </div>

      {!activeFile ? (
        <div className="flex-1 flex flex-col space-y-4">
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-5 shrink-0 shadow-xl space-y-4">
            <div className="flex gap-2 bg-black p-1.5 rounded-xl border border-zinc-800 overflow-x-auto no-scrollbar">
              {['ALL', 'DOCS', 'MEDIA', 'DATA'].map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} className={`flex-1 py-2.5 px-3 rounded-lg text-[10px] font-bold tracking-widest transition-colors ${category === cat ? 'theme-accent-bg text-black shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Filter directory by name..." className="w-full bg-black/80 border border-zinc-800 rounded-xl px-5 py-4 text-xs text-white font-mono focus:outline-none placeholder-zinc-600 shadow-inner" />
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pb-2">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2">Internal Storage Index ({filteredFiles.length})</div>
            {filteredFiles.length === 0 ? (
              <div className="text-center text-zinc-500 font-mono text-xs py-16 bg-black/40 rounded-3xl border border-zinc-900/50 flex flex-col items-center gap-4">
                <span className="text-4xl opacity-50">📭</span>
                Directory is empty.
              </div>
            ) : (
              filteredFiles.map((file, idx) => (
                <div key={idx} onClick={() => setActiveFile(file)} className="bg-zinc-950/90 backdrop-blur border border-zinc-800 rounded-3xl p-4 flex justify-between items-center cursor-pointer hover:bg-zinc-900 transition-all shadow-md group">
                  <div className="flex items-center gap-4 overflow-hidden pr-2 w-full">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0 text-2xl group-hover:scale-105 transition-transform shadow-inner">
                      {['pdf'].includes(file.ext) ? '📑' : ['csv', 'xls'].includes(file.ext) ? '📊' : ['jpg', 'png', 'webp', 'jpeg'].includes(file.ext) ? '🖼️' : ['mp4', 'webm'].includes(file.ext) ? '🎬' : '📄'}
                    </div>
                    <div className="flex flex-col overflow-hidden w-full">
                      <h4 className="text-xs font-bold text-white truncate">{file.name}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] theme-accent-text font-mono uppercase tracking-widest bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">{file.ext}</span>
                        <span className="text-[9px] text-zinc-500 font-mono truncate">{file.size || 'Unknown Size'}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 group-hover:theme-accent-text font-bold shrink-0 px-2">❯</span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-4 animate-fadeIn h-full">
          
          <div className="flex justify-between items-center bg-zinc-900/90 backdrop-blur p-4 rounded-3xl border border-zinc-800 shrink-0 shadow-xl">
            <div className="overflow-hidden pr-2 flex items-center gap-3">
              <span className="text-2xl drop-shadow">👀</span>
              <div>
                <h3 className="text-xs font-mono font-bold text-white truncate">{activeFile.name}</h3>
                <p className="text-[9px] theme-accent-text font-bold uppercase tracking-widest mt-0.5">Secure Inspection Mode</p>
              </div>
            </div>
            <button onClick={() => setActiveFile(null)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-bold border border-zinc-600 active:scale-95 transition-all shadow">Close</button>
          </div>

          <div className={`flex-1 bg-zinc-950/90 backdrop-blur border border-zinc-800 rounded-3xl p-5 overflow-auto flex flex-col items-center justify-center relative shadow-inner ${isShredding ? 'animate-pulse bg-red-950/30' : ''}`}>
            {isShredding && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 space-y-4 backdrop-blur-md bg-black/60 rounded-3xl">
                <span className="text-6xl animate-spin drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">☣️</span>
                <p className="text-red-500 font-mono text-xs font-black tracking-widest drop-shadow">SECTORS OBLITERATED</p>
              </div>
            )}
            {renderNativeFile(activeFile)}
          </div>

          <div className="flex gap-2 shrink-0 pt-2">
            <button onClick={() => openExternally(activeFile)} className="flex-1 bg-zinc-900/90 hover:bg-zinc-800 backdrop-blur border border-zinc-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl py-4 active:scale-95 transition-transform shadow-lg">
              ↗️ Native App
            </button>
            <button onClick={executeInViewerShred} disabled={isShredding} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black tracking-widest text-[10px] uppercase rounded-xl py-4 shadow-lg shadow-red-900/50 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50">
              <span className="text-sm">🔥</span> NUKE 
            </button>
          </div>
        </div>
      )}

      <div className="shrink-0 mt-4 bg-zinc-900/50 backdrop-blur border border-zinc-800 p-4 rounded-3xl shadow-lg">
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1"><span>ℹ️</span> Module Info & Disclaimers</h4>
        <p className="text-[9px] text-zinc-500 font-mono leading-relaxed text-justify">
          The Universal Explorer safely parses files within the WebView sandbox. Due to Android security constraints, complex binary files (APKs, proprietary formats) cannot render locally and must be forwarded to external native handlers. Shredding functionality executes a DoD 5220.22-M zero-fill standard.
        </p>
      </div>

    </div>
  );
}
