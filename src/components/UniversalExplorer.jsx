import React, { useState, useEffect } from 'react';
import { Filesystem, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';

export default function UniversalExplorer({ onBack }) {
  const ROOT_PATH = '/storage/emulated/0';
  const [currentPath, setCurrentPath] = useState(ROOT_PATH);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  const loadDirectory = async (targetPath) => {
    setLoading(true);
    setSelectedFile(null);
    setFileContent('');
    setStatusMsg('');
    try {
      const res = await Filesystem.readdir({
        path: targetPath,
      });

      const sorted = (res.files || []).sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });

      setItems(sorted);
    } catch (err) {
      console.error("Error reading directory:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (item) => {
    const fullPath = `${currentPath}/${item.name}`;
    
    if (item.type === 'directory') {
      setCurrentPath(fullPath);
    } else {
      const ext = item.name.split('.').pop().toLowerCase();
      const webUrl = Capacitor.convertFileSrc(fullPath);
      
      let previewType = 'binary';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        previewType = 'image';
      } else if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
        previewType = 'audio';
      } else if (['txt', 'md', 'json', 'js', 'html', 'css', 'py', 'sh', 'log'].includes(ext)) {
        previewType = 'text';
        try {
          const contents = await Filesystem.readFile({
            path: fullPath,
            encoding: Encoding.UTF8
          });
          setFileContent(contents.data);
        } catch (e) {
          setFileContent("Error reading text file content.");
        }
      }

      setSelectedFile({
        name: item.name,
        path: fullPath,
        ext,
        webUrl,
        previewType,
        size: item.size
      });
    }
  };

  const openNativeExternal = async (filePath) => {
    try {
      setStatusMsg("Launching external application...");
      await FileOpener.openFile({
        path: filePath,
      });
      setStatusMsg("");
    } catch (err) {
      console.error("FileOpener Error:", err);
      setStatusMsg("Failed to open externally: " + (err.message || "No app handle"));
    }
  };

  const navigateUp = () => {
    if (currentPath === ROOT_PATH || currentPath === '') return;
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    setCurrentPath(parentPath || ROOT_PATH);
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto text-gray-100 pb-24">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📁</span>
          <div>
            <h2 className="text-xl font-bold tracking-wide">Universal Explorer</h2>
            <p className="text-xs text-gray-400 font-mono overflow-x-auto max-w-xs sm:max-w-md">
              {currentPath}
            </p>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 font-mono"
        >
          CLOSE
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <button
          onClick={navigateUp}
          disabled={currentPath === ROOT_PATH}
          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-gray-800 text-xs font-mono rounded border border-gray-700 flex items-center gap-1"
        >
          ⬆️ UP
        </button>
        <input
          type="text"
          placeholder="Search folder..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-black/60 border border-gray-800 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
        />
        <button
          onClick={() => loadDirectory(currentPath)}
          className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/80 rounded text-xs font-mono"
        >
          RESCAN
        </button>
      </div>

      {statusMsg && (
        <div className="text-xs font-mono text-amber-400 bg-amber-950/40 p-2 rounded border border-amber-800">
          {statusMsg}
        </div>
      )}

      {selectedFile && (
        <div className="bg-gray-900/95 border border-emerald-500/40 rounded-lg p-4 space-y-3 relative">
          <div className="flex justify-between items-start border-b border-gray-800 pb-2">
            <div>
              <h3 className="text-sm font-bold text-emerald-400 font-mono">{selectedFile.name}</h3>
              <p className="text-[10px] text-gray-500 font-mono">{selectedFile.path}</p>
            </div>
            <button 
              onClick={() => setSelectedFile(null)}
              className="text-xs font-mono px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded"
            >
              ✕
            </button>
          </div>

          {selectedFile.previewType === 'image' && (
            <div className="flex justify-center bg-black/80 rounded p-2 border border-gray-800">
              <img src={selectedFile.webUrl} alt={selectedFile.name} className="max-h-64 object-contain rounded" />
            </div>
          )}

          {selectedFile.previewType === 'audio' && (
            <div className="bg-black/80 p-3 rounded border border-gray-800">
              <audio controls src={selectedFile.webUrl} className="w-full" />
            </div>
          )}

          {selectedFile.previewType === 'text' && (
            <div className="bg-black/90 p-3 rounded border border-gray-800 max-h-60 overflow-y-auto font-mono text-xs text-emerald-300 whitespace-pre-wrap">
              {fileContent}
            </div>
          )}

          {selectedFile.previewType === 'binary' && (
            <div className="text-center py-6 bg-black/60 border border-gray-800 rounded space-y-3">
              <span className="text-3xl">📦</span>
              <p className="text-xs text-gray-400 font-mono">
                Binary format <span className="text-amber-400">.{selectedFile.ext}</span>
              </p>
              <button
                onClick={() => openNativeExternal(selectedFile.path)}
                className="px-4 py-2 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-600 rounded text-xs font-mono font-bold"
              >
                🔓 OPEN IN SYSTEM APP
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-xs font-mono text-gray-500">
          Reading directory nodes...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-xs font-mono text-gray-500 border border-dashed border-gray-800 rounded">
          Folder is empty or unreadable.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1.5 font-mono">
          {filteredItems.map((item, idx) => {
            const isDir = item.type === 'directory';
            return (
              <div
                key={idx}
                onClick={() => handleItemClick(item)}
                className={`flex items-center justify-between p-2.5 rounded border text-xs cursor-pointer transition-colors ${
                  isDir 
                    ? 'bg-gray-900/60 border-gray-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-gray-200' 
                    : 'bg-black/40 border-gray-900 hover:border-gray-700 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="text-base">{isDir ? '📁' : '📄'}</span>
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 border border-gray-800 text-gray-500 uppercase">
                  {isDir ? 'DIR' : item.name.split('.').pop() || 'FILE'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
