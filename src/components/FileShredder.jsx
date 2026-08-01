import React, { useState, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function FileShredder() {
  const [deviceFiles, setDeviceFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const autoScanDeviceFiles = () => {
    setIsScanning(true);
    if (window.AndroidNative && window.AndroidNative.getAllDeviceFiles) {
      try {
        const rawJson = window.AndroidNative.getAllDeviceFiles();
        const parsed = JSON.parse(rawJson);
        setDeviceFiles(parsed);
      } catch (err) {
        console.error("Auto-scan error:", err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    autoScanDeviceFiles();
  }, []);

  const nukeFile = (file) => {
    if (file.absolutePath && window.AndroidNative && window.AndroidNative.shredFileByAbsolutePath) {
      const success = window.AndroidNative.shredFileByAbsolutePath(file.absolutePath);
      if (success) {
        setStatusMsg(`💥 Shredded & Sectors Zeroed: ${file.name}`);
        setDeviceFiles(prev => prev.filter(f => f.id !== file.id));
        setTimeout(() => setStatusMsg(''), 2500);
        return;
      }
    }
  };

  const filteredFiles = deviceFiles.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.absolutePath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            ☣️ Full-Device Hardware Shredder
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Automated storage scan & physical sector byte-zeroing.
          </p>
        </div>
        <button
          onClick={autoScanDeviceFiles}
          disabled={isScanning}
          className="text-xs bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-3 py-1.5 rounded-xl shadow transition-all"
        >
          {isScanning ? '🔍 Scanning...' : '🔄 Rescan Phone'}
        </button>
      </div>

      {statusMsg && (
        <div className="bg-red-950/90 border border-red-500/50 text-red-300 text-xs font-bold py-2.5 px-3 rounded-xl text-center shadow-lg">
          {statusMsg}
        </div>
      )}

      {/* SEARCH / FILTER BAR */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter scanned files (e.g., .jpg, pdf, Screenshot, Download)..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* AUTOMATED DEVICE FILE MATRIX */}
      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">
            Scanned Device Files ({filteredFiles.length} / {deviceFiles.length})
          </h3>
          <span className="text-[9px] font-mono text-emerald-400 font-bold">🛡️ ALL-FILES ACCESS ACTIVE</span>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-zinc-800 rounded-2xl text-center space-y-2">
            <span className="text-2xl">🔍</span>
            <div className="text-xs font-bold text-zinc-300">
              {deviceFiles.length === 0 ? 'Scanning Storage...' : 'No Files Match Search Query'}
            </div>
            <p className="text-[10px] text-zinc-500">
              Tap "Rescan Phone" above to refresh system storage index.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredFiles.map(file => (
              <div key={file.id} className="bg-black p-3 rounded-xl border border-zinc-800 flex justify-between items-center text-xs hover:border-zinc-700 transition-all">
                <div className="truncate max-w-[70%] space-y-0.5">
                  <div className="font-mono text-white text-[11px] font-bold truncate">{file.name}</div>
                  <div className="text-[9px] text-cyan-400 font-mono truncate">{file.absolutePath}</div>
                  <div className="text-[8px] font-mono text-zinc-500">{file.size} • {file.mimeType}</div>
                </div>
                <button
                  onClick={() => nukeFile(file)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-[10px] uppercase rounded-xl shadow-lg shadow-red-600/20"
                >
                  💥 Nuke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToolFooter
        title="Automated Storage Sector Sanitizer"
        details="Queries system storage indices automatically and overwrites physical file sectors with zeroes on demand."
        disclaimer="Destroyed files are unrecoverable."
      />
    </div>
  );
}
