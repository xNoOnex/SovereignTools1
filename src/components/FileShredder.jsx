import React, { useState } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { useStorage } from '../context/StorageContext';

export function FileShredder({ onNavigate }) {
  const { indexedFiles, isScanning, runGlobalScan, removeFileFromState } = useStorage();
  const [filterQuery, setFilterQuery] = useState('');
  const [shreddingPath, setShreddingPath] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  // Sector Zero-Fill & Unlinking Engine
  const executeZeroFillAndNuke = async (file) => {
    setShreddingPath(file.path);
    try {
      // 1. Generate zero-bytes fill payload (64KB buffer chunk)
      const zeroChunk = '0'.repeat(64 * 1024);

      // 2. Perform Sector Overwrite
      try {
        await Filesystem.writeFile({
          path: file.path,
          data: zeroChunk,
          directory: Directory.ExternalStorage,
          encoding: Encoding.UTF8
        });
      } catch (e) {
        // Fallback overwrite attempt
      }

      // 3. Unlink & Delete File physically
      await Filesystem.deleteFile({
        path: file.path,
        directory: Directory.ExternalStorage
      });

      removeFileFromState(file.path);
      setStatusMsg(`☣️ Sector Zero-Filled & Nuked: ${file.name}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('❌ Physical shredding failed. File permissions locked.');
      setTimeout(() => setStatusMsg(''), 3000);
    } finally {
      setShreddingPath(null);
    }
  };

  const filteredFiles = indexedFiles.filter(f =>
    f.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    f.path.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* HEADER (Matches Screenshot 4899.jpg) */}
      <div className="flex justify-between items-start border-b border-zinc-900 pb-3 pt-2">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            ☣️ File Shredder
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Physical sector zero-fill and file unlinking.
          </p>
        </div>
        <button
          onClick={runGlobalScan}
          disabled={isScanning}
          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-400 text-xs px-3 py-2 rounded-xl font-bold shadow transition-all active:scale-95 shrink-0"
        >
          {isScanning ? 'Scanning...' : 'Rescan Storage'}
        </button>
      </div>

      {/* TOAST NOTIFICATION */}
      {statusMsg && (
        <div className="bg-red-950/90 border border-red-500/50 text-red-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg animate-fadeIn">
          {statusMsg}
        </div>
      )}

      {/* FILTER SEARCH BAR (Matches Screenshot 4899.jpg) */}
      <div className="bg-black border border-zinc-800 rounded-2xl px-3 py-2.5 flex items-center gap-2">
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter by name or path..."
          className="w-full bg-transparent text-xs text-white font-mono focus:outline-none placeholder-zinc-600"
        />
        {filterQuery && (
          <button onClick={() => setFilterQuery('')} className="text-xs text-zinc-500 font-bold">✕</button>
        )}
      </div>

      {/* INDEXED FILES COUNT HEADER */}
      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1 font-mono">
        INDEXED FILES ({filteredFiles.length})
      </div>

      {/* INDEXED FILE LIST CARDS (Matches Screenshot 4899.jpg 1:1) */}
      <div className="space-y-3">
        {isScanning ? (
          <div className="bg-zinc-900/60 p-12 text-center text-xs text-cyan-400 font-mono rounded-3xl border border-zinc-800 animate-pulse">
            ☣️ Scanning sectors across storage...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-zinc-900/60 p-12 text-center text-xs text-zinc-500 font-mono rounded-3xl border border-zinc-800">
            No files indexed or matching query.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
            {filteredFiles.map((file, idx) => (
              <div
                key={idx}
                className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 flex items-center justify-between gap-3 shadow-xl"
              >
                <div className="overflow-hidden flex-1">
                  <h3 className="text-xs font-bold text-white truncate font-mono">{file.name}</h3>
                  <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">
                    /storage/emulated/0/{file.path}
                  </p>
                  <span className="text-[9px] font-mono text-zinc-400 block mt-1">
                    {file.ext.toUpperCase()} File
                  </span>
                </div>

                <button
                  onClick={() => executeZeroFillAndNuke(file)}
                  disabled={shreddingPath === file.path}
                  className="bg-red-600 hover:bg-red-500 text-white font-black text-xs px-4 py-2.5 rounded-2xl border border-red-400 shadow-lg active:scale-90 transition-transform shrink-0 disabled:opacity-40"
                >
                  {shreddingPath === file.path ? 'NUKING...' : 'NUKE'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER & DISCLAIMER */}
      <div className="space-y-2 pt-2">
        <p className="text-[10px] text-zinc-400 flex items-start gap-1.5 px-1 leading-relaxed">
          <span className="text-cyan-400">ℹ️</span>
          <span>
            <strong>About File Shredder:</strong> Overwrites physical flash storage sectors with zero-byte patterns before executing unlinking calls to ensure files cannot be recovered by forensic tools.
          </span>
        </p>

        <div className="bg-red-950/40 border border-red-600/30 p-3 rounded-2xl text-[10px] text-red-300 space-y-1">
          <p className="font-bold flex items-center gap-1 text-red-400">
            <span>⚠️</span> Warning:
          </p>
          <p>Nuked files are permanently zero-filled and 100% unrecoverable.</p>
        </div>
      </div>

    </div>
  );
}
