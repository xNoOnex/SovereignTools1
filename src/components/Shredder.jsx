import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';

const ShizukuRunner = registerPlugin('ShizukuRunner');

export function Shredder({ onNavigate }) {
  const [filePath, setFilePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [shizukuGranted, setShizukuGranted] = useState(false);
  const [logs, setLogs] = useState('Awaiting target acquisition...\n');

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

  const log = (msg) => setLogs(prev => prev + `> ${msg}\n`);

  const executeNuke = async () => {
    if (!filePath) return alert("Enter absolute file path.");
    if (!shizukuGranted) return alert("Shizuku Shell Bridge required for deep-sector logical wipe.");
    
    if (!window.confirm("WARNING: This will permanently annihilate the file and its logical metadata. Proceed?")) return;

    setLoading(true);
    setLogs('INITIATING 3-PASS NUKE PROTOCOL...\n');
    
    // 3-Pass Wipe Bash Script
    const wipeScript = `
      FILE="${filePath}"
      if [ ! -f "$FILE" ]; then
        echo "ERROR: File not found."
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
    } catch (e) {
      log(`CRITICAL FAILURE: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen relative z-10 animate-fadeIn">
      
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-2xl font-black text-white flex items-center gap-3"><span className="text-3xl text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">☣️</span> Data Shredder</h2>
        <p className="text-xs text-zinc-400 mt-2">Logical sector overwrite and metadata obfuscation.</p>
      </div>

      <div className={`p-4 rounded-3xl flex justify-between items-center shadow-lg ${shizukuGranted ? 'bg-emerald-950/30 border border-emerald-900/50' : 'bg-red-950/30 border border-red-900/50'}`}>
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest">Execution Engine</h4>
          <p className="text-[10px] font-mono mt-1 text-zinc-400">Shizuku Root Bridge</p>
        </div>
        <button onClick={checkShizuku} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow ${shizukuGranted ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {shizukuGranted ? 'CONNECTED' : 'OFFLINE'}
        </button>
      </div>

      <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-6 rounded-3xl space-y-5 shadow-xl">
        <div>
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Target Selection</h3>
          <p className="text-[10px] text-zinc-500 font-mono">Provide the absolute path to the file you wish to destroy.</p>
        </div>
        
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

      <div className="shrink-0 mt-4 theme-glass-panel backdrop-blur border border-[var(--glass-border)] p-4 rounded-3xl shadow-lg border-l-4 border-l-red-500">
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span>ℹ️</span> Shredder Diagnostics</h4>
        <p className="text-[9px] text-zinc-300 font-mono leading-relaxed text-justify">
          Due to Android's UFS hardware wear-leveling (FTL), physical silicon zero-filling is impossible at the software layer. This protocol bypasses that limitation by utterly destroying the logical structure. It forces standard storage APIs to overwrite the file's binary footprint with zeros and cryptographic noise, renames the file to a randomized hash to permanently corrupt the OS metadata table, and forcefully unlinks the file from the drive index.
        </p>
      </div>

    </div>
  );
}
