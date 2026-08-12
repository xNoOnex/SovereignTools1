import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';
import { useStorage } from '../context/StorageContext';

const ShizukuRunner = registerPlugin('ShizukuRunner');

export function Shredder({ onNavigate }) {
  const { indexedFiles, runGlobalScan } = useStorage();
  const [filePath, setFilePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [shizukuGranted, setShizukuGranted] = useState(false);
  const [logs, setLogs] = useState('Awaiting target acquisition...\n');
  const [showPicker, setShowPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const forceRequestShizuku = async () => {
    try {
      const res = await ShizukuRunner.requestPermission();
      setShizukuGranted(res.granted);
      if (res.granted) {
          alert("Shizuku Permission Granted!");
      } else {
          alert("Permission denied or prompt failed. Ensure Shizuku is running.");
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const log = (msg) => setLogs(prev => prev + `> ${msg}\n`);

  const executeNuke = async () => {
    if (!filePath) return alert("Select or enter a target file path.");
    if (!shizukuGranted) return alert("Shizuku Shell Bridge required for deep-sector logical wipe.");
    
    if (!window.confirm("WARNING: This will permanently annihilate the file and its logical metadata. Proceed?")) return;

    setLoading(true);
    setLogs('INITIATING 3-PASS NUKE PROTOCOL...\n');
    
    const wipeScript = `
      FILE="${filePath}"
      if [ ! -f "$FILE" ]; then
        echo "ERROR: File not found at path."
        exit 1
      fi
      SIZE=$(stat -c%s "$FILE")
      BLOCKS=$((SIZE / 4096 + 1))
      
      echo "Pass 1: Zero-filling logical sectors..."
      dd if=/dev/zero of="$FILE" bs=4096 count=$BLOCKS 2>/dev/null
      
      echo "Pass 2: Cryptographic noise injection..."
      dd if=/dev/urandom of="$FILE" bs=4096 count=$BLOCKS 2>/dev/null
      
      echo "Pass 3: Obfuscating metadata and unlinking..."
      DIR=$(dirname "$FILE")
      RAND_NAME="obliterated_$(date +%s%N).tmp"
      mv "$FILE" "$DIR/$RAND_NAME"
      rm -f "$DIR/$RAND_NAME"
      
      echo "TARGET SUCCESSFULLY ANNIHILATED."
    `;

    try {
      const res = await ShizukuRunner.executeCommand({ command: wipeScript });
      setLogs(prev => prev + res.output);
      setFilePath('');
      runGlobalScan(); 
    } catch (e) {
      log(`CRITICAL FAILURE: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = indexedFiles.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen relative z-10 animate-fadeIn">
      
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-2xl font-black text-white flex items-center gap-3"><span className="text-3xl text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">☣️</span> Data Shredder [WIP]</h2>
        <p className="text-xs text-zinc-400 mt-2">Logical sector overwrite and metadata obfuscation.</p>
      </div>

      <div className={`p-4 rounded-3xl flex flex-col gap-3 shadow-lg ${shizukuGranted ? 'bg-emerald-950/30 border border-emerald-900/50' : 'bg-red-950/30 border border-red-900/50'}`}>
        <div className="flex justify-between items-center">
            <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Execution Engine</h4>
            <p className="text-[10px] font-mono mt-1 text-zinc-400">Shizuku Root Bridge</p>
            </div>
            <button onClick={checkShizuku} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow ${shizukuGranted ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {shizukuGranted ? 'CONNECTED' : 'CHECK STATUS'}
            </button>
        </div>
        {!shizukuGranted && (
            <button onClick={forceRequestShizuku} className="w-full py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white uppercase tracking-widest active:scale-95 shadow">
                Force Permission Request
            </button>
        )}
      </div>

      <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-6 rounded-3xl space-y-5 shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Target Selection</h3>
            <p className="text-[10px] text-zinc-500 font-mono">Select a file from storage or enter absolute path.</p>
          </div>
          <button onClick={() => setShowPicker(!showPicker)} className="bg-zinc-800 border border-zinc-700 text-xs font-bold px-4 py-2 rounded-xl active:scale-95 shadow">
            {showPicker ? 'Close Picker' : '📂 Pick File'}
          </button>
        </div>

        {showPicker && (
          <div className="bg-black/90 border border-zinc-800 rounded-2xl p-4 space-y-3 animate-fadeIn">
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="🔍 Search indexed files..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none" />
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {filteredFiles.length === 0 ? (
                <div className="flex flex-col gap-2 items-center text-center text-zinc-600 font-mono text-xs py-4">
                    <span>No files found.</span>
                    <button onClick={runGlobalScan} className="bg-zinc-800 text-white px-4 py-2 rounded-lg text-[10px] uppercase font-bold border border-zinc-700">Run Global Rescan</button>
                </div>
              ) : (
                filteredFiles.map((file, idx) => (
                  <div key={idx} onClick={() => { setFilePath(file.path); setShowPicker(false); }} className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl cursor-pointer hover:border-red-500/50 flex justify-between items-center active:scale-95 transition-all">
                    <span className="text-xs font-bold text-white truncate pr-2">{file.name}</span>
                    <span className="text-[9px] text-zinc-500 font-mono truncate max-w-[150px]">{file.path}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        <input 
          type="text" 
          value={filePath} 
          onChange={e => setFilePath(e.target.value)} 
          placeholder="/storage/emulated/0/Download/target.mp4" 
          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-4 text-xs text-white font-mono focus:outline-none focus:border-red-500 transition-colors shadow-inner" 
        />
        
        <button 
          onClick={executeNuke} 
          disabled={loading || !shizukuGranted || !filePath} 
          className="w-full py-5 bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95 disabled:opacity-50 disabled:shadow-none transition-all"
        >
          {loading ? 'EXECUTING NUKE...' : '🔥 ANNIHILATE TARGET'}
        </button>
      </div>

      <div className="bg-black border border-zinc-800 rounded-2xl p-4 overflow-y-auto font-mono text-[9px] text-zinc-400 whitespace-pre-wrap shadow-inner h-40">
        {logs}
      </div>
    </div>
  );
}
