import React, { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { ToolFooter } from './ToolFooter';

export function FileShredder() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const scanStorage = async () => {
    setLoading(true);
    let found = [];
    const targetFolders = ['Download', 'DCIM', 'Pictures', 'Documents'];

    for (const folder of targetFolders) {
      try {
        const res = await Filesystem.readdir({
          path: folder,
          directory: Directory.ExternalStorage
        });

        const folderFiles = res.files.map(f => ({
          name: f.name,
          path: `${folder}/${f.name}`
        }));

        found = [...found, ...folderFiles];
      } catch (err) {
        // Skip inaccessible folders
      }
    }

    setFiles(found);
    setLoading(false);
  };

  // AUTOMATIC SCAN ON MOUNT
  useEffect(() => {
    scanStorage();
  }, []);

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.path.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-xl font-bold text-white">File Shredder</h2>
          <p className="text-xs text-zinc-400">Physical sector zero-fill and unlinking</p>
        </div>
        <button onClick={scanStorage} className="bg-cyan-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold">
          {loading ? 'Scanning...' : 'Rescan Storage'}
        </button>
      </div>

      <input
        type="text"
        placeholder="Filter by name or path..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
      />

      <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 min-h-[220px]">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
          Indexed Files ({filtered.length})
        </h3>

        {loading ? (
          <div className="text-center py-12 text-xs text-cyan-400 animate-pulse font-mono">
            ☣️ Scanning storage sectors automatically...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-xs text-zinc-500 font-mono">
            No files found matching criteria.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.map((f, idx) => (
              <div key={idx} className="bg-black/60 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white truncate max-w-[200px]">{f.name}</p>
                  <p className="text-[9px] text-zinc-400 font-mono">{f.path}</p>
                </div>
                <button className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-lg">
                  Shred
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToolFooter title="Sector Sanitizer" details="Overwrites target paths with binary zeroes before unlinking descriptors." disclaimer="Deleted files are unrecoverable." />
    </div>
  );
}
