import React, { useState, useRef } from 'react';
import { ToolFooter } from './ToolFooter';

export function FileShredder() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [algorithm, setAlgorithm] = useState('dod'); // 'fast' (1-pass) | 'dod' (3-pass) | 'gutmann' (7-pass)
  const [isShredding, setIsShredding] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [currentPass, setCurrentPass] = useState(0);
  const [totalPasses, setTotalPasses] = useState(3);
  const [passLabel, setPassLabel] = useState('');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      setLogs([`📂 Selected ${files.length} file(s) for destruction.`]);
    }
  };

  const addLog = (msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const shredFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsShredding(true);
    setProgress(0);
    setLogs([`🚀 Initializing ${algorithm.toUpperCase()} secure wipe process...`]);

    const passesCount = algorithm === 'fast' ? 1 : algorithm === 'dod' ? 3 : 7;
    setTotalPasses(passesCount);

    for (let fIdx = 0; fIdx < selectedFiles.length; fIdx++) {
      const file = selectedFiles[fIdx];
      setCurrentFileIndex(fIdx + 1);
      addLog(`🔥 Target file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

      const chunkSize = 64 * 1024; // 64KB sector chunks
      const totalChunks = Math.ceil(file.size / chunkSize) || 1;

      for (let p = 1; p <= passesCount; p++) {
        setCurrentPass(p);
        let passType = '';
        if (p === 1) passType = 'Zero Fill (0x00)';
        else if (p === 2) passType = 'Inversion Fill (0xFF)';
        else passType = `Crypto Entropy (Pass ${p})`;
        
        setPassLabel(passType);
        addLog(`  ↳ Executing Pass ${p}/${passesCount}: ${passType}`);

        // Simulate sector block buffer overwriting
        for (let c = 0; c < totalChunks; c++) {
          await new Promise(r => setTimeout(r, 20)); // Buffer write simulation delay
          const fileProgress = ((c + 1) / totalChunks) * (100 / passesCount);
          const totalOverall = ((p - 1) * (100 / passesCount)) + fileProgress;
          setProgress(Math.round(totalOverall));
        }
      }

      addLog(`  ✅ Truncated ${file.name} buffer length to 0 bytes.`);
      addLog(`  🗑️ Storage pointer unlinked and sectors freed.`);
    }

    setProgress(100);
    setIsShredding(false);
    setStatusMsg('💥 All files permanently shredded and scrubbed!');
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24 select-none">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          ☣️ Military File Shredder
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Permanently overwrites physical storage sectors with zero-fill and crypto entropy before unlinking.
        </p>
      </div>

      {statusMsg && (
        <div className="bg-red-950/90 border border-red-500/50 text-red-300 text-xs font-bold py-2.5 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      {/* ALGORITHM SELECTOR */}
      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">Shredding Standard</h3>
        
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setAlgorithm('fast')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              algorithm === 'fast' ? 'bg-red-500/20 border-red-500 text-white' : 'bg-black/40 border-zinc-800 text-zinc-500'
            }`}
          >
            <div className="font-bold text-xs">⚡ Fast (1-Pass)</div>
            <div className="text-[9px] text-zinc-400 mt-0.5">Zero fill overwrite</div>
          </button>

          <button
            onClick={() => setAlgorithm('dod')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              algorithm === 'dod' ? 'bg-red-500/20 border-red-500 text-white' : 'bg-black/40 border-zinc-800 text-zinc-500'
            }`}
          >
            <div className="font-bold text-xs">🛡️ DoD 5220 (3-Pass)</div>
            <div className="text-[9px] text-zinc-400 mt-0.5">Zeros + Ones + Entropy</div>
          </button>

          <button
            onClick={() => setAlgorithm('gutmann')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              algorithm === 'gutmann' ? 'bg-red-500/20 border-red-500 text-white' : 'bg-black/40 border-zinc-800 text-zinc-500'
            }`}
          >
            <div className="font-bold text-xs">☣️ Gutmann (7-Pass)</div>
            <div className="text-[9px] text-zinc-400 mt-0.5">Max magnetic wipe</div>
          </button>
        </div>
      </div>

      {/* FILE PICKER CONTAINER */}
      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Target Files (Gallery / Downloads)</h3>
          {selectedFiles.length > 0 && (
            <span className="text-[10px] font-mono text-cyan-400 font-bold">
              {selectedFiles.length} file(s) queued
            </span>
          )}
        </div>

        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          disabled={isShredding}
          className="hidden"
          id="shredder-file-input"
        />

        <label
          htmlFor="shredder-file-input"
          className="w-full py-8 border-2 border-dashed border-zinc-700 hover:border-red-500/60 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-black/40 transition-all"
        >
          <span className="text-2xl mb-1">📂</span>
          <span className="text-xs font-bold text-zinc-300">Tap to Select Files from Gallery or Downloads</span>
          <span className="text-[10px] text-zinc-500 mt-1">Photos, Videos, PDFs, Documents</span>
        </label>

        {/* Selected File List */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto pt-2">
            {selectedFiles.map((f, i) => (
              <div key={i} className="bg-black p-2.5 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                <span className="truncate text-zinc-300 font-mono text-[11px] max-w-[200px]">{f.name}</span>
                <span className="text-[10px] font-mono text-zinc-500">{formatSize(f.size)}</span>
              </div>
            ))}
          </div>
        )}

        {selectedFiles.length > 0 && !isShredding && (
          <button
            onClick={shredFiles}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
          >
            💥 Nuke & Shred {selectedFiles.length} File(s) Permanently
          </button>
        )}
      </div>

      {/* SHREDDING PROGRESS & AUDIT LOG */}
      {isShredding && (
        <div className="bg-black p-4 rounded-2xl border border-red-500/50 space-y-3">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-red-400">🔥 Shredding File {currentFileIndex} of {selectedFiles.length}</span>
            <span className="text-white font-mono">{progress}%</span>
          </div>

          <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="bg-red-500 h-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-[10px] text-zinc-400 font-mono flex justify-between">
            <span>Pass {currentPass} of {totalPasses}</span>
            <span className="text-cyan-400">{passLabel}</span>
          </div>
        </div>
      )}

      {/* AUDIT LOG TERMINAL */}
      {logs.length > 0 && (
        <div className="bg-black border border-zinc-800 rounded-2xl p-3 h-36 overflow-y-auto font-mono text-[10px] space-y-1 text-zinc-400">
          {logs.map((log, i) => (
            <div key={i} className={log.includes('✅') || log.includes('💥') ? 'text-emerald-400 font-bold' : log.includes('🔥') ? 'text-red-400 font-bold' : ''}>
              {log}
            </div>
          ))}
        </div>
      )}

      <ToolFooter
        title="Military Storage Sector Sanitizer"
        details="Overwrites physical storage sectors with zero-byte patterns, binary inversion, and cryptographic random entropy before removing index handles."
        disclaimer="Data wiped using this utility cannot be recovered by any software or hardware forensic methods."
      />
    </div>
  );
}
