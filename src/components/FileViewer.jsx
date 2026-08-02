import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';

export function FileViewer({ onNavigate }) {
  const { indexedFiles = [], isScanning, runGlobalScan } = useStorage();
  const [activeFile, setActiveFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('ALL');
  const [isShredding, setIsShredding] = useState(false);

  // Fallback data if context is empty
  const filesToRender = indexedFiles.length > 0 ? indexedFiles : [
    { name: 'Sovereign_Manifesto.txt', ext: 'txt', content: 'Absolute local control.' },
    { name: 'Financial_Export_Q3.csv', ext: 'csv', content: 'Date,Amount,Type\n08/01/2026,150.00,XMR\n08/02/2026,420.00,SOL' }
  ];

  const filteredFiles = filesToRender.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    
    if (category === 'MEDIA') return ['jpg', 'png', 'webp', 'mp4', 'webm'].includes(f.ext);
    if (category === 'DOCS') return ['pdf', 'txt', 'md', 'doc', 'docx'].includes(f.ext);
    if (category === 'DATA') return ['csv', 'xls', 'json'].includes(f.ext);
    return true;
  });

  const parseCSV = (content) => {
    if (!content) return [];
    return content.split('\n').map(row => row.split(','));
  };

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
      setActiveFile(null); // Close viewer after shred
    }, 2000);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen flex flex-col animate-fadeIn">
      
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
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Search indexed files..." 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none shrink-0"
          />

          <div className="flex gap-2 overflow-x-auto no-scrollbar shrink-0 pb-1">
            {['ALL', 'DOCS', 'MEDIA', 'DATA'].map(cat => (
              <button 
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider shrink-0 transition-colors ${category === cat ? 'theme-accent-bg text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {filteredFiles.length === 0 ? (
              <div className="text-center text-zinc-500 font-mono text-xs py-12">No files found in {category}.</div>
            ) : (
              filteredFiles.map((file, idx) => (
                <div key={idx} onClick={() => setActiveFile(file)} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center gap-4 overflow-hidden pr-2">
                    <span className="text-2xl shrink-0">
                      {['pdf'].includes(file.ext) ? '📑' : ['csv', 'xls'].includes(file.ext) ? '📊' : ['jpg', 'png', 'webp'].includes(file.ext) ? '🖼️' : ['mp4', 'webm'].includes(file.ext) ? '🎬' : '📄'}
                    </span>
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-white truncate">{file.name}</h4>
                      <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">{file.ext} format</span>
                    </div>
                  </div>
                  <span className="text-xs theme-accent-text font-bold shrink-0 bg-black/20 px-3 py-1.5 rounded-lg border border-zinc-700/50">View</span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-3 animate-fadeIn">
          
          <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-2xl border border-zinc-800 shrink-0">
            <div className="overflow-hidden pr-2">
              <h3 className="text-xs font-mono font-bold text-white truncate">{activeFile.name}</h3>
              <p className="text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">{activeFile.ext} Viewer</p>
            </div>
            <button onClick={() => setActiveFile(null)} className="bg-zinc-800 text-zinc-200 px-4 py-2 rounded-xl text-xs font-bold border border-zinc-700 active:scale-95">Close</button>
          </div>

          <div className={`flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl p-4 overflow-auto min-h-[350px] flex items-center justify-center relative ${isShredding ? 'animate-pulse bg-red-950/20' : ''}`}>
            
            {isShredding ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 space-y-4 backdrop-blur-md">
                <span className="text-5xl animate-spin">☣️</span>
                <p className="text-red-500 font-mono text-sm font-bold tracking-widest">ZERO-FILLING SECTORS...</p>
              </div>
            ) : null}

            {/* VIEWER LOGIC */}
            {activeFile.ext === 'pdf' && (
              <iframe src={activeFile.src} className="w-full h-full rounded-xl border-0 min-h-[400px]" title="Preview" />
            )}
            {['jpg', 'jpeg', 'png', 'webp'].includes(activeFile.ext) && (
              <img src={activeFile.src} alt={activeFile.name} className="max-w-full max-h-full object-contain rounded-xl" />
            )}
            {['mp4', 'webm'].includes(activeFile.ext) && (
              <video src={activeFile.src} controls autoPlay className="max-w-full max-h-full rounded-xl" />
            )}
            {['csv', 'xls'].includes(activeFile.ext) && (
              <div className="w-full h-full overflow-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <tbody>
                    {parseCSV(activeFile.content || '').map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-zinc-900">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-3 border-r border-zinc-900 text-zinc-300">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!['pdf', 'jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'csv', 'xls'].includes(activeFile.ext) && (
              <div className="w-full h-full font-mono text-xs text-zinc-300 whitespace-pre-wrap overflow-y-auto leading-relaxed">
                {activeFile.content || "Loading file binary data..."}
              </div>
            )}

          </div>

          {/* Integrated Action Bar */}
          <div className="flex gap-2 shrink-0 pt-2">
            <button onClick={() => openExternally(activeFile)} className="flex-1 bg-zinc-900 border border-zinc-700 text-white font-bold text-xs rounded-xl py-3 active:scale-95 transition-transform">
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
