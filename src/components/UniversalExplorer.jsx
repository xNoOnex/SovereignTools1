import React, { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';

export function UniversalExplorer({ onNavigate }) {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDirectory = async (path) => {
    setIsLoading(true);
    try {
      const scan = await Filesystem.readdir({
        path: path,
        directory: Directory.ExternalStorage
      });
      
      if (scan && scan.files) {
        // Parse results into unified objects
        const parsedFiles = scan.files.map(f => {
           const isDir = typeof f === 'object' ? f.type === 'directory' : !f.includes('.');
           const name = typeof f === 'string' ? f : (f.name || 'unknown');
           return {
               name: name,
               isDir: isDir,
               ext: isDir ? '' : name.split('.').pop().toUpperCase(),
               fullPath: path ? `${path}/${name}` : name
           };
        });
        
        // Sort: Folders first, then files alphabetically
        parsedFiles.sort((a, b) => {
           if (a.isDir && !b.isDir) return -1;
           if (!a.isDir && b.isDir) return 1;
           return a.name.localeCompare(b.name);
        });
        
        setFiles(parsedFiles);
      }
    } catch (e) {
      console.warn("Explorer Error:", e);
      setFiles([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  const handleNavigateIn = (folderName) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
  };

  const handleNavigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-32 select-none text-white min-h-screen animate-fadeIn flex flex-col">
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3">
            <span className="text-3xl text-amber-400">📁</span> Universal Explorer
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Live raw filesystem navigator.</p>
        </div>
        <button onClick={() => loadDirectory(currentPath)} disabled={isLoading} className="bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 disabled:opacity-50">
          Rescan
        </button>
      </div>

      <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-2xl flex items-center gap-3 overflow-hidden shadow-inner shrink-0">
        <button onClick={handleNavigateUp} disabled={!currentPath} className="w-8 h-8 bg-black rounded-lg flex items-center justify-center border border-zinc-700 active:scale-95 disabled:opacity-30 shrink-0">
          ⬆️
        </button>
        <span className="text-[10px] font-mono text-cyan-400 truncate tracking-widest">
          /storage/emulated/0/{currentPath}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 bg-black border border-zinc-900 p-2 rounded-3xl shadow-inner">
        {isLoading ? (
          <div className="text-center text-zinc-600 font-mono text-xs py-8">Scanning directory...</div>
        ) : files.length === 0 ? (
          <div className="text-center text-zinc-600 font-mono text-xs py-8">Directory is empty.</div>
        ) : (
          files.map((file, idx) => (
            <div 
              key={idx} 
              onClick={() => file.isDir && handleNavigateIn(file.name)}
              className={`p-3 rounded-2xl flex justify-between items-center transition-all ${file.isDir ? 'bg-zinc-900/90 hover:border-amber-500/50 cursor-pointer border border-zinc-800' : 'bg-black border border-zinc-800'}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-xl">{file.isDir ? '🗂️' : '📄'}</span>
                <span className={`text-xs font-bold truncate ${file.isDir ? 'text-white' : 'text-zinc-400'}`}>{file.name}</span>
              </div>
              {!file.isDir && (
                <span className="bg-zinc-900 text-zinc-500 px-2 py-1 rounded text-[8px] font-mono border border-zinc-800 shrink-0">
                  {file.ext}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
