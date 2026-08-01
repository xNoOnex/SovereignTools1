import React, { useState } from 'react';
import { useDeviceStorage } from '../hooks/useDeviceStorage';
import { ToolFooter } from './ToolFooter';

export function FileShredder() {
  const { deviceFiles, isScanning, rescanFiles, deleteFile } = useDeviceStorage();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');

  const handleNuke = (file) => {
    if (deleteFile(file)) {
      setStatus(`Shredded: ${file.name}`);
      setTimeout(() => setStatus(''), 2500);
    }
  };

  const filtered = deviceFiles.filter(f => 
    f.name.toLowerCase().includes(query.toLowerCase()) || 
    f.absolutePath.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            File Shredder
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Physical sector zero-fill and file unlinking.
          </p>
        </div>
        <button
          onClick={rescanFiles}
          disabled={isScanning}
          className="text-xs bg-zinc-800 hover:bg-zinc-700 text-cyan-400 font-bold px-3 py-1.5 rounded-xl border border-zinc-700 transition-all"
        >
          {isScanning ? 'Scanning...' : 'Rescan Storage'}
        </button>
      </div>

      {status && (
        <div className="bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-bold py-2 px-3 rounded-xl text-center">
          {status}
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Filter by name or path..."
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
      />

      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-zinc-300 uppercase tracking-wider text-[10px]">
            Indexed Files ({filtered.length})
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 border border-dashed border-zinc-800 rounded-2xl text-center text-xs text-zinc-500">
            No files found matching criteria.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filtered.map(file => (
              <div key={file.id} className="bg-black p-3 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                <div className="truncate max-w-[70%] space-y-0.5">
                  <div className="font-mono text-white text-[11px] font-bold truncate">{file.name}</div>
                  <div className="text-[9px] text-zinc-400 font-mono truncate">{file.absolutePath}</div>
                  <div className="text-[8px] font-mono text-zinc-500">{file.size}</div>
                </div>
                <button
                  onClick={() => handleNuke(file)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase rounded-lg"
                >
                  Nuke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToolFooter
        title="Sector Sanitizer"
        details="Overwrites absolute target paths with binary zeroes before unlinking descriptors."
        disclaimer="Deleted files are unrecoverable."
      />
    </div>
  );
}
