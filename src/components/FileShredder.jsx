import React, { useState, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function FileShredder() {
  const [sovereignFiles, setSovereignFiles] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');

  const loadSovereignFiles = () => {
    if (window.AndroidNative && window.AndroidNative.getSovereignGalleryPhotos) {
      try {
        const rawJson = window.AndroidNative.getSovereignGalleryPhotos();
        const parsed = JSON.parse(rawJson);
        setSovereignFiles(parsed);
      } catch (err) {
        console.error("Shredder load error:", err);
      }
    }
  };

  useEffect(() => {
    loadSovereignFiles();
  }, []);

  const nukeFile = (item) => {
    if (item.absolutePath && window.AndroidNative && window.AndroidNative.shredFileByAbsolutePath) {
      const success = window.AndroidNative.shredFileByAbsolutePath(item.absolutePath);
      if (success) {
        setStatusMsg(`💥 Shredded: ${item.name}`);
        loadSovereignFiles();
        setTimeout(() => setStatusMsg(''), 2500);
        return;
      }
    }
    // Fallback URI shred
    if (item.uri && window.AndroidNative && window.AndroidNative.shredFileByUri) {
      window.AndroidNative.shredFileByUri(item.uri);
      loadSovereignFiles();
      setStatusMsg(`💥 Shredded handle for ${item.name}`);
      setTimeout(() => setStatusMsg(''), 2500);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            ☣️ Absolute Hardware File Shredder
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Direct physical sector zero-fill (RandomAccessFile) for sovereign media.
          </p>
        </div>
        <button
          onClick={loadSovereignFiles}
          className="text-xs bg-zinc-800 text-cyan-400 border border-zinc-700 px-3 py-1.5 rounded-xl font-bold"
        >
          🔄 Refresh Files
        </button>
      </div>

      {statusMsg && (
        <div className="bg-red-950/90 border border-red-500/50 text-red-300 text-xs font-bold py-2.5 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">
          Sovereign Directory Target List ({sovereignFiles.length})
        </h3>
        <p className="text-[10px] text-zinc-400">
          Photos and videos captured in your EXIF-Free camera or stored in Sovereign folders are listed below. Tapping "Nuke" executes immediate sector byte-zeroing on disk.
        </p>

        {sovereignFiles.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-zinc-800 rounded-2xl text-center space-y-2">
            <span className="text-2xl">🛡️</span>
            <div className="text-xs font-bold text-zinc-300">No Target Files Found in Storage</div>
            <p className="text-[10px] text-zinc-500">Capture photos in Camera mode to test absolute physical shredding.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sovereignFiles.map(file => (
              <div key={file.id} className="bg-black p-3 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                <div className="truncate max-w-[200px]">
                  <div className="font-mono text-white text-[11px] truncate">{file.name}</div>
                  <div className="text-[9px] text-zinc-500 truncate">{file.absolutePath || file.folder}</div>
                </div>
                <button
                  onClick={() => nukeFile(file)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase rounded-lg shadow"
                >
                  💥 Nuke File
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToolFooter
        title="Hardware Sector Sanitizer"
        details="Overwrites absolute file storage paths with binary zeroes before unlinking disk descriptors."
        disclaimer="Shredded files cannot be recovered by any forensic tool."
      />
    </div>
  );
}
