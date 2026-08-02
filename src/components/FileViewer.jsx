import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';

export function FileViewer({ onNavigate }) {
  const { indexedFiles = [], runGlobalScan } = useStorage();
  const [activeFile, setActiveFile] = useState(null);
  const [currentFolder, setCurrentFolder] = useState('ROOT');

  const filesToRender = indexedFiles.length > 0 ? indexedFiles : [];

  const getFilteredFiles = () => {
    if (currentFolder === 'ROOT') return [];
    if (currentFolder === 'Images') return filesToRender.filter(f => ['jpg', 'png', 'webp', 'jpeg', 'gif'].includes(f.ext));
    if (currentFolder === 'Videos') return filesToRender.filter(f => ['mp4', 'webm', 'mkv', 'avi'].includes(f.ext));
    if (currentFolder === 'Audio') return filesToRender.filter(f => ['mp3', 'wav', 'ogg'].includes(f.ext));
    if (currentFolder === 'Documents') return filesToRender.filter(f => ['pdf', 'txt', 'md', 'doc', 'docx', 'csv', 'xls'].includes(f.ext));
    if (currentFolder === 'Downloads') return filesToRender.filter(f => f.src?.includes('Download') || f.name.includes('Download'));
    if (currentFolder === 'Internal Storage') return filesToRender;
    return filesToRender;
  };

  const currentList = getFilteredFiles();

  const openExternally = (file) => {
    const a = document.createElement('a');
    a.href = file.src;
    a.download = file.name;
    a.target = '_blank';
    a.click();
  };

  const renderNativeFile = (file) => {
    const ext = file.ext.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img src={file.src} alt={file.name} className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-2xl" 
               onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}/>
          <div style={{display: 'none'}} className="text-center p-4">
            <span className="text-5xl drop-shadow-md">⚠️</span>
            <p className="text-[10px] text-red-400 font-mono mt-4 leading-relaxed uppercase tracking-widest">Image path broken. Click "Open External".</p>
          </div>
        </div>
      );
    }
    
    if (['txt', 'md', 'json', 'csv'].includes(ext)) {
      return (
         <div className="w-full h-full font-mono text-[10px] text-emerald-400 whitespace-pre-wrap overflow-y-auto leading-relaxed text-left bg-black p-5 rounded-xl border border-zinc-800 shadow-inner">
            {file.content || "Payload encrypted or empty."}
         </div>
      );
    }
    
    return (
      <div className="text-center space-y-4 max-w-xs mx-auto">
        <span className="text-6xl drop-shadow-lg block">📦</span>
        <p className="text-[10px] text-zinc-400 font-mono leading-relaxed text-justify px-2">
          The binary format <strong className="text-white uppercase">.{ext}</strong> cannot be securely rendered inside the sandbox. Parsing this raw data could result in a memory stall.
        </p>
        <button onClick={() => openExternally(file)} className="w-full bg-zinc-800 text-white font-bold text-[10px] tracking-widest uppercase rounded-xl py-4 border border-zinc-700 active:scale-95 shadow-lg mt-2">
          Force External Open
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen flex flex-col relative z-10">
      
      {!activeFile ? (
        <>
          <div className="flex justify-between items-center shrink-0 mb-2">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">📂 MyFiles</h2>
            <button onClick={runGlobalScan} className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 shadow">Rescan</button>
          </div>

          {currentFolder === 'ROOT' ? (
            <div className="flex-1 space-y-6 animate-fadeIn">
              <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-5 shadow-xl">
                <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest px-1 mb-4">CATEGORIES</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'Images', icon: '🖼️' }, { id: 'Videos', icon: '🎬' }, { id: 'Audio', icon: '🎵' },
                    { id: 'Documents', icon: '📑' }, { id: 'Downloads', icon: '📥' }, { id: 'APKs', icon: '📦' }
                  ].map(cat => (
                    <button key={cat.id} onClick={() => setCurrentFolder(cat.id)} className="flex flex-col items-center bg-black/40 hover:bg-zinc-800 border border-zinc-800/50 p-4 rounded-2xl transition-all shadow-inner active:scale-95">
                      <span className="text-3xl mb-2 drop-shadow-md">{cat.icon}</span>
                      <span className="text-[10px] font-bold text-zinc-300">{cat.id}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-5 shadow-xl">
                <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest px-1 mb-4">LOCAL STORAGE</h3>
                <button onClick={() => setCurrentFolder('Internal Storage')} className="w-full flex items-center gap-4 bg-black/40 hover:bg-zinc-800 border border-zinc-800/50 p-4 rounded-2xl transition-all shadow-inner active:scale-95 text-left">
                  <span className="text-3xl drop-shadow-md">💾</span>
                  <div>
                    <span className="text-sm font-bold text-zinc-200 block">Internal Storage</span>
                    <span className="text-[10px] font-mono text-zinc-500">{filesToRender.length} Indexed Files</span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-4 animate-fadeIn">
              <div className="flex items-center gap-3 bg-zinc-900/80 backdrop-blur p-4 rounded-3xl border border-zinc-800 shadow-xl shrink-0">
                <button onClick={() => setCurrentFolder('ROOT')} className="text-xl px-2 py-1 bg-black rounded-lg border border-zinc-700 active:scale-95">⬅️</button>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">{currentFolder}</h3>
                  <p className="text-[9px] text-zinc-400 font-mono">{currentList.length} Items</p>
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto">
                {currentList.length === 0 ? (
                  <div className="text-center text-zinc-500 font-mono text-xs py-16 bg-black/40 rounded-3xl border border-zinc-900/50">Folder is empty.</div>
                ) : (
                  currentList.map((file, idx) => (
                    <div key={idx} onClick={() => setActiveFile(file)} className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-3xl p-4 flex justify-between items-center cursor-pointer hover:bg-zinc-800 transition-all shadow-md group">
                      <div className="flex items-center gap-4 overflow-hidden pr-2 w-full">
                        <div className="w-12 h-12 rounded-xl bg-black border border-zinc-700 flex items-center justify-center shrink-0 text-2xl group-hover:scale-105 transition-transform shadow-inner">📄</div>
                        <div className="flex flex-col overflow-hidden w-full">
                          <h4 className="text-xs font-bold text-white truncate">{file.name}</h4>
                          <span className="text-[9px] text-zinc-500 font-mono mt-1 uppercase">{file.ext} FILE</span>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-500 font-bold shrink-0 px-2">❯</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col space-y-4 animate-fadeIn h-full">
          <div className="flex justify-between items-center bg-zinc-900/90 backdrop-blur p-4 rounded-3xl border border-zinc-800 shrink-0 shadow-xl">
            <div className="overflow-hidden pr-2 flex items-center gap-3">
               <span className="text-2xl drop-shadow">👀</span>
               <div className="truncate">
                 <h3 className="text-xs font-mono font-bold text-white truncate">{activeFile.name}</h3>
                 <p className="text-[9px] theme-accent-text font-bold uppercase tracking-widest mt-0.5">{activeFile.ext} Viewer</p>
               </div>
            </div>
            <button onClick={() => setActiveFile(null)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-bold border border-zinc-600 active:scale-95 shadow shrink-0">Close</button>
          </div>

          <div className="flex-1 bg-zinc-950/90 backdrop-blur border border-zinc-800 rounded-3xl p-5 overflow-auto flex flex-col items-center justify-center shadow-inner">
            {renderNativeFile(activeFile)}
          </div>

          <div className="flex gap-2 shrink-0 pt-2">
            <button onClick={() => openExternally(activeFile)} className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl py-4 active:scale-95 transition-transform shadow-lg">
              ↗️ Open External
            </button>
            <button onClick={() => { setActiveFile(null); alert("Sent to Shredder module."); }} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black tracking-widest text-[10px] uppercase rounded-xl py-4 shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
              <span className="text-sm">🔥</span> NUKE FILE
            </button>
          </div>
        </div>
      )}

      <div className="shrink-0 mt-4 bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl shadow-xl">
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span>ℹ️</span> Module Info & Disclaimers</h4>
        <p className="text-[10px] text-zinc-500 font-mono leading-relaxed text-justify">
          The Universal Explorer navigates device storage within the sandbox. Complex binaries are handed off to external handlers to prevent memory leaks. Shred operations are irreversible.
        </p>
      </div>
    </div>
  );
}
