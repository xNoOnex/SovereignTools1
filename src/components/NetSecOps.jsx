import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';

const ShizukuRunner = registerPlugin('ShizukuRunner');

export function NetSecOps({ onNavigate }) {
  const [shizukuGranted, setShizukuGranted] = useState(false);
  const [logs, setLogs] = useState('> NetSec Diagnostics Engine Ready...\n');

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

  const runCommand = async (cmd) => {
    if (!shizukuGranted) return alert("Shizuku Shell Bridge required.");
    setLogs(prev => prev + `> Executing: ${cmd}\n`);
    try {
      const res = await ShizukuRunner.executeCommand({ command: cmd });
      setLogs(prev => prev + res.output + '\n');
    } catch (e) {
      setLogs(prev => prev + `ERROR: ${e.message}\n`);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen relative z-10 animate-fadeIn">
      
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-2xl font-black text-white flex items-center gap-3"><span className="text-3xl text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">⚡</span> NetSec & SysOps Hub</h2>
        <p className="text-xs text-zinc-400 mt-2">Unified dashboard for network diagnostics and native shell administration.</p>
      </div>

      <div className={`p-4 rounded-3xl flex flex-col gap-3 shadow-lg ${shizukuGranted ? 'bg-emerald-950/30 border border-emerald-900/50' : 'bg-red-950/30 border border-red-900/50'}`}>
        <div className="flex justify-between items-center">
            <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Shizuku Shell Bridge</h4>
            <p className="text-[10px] font-mono mt-1 text-zinc-400">Required for SysOps Modules</p>
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

      <div className="bg-black border border-zinc-800 rounded-2xl p-4 overflow-y-auto font-mono text-[9px] text-zinc-400 whitespace-pre-wrap shadow-inner h-48">
        {logs}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
          <button onClick={() => runCommand('ping -c 4 1.1.1.1')} className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-3xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
              <span className="text-2xl">📡</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Ping Network</span>
          </button>
          <button onClick={() => runCommand('pm list packages -3')} className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-3xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
              <span className="text-2xl">📦</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">List Packages</span>
          </button>
      </div>

    </div>
  );
}
