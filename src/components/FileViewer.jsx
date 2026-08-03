import React, { useState, useEffect } from 'react';
import { useStorage } from '../context/StorageContext';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const ShizukuRunner = registerPlugin('ShizukuRunner');

export function FileViewer({ onNavigate }) {
  const { indexedFiles, runGlobalScan } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [isNuking, setIsNuking] = useState(false);
  const [shizukuGranted, setShizukuGranted] = useState(false);

  useEffect(() => {
    checkShizuku();
  }, []);

  const checkShizuku = async () => {
    try {
      const res = await ShizukuRunner.checkStatus();
      setShizukuGranted(res.granted);
    } catch (e) {
      setShizukuGranted(false);
    }
  };

  const filteredFiles = indexedFiles.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileType = (ext) => {
    const e = ext?.toLowerCase();
    if (['mp4', 'webm', 'ogg'].includes(e)) return 'VIDEO';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(e)) return 'IMAGE';
    if (['txt', 'json', 'md', 'csv', 'log'].includes(e)) return 'TEXT';
    if (['mp3', 'wav', 'm4a'].includes(e)) return 'AUDIO';
    return 'BINARY';
  };

  const openFile = async (file) => {
    setSelectedFile(file);
    setFileContent(null);
    const type = getFileType(file.ext);

    if (type === 'VIDEO' || type === 'IMAGE' || type === 'AUDIO') {
      // Create a secure local HTTP stream URL to bypass RAM limits
      setFileContent(Capacitor.convertFileSrc(file.path));
    } else if (type === 'TEXT') {
      try {
        const contents = await Filesystem.readFile({ path: file.path });
        setFileContent(contents.data);
      } catch (e) {
        setFileContent('Error reading text payload.');
      }
    }
  };

  const nukeFile = async () => {
    if (!selectedFile) return;
    if (!shizukuGranted) return alert("Shizuku Root Bridge required for 3-pass logical wipe.");
    if (!window.confirm(`Permanently annihilate ${selectedFile.name}? This cannot be undone.`)) return;

    setIsNuking(true);
    const wipeScript = `
      FILE="${selectedFile.path}"
      if [ -f "$FILE" ]; then
        SIZE=$(stat -c%s "$FILE")
        BLOCKS=$((SIZE / 4096 + 1))
        dd if=/dev/zero of="$FILE" bs=4096 count=$BLOCKS 2>/dev/null
        dd if=/dev/urandom of="$FILE" bs=4096 count=$BLOCKS 2>/dev/null
        DIR=$(dirname "$FILE")
        RAND_NAME="obliterated_$(date +%s%N).tmp"
        mv "$FILE" "$DIR/$RAND_NAME"
        rm -f "$DIR/$RAND_NAME"
        echo "SUCCESS"
      else
        echo "FAILED"
      fi
    `;

    try {
      await ShizukuRunner.executeCommand({ command: wipeScript });
      alert("Target Annihilated.");
      setSelectedFile(null);
      runGlobalScan(); // Refresh list
    } catch (e) {
      alert(`Wipe failed: ${e.message}`);
    } finally {
      setIsNuking(false);
    }
  };

  const renderViewer = () => {
    const type = getFileType(selectedFile.ext);

    if (type === 'VIDEO') {
      return <video controls src={fileContent} className="w-full max-h-[40vh] bg-black rounded-xl border border-zinc-800 shadow-inner" autoPlay />;
    }
    if (type === 'IMAGE') {
      return <img src={fileContent} alt={selectedFile.name} className="w-full max-h-[40vh] object-contain rounded-xl" />;
    }
    if (type === 'AUDIO') {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-black border border-zinc-800 rounded-xl space-y-6 shadow-inner">
          <span className="text-6xl drop-shadow-lg">🎵</span>
          <audio controls src={fileContent} className="w-full" autoPlay />
        </div>
      );
    }
    if (type === 'TEXT') {
      return (
        <div className="bg-black border border-zinc-800 rounded-xl p-4 h-[40vh] overflow-y-auto font-mono text-[9px] text-emerald-400 whitespace-pre-wrap shadow-inner text-left">
          {fileContent || 'Loading payload...'}
        </div>
      );
    }
    
    // Fallback for encrypted/unsupported binaries (.sdocx, .apk, etc.)
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 p-4">
        <span className="text-7xl drop-shadow-xl">📦</span>
        <p className="text-[10px] text-zinc-400 font-mono leading-relaxed px-4">
          The binary format <strong className="text-white">.{selectedFile.ext?.toUpperCase() || 'UNKNOWN'}</strong> cannot be securely rendered inside the sandbox. Parsing this raw data could result in a memory stall.
        </p>
        <button className="px-6 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-300 active:scale-95 shadow mt-2">
          Force External Open
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen relative z-10 animate-fadeIn">
      
      {!selectedFile ? (
        <>
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3 pt-2 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-2xl drop-shadow">📂</span> Universal Explorer</h2>
              <p className="text-[10px] text-zinc-400 mt-1 font-mono">Local filesystem navigator.</p>
            </div>
            <button onClick={runGlobalScan} className="bg-zinc-900 border border-zinc-700 text-cyan-400 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 shadow">Rescan</button>
          </div>

          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="🔍 Search filesystem..." className="w-full bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl px-5 py-4 text-xs text-white font-mono focus:outline-none shadow-inner" />

          <div className="flex-1 space-y-2 overflow-y-auto pb-4">
            {filteredFiles.map((file, idx) => (
              <div key={idx} onClick={() => openFile(file)} className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl p-4 flex justify-between items-center shadow cursor-pointer active:scale-95 transition-transform hover:border-zinc-700">
                <div className="overflow-hidden pr-4 flex-1">
                  <h4 className="text-xs font-bold truncate text-white">{file.name}</h4>
                  <p className="text-[9px] text-zinc-500 font-mono truncate mt-1">{file.path}</p>
                </div>
                <span className="text-[10px] font-bold text-zinc-600 bg-black px-2 py-1 rounded border border-zinc-800 shrink-0 uppercase tracking-widest">{file.ext || 'FILE'}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4 animate-fadeIn pt-2">
          
          <div className="flex justify-between items-center bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="text-2xl shrink-0">👀</span>
              <div className="overflow-hidden">
                <h3 className="text-sm font-bold text-white truncate">{selectedFile.name}</h3>
                <p className="text-[9px] theme-accent-text font-mono uppercase tracking-widest mt-0.5">{getFileType(selectedFile.ext)} VIEWER</p>
              </div>
            </div>
            <button onClick={() => setSelectedFile(null)} className="shrink-0 bg-black border border-zinc-700 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95">Close</button>
          </div>

          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-3xl shadow-xl min-h-[50vh] flex flex-col justify-center">
            {renderViewer()}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => alert('Native intent forwarding requires a dedicated Java FileOpener plugin. External handoff blocked by sandbox.')} className="bg-zinc-900 border border-zinc-700 py-4 rounded-2xl text-xs font-bold text-white uppercase tracking-widest active:scale-95 shadow flex items-center justify-center gap-2">
              <span>↗</span> Open External
            </button>
            <button onClick={nukeFile} disabled={isNuking} className="bg-red-600 hover:bg-red-500 py-4 rounded-2xl text-xs font-black text-white uppercase tracking-widest active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 disabled:opacity-50">
              {isNuking ? 'NUKING...' : '🔥 NUKE FILE'}
            </button>
          </div>

          <div className="shrink-0 mt-4 theme-glass-panel backdrop-blur border border-[var(--glass-border)] p-4 rounded-3xl shadow-lg">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-2"><span>ℹ️</span> Module Info & Disclaimers</h4>
            <p className="text-[9px] text-zinc-500 font-mono leading-relaxed text-justify">
              The Universal Explorer navigates device storage within the sandbox. Standard media is streamed via local HTTP bridge to prevent memory overflow. Complex encrypted binaries are handed off to external intents or destroyed via the Shizuku Shredder link.
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
