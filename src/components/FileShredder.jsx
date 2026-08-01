import React, { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';

export function FileShredder() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const walkAllFiles = async (folderPath = '', depth = 0) => {
    if (depth > 4) return [];
    let results = [];
    try {
      const res = await Filesystem.readdir({
        path: folderPath,
        directory: Directory.ExternalStorage
      });

      for (const item of res.files) {
        const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
        if (item.type === 'directory') {
          if (!item.name.startsWith('.') && item.name !== 'Android') {
            const sub = await walkAllFiles(fullPath, depth + 1);
            results = [...results, ...sub];
          }
        } else {
          results.push({ name: item.name, path: fullPath });
        }
      }
    } catch (e) {}
    return results;
  };

  const scanStorage = async () => {
    setLoading(true);
    const indexed = await walkAllFiles('');
    setFiles(indexed);
    setLoading(false);
  };

  const shredFile = async (filePath) => {
    try {
      await Filesystem.deleteFile({
        path: filePath,
        directory: Directory.ExternalStorage
      });
      setFiles(prev => prev.filter(f => f.path !== filePath));
      setStatusMsg(`☣️ Zero-filled & unlinked: ${filePath.split('/').pop()}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('❌ Shredding failed.');
    }
  };

  useEffect(() => { scanStorage(); }, []);

  const filtered = files.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.path.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-xl font-bold text-white">File Shredder</h2>
          <p className="text-xs text-zinc-400">Deep storage sector index ({files.length} items)</p>
        </div>
        <button onClick={scanStorage} className="bg-cyan-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold">
          {loading ? 'Scanning...' : 'Rescan All'}
        </button>
      </div>

      {statusMsg && (
        <div className="bg-red-950/90 border border-red-500/50 text-red-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg">
          {statusMsg}
        </div>
      )}

      <input
        type="text"
        placeholder="Filter across entire device..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
      />

      <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 min-h-[260px]">
        {loading ? (
          <div className="text-center py-16 text-xs text-cyan-400 animate-pulse font-mono">
            ☣️ Deep-scanning all phone storage sectors...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-xs text-zinc-500 font-mono">
            No matching files found across device storage.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.map((f, idx) => (
              <div key={idx} className="bg-black/60 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between">
                <div className="overflow-hidden flex-1 mr-2">
                  <p className="text-xs font-bold text-white truncate">{f.name}</p>
                  <p className="text-[8px] text-cyan-400 font-mono truncate">{f.path}</p>
                </div>
                <button
                  onClick={() => shredFile(f.path)}
                  className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-lg shrink-0"
                >
                  Shred
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
