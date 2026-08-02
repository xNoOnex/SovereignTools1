import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';

export function FileViewer({ onNavigate }) {
  const { indexedFiles, isScanning, runGlobalScan } = useStorage();
  const [activeFile, setActiveFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter files based on search
  const filteredFiles = indexedFiles.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Helper to parse CSV for Excel preview
  const parseCSV = (content) => {
    if (!content) return [];
    return content.split('\n').map(row => row.split(','));
  };

  const openExternally = (file) => {
    const a = document.createElement('a');
    a.href = file.src;
    a.download = file.name;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen flex flex-col">
      
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">📂 Universal File Viewer</h2>
          <p className="text-xs text-zinc-400 mt-1">Inspect, parse, and launch any file format.</p>
        </div>
        <button onClick={runGlobalScan} className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-bold">
          {isScanning ? 'Scanning...' : 'Refresh'}
        </button>
      </div>

      {!activeFile ? (
        <div className="flex-1 flex flex-col space-y-3">
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Search indexed files..." 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none shrink-0"
          />

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px]">
            {filteredFiles.length === 0 ? (
              <div className="text-center text-zinc-500 font-mono text-xs py-12">No files indexed. Run a scan or save a document.</div>
            ) : (
              filteredFiles.map((file, idx) => (
                <div key={idx} onClick={() => setActiveFile(file)} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 flex justify-between items-center cursor-pointer active:scale-95 transition-transform">
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-2xl">
                      {['pdf'].includes(file.ext) ? '📑' : ['csv', 'xls'].includes(file.ext) ? '📊' : ['jpg', 'png', 'webp'].includes(file.ext) ? '🖼️' : ['mp4', 'webm'].includes(file.ext) ? '🎬' : '📄'}
                    </span>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-white truncate">{file.name}</h4>
                      <span className="text-[9px] text-zinc-500 font-mono uppercase">{file.ext} format</span>
                    </div>
                  </div>
                  <span className="text-xs theme-accent-text font-bold">View →</span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-3 animate-fadeIn">
          
          <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-2xl border border-zinc-800 shrink-0">
            <span className="text-xs font-mono font-bold text-white truncate pr-2">{activeFile.name}</span>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => openExternally(activeFile)} className="bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold border border-zinc-700">Open External</button>
              <button onClick={() => setActiveFile(null)} className="theme-accent-bg text-black px-3 py-1.5 rounded-xl text-xs font-bold">Close</button>
            </div>
          </div>

          <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl p-4 overflow-auto min-h-[350px] flex items-center justify-center">
            
            {/* PDF VIEWER */}
            {activeFile.ext === 'pdf' && (
              <iframe src={activeFile.src} className="w-full h-full rounded-xl border-0 min-h-[400px]" title="PDF Preview" />
            )}

            {/* IMAGE VIEWER */}
            {['jpg', 'jpeg', 'png', 'webp'].includes(activeFile.ext) && (
              <img src={activeFile.src} alt={activeFile.name} className="max-w-full max-h-full object-contain rounded-xl" />
            )}

            {/* VIDEO VIEWER */}
            {['mp4', 'webm'].includes(activeFile.ext) && (
              <video src={activeFile.src} controls autoPlay className="max-w-full max-h-full rounded-xl" />
            )}

            {/* EXCEL / CSV VIEWER */}
            {['csv', 'xls'].includes(activeFile.ext) && (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <tbody>
                    {parseCSV(activeFile.content || '').map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-zinc-900">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2 border-r border-zinc-900 text-zinc-300">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* DEFAULT TEXT / MARKDOWN VIEWER */}
            {!['pdf', 'jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'csv', 'xls'].includes(activeFile.ext) && (
              <div className="w-full h-full font-mono text-xs text-zinc-300 whitespace-pre-wrap overflow-y-auto">
                {activeFile.content || "Loading file data..."}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
