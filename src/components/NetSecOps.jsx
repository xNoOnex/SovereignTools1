import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';
import { useStorage } from '../context/StorageContext';

const ShizukuRunner = registerPlugin('ShizukuRunner');

export function NetSecOps({ onNavigate }) {
  const { indexedFiles, runGlobalScan } = useStorage();
  const [shizukuGranted, setShizukuGranted] = useState(false);
  const [logs, setLogs] = useState('> Diagnostics Engine Ready...\n');
  const [activeMainTab, setActiveMainTab] = useState('SYSOPS');
  const [activeNetTab, setActiveNetTab] = useState('Subnet');
  const [cmdInput, setCmdInput] = useState('');
  const [showTerminalInput, setShowTerminalInput] = useState(false);
  
  const [showPicker, setShowPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkShizuku();
  }, []);

  const checkShizuku = async () => {
    try {
      const res = await ShizukuRunner.checkStatus();
      if (res.granted || res.active) {
        setShizukuGranted(true);
      } else {
        setShizukuGranted(false);
      }
    } catch (e) {
      setShizukuGranted(false);
    }
  };

  const forceRequestShizuku = async () => {
    try {
      await ShizukuRunner.requestPermission();
      checkShizuku();
    } catch (e) {
      setLogs(prev => prev + `\n> Permission Request: ${e.message}\n`);
    }
  };

  const runCommand = async (cmd, label) => {
    setLogs(prev => prev + `\n> Executing [${label}]...\n`);
    try {
      const res = await ShizukuRunner.executeCommand({ command: cmd });
      const engineTag = res.engine ? `[${res.engine}] ` : '';
      setLogs(prev => prev + engineTag + (res.output || 'Command executed with no output.') + '\n');
    } catch (e) {
      setLogs(prev => prev + `ERROR: ${e.message}\n`);
    }
  };

  const executeCustomCommand = (e) => {
      e.preventDefault();
      if (!cmdInput.trim()) return;
      runCommand(cmdInput, 'Custom Shell');
      setCmdInput('');
      setShowTerminalInput(false);
  };

  const handleNetworkAction = (tab) => {
    setActiveNetTab(tab);
    switch(tab) {
      case 'Subnet':
        runCommand('ip route && arp -a', 'Subnet Map');
        break;
      case 'Wi-Fi':
        runCommand('dumpsys wifi | grep -E "mNetworkInfo|SSID|BSSID"', 'Wi-Fi Status');
        break;
      case 'Leak Shield':
        runCommand('ping -c 4 1.1.1.1', 'Ping Audit');
        break;
      case 'Sockets':
        runCommand('netstat -tuln | head -n 30', 'Open Sockets');
        break;
      case 'MAC Mask':
        runCommand('ip link show wlan0', 'MAC Identity');
        break;
      default:
        break;
    }
  };

  const executeDowngrade = async (filePath) => {
    setShowPicker(false);
    if (!window.confirm(`Force install via: ${filePath}?`)) return;
    runCommand(`pm install -r -d "${filePath}"`, 'APK Downgrader');
  };

  const netTabs = ['Subnet', 'Wi-Fi', 'Leak Shield', 'Sockets', 'MAC Mask'];
  const filteredFiles = indexedFiles.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()) && f.ext === 'apk');

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-32 select-none font-sans text-white min-h-screen relative z-10 animate-fadeIn">
      
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-2xl font-black text-white flex items-center gap-3"><span className="text-3xl text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">⚡</span> NetSec & SysOps Hub</h2>
        <p className="text-xs text-zinc-400 mt-2">Unified dashboard for network diagnostics and native shell administration.</p>
      </div>

      <div className={`p-4 rounded-3xl flex flex-col gap-4 shadow-xl ${shizukuGranted ? 'bg-emerald-950/30 border border-emerald-900/50' : 'bg-red-950/30 border border-red-900/50'}`}>
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Shizuku Shell Bridge</h4>
            <p className="text-[10px] font-mono mt-1 text-zinc-400">Required for root-level execution</p>
          </div>
          <button onClick={checkShizuku} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow ${shizukuGranted ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {shizukuGranted ? 'CONNECTED' : 'OFFLINE'}
          </button>
        </div>
        {!shizukuGranted && (
          <button onClick={forceRequestShizuku} className="w-full py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest active:scale-95 shadow hover:border-zinc-500">
            Force Permission Request
          </button>
        )}
      </div>

      <div className="flex gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 shrink-0 shadow-inner">
        <button onClick={() => setActiveMainTab('NETWORK')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${activeMainTab === 'NETWORK' ? 'bg-cyan-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}>
          Network Security
        </button>
        <button onClick={() => setActiveMainTab('SYSOPS')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${activeMainTab === 'SYSOPS' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}>
          SysOps Modules
        </button>
      </div>

      {activeMainTab === 'NETWORK' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 bg-black border border-zinc-900 p-2 rounded-2xl shadow-inner">
            {netTabs.map(tab => (
              <button 
                key={tab} 
                onClick={() => handleNetworkAction(tab)} 
                className={`px-5 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all shrink-0 ${activeNetTab === tab ? 'bg-cyan-500 text-black shadow' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-black border border-zinc-800 rounded-3xl p-4 overflow-y-auto font-mono text-[9px] text-cyan-400 whitespace-pre-wrap shadow-inner h-[40vh]">
            {logs}
          </div>
        </div>
      )}

      {activeMainTab === 'SYSOPS' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* TERMINAL UI */}
          <div className="bg-black border border-zinc-800 rounded-3xl p-4 overflow-y-auto font-mono text-[9px] text-amber-400 whitespace-pre-wrap shadow-inner h-32 relative">
            {logs}
            <button onClick={() => setShowTerminalInput(!showTerminalInput)} className="absolute bottom-2 right-2 bg-zinc-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase active:scale-95 shadow">
               {showTerminalInput ? 'CLOSE' : 'EXECUTE >_'}
            </button>
          </div>

          {showTerminalInput && (
             <form onSubmit={executeCustomCommand} className="flex gap-2 animate-fadeIn">
                 <input type="text" value={cmdInput} onChange={(e) => setCmdInput(e.target.value)} placeholder="Type shell command..." className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500" autoFocus />
                 <button type="submit" className="bg-amber-600 text-black px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest active:scale-95 shadow">Run</button>
             </form>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => runCommand('pm list packages -3', 'User Apps')} className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-3xl flex flex-col items-start gap-2 active:scale-95 transition-transform hover:border-amber-500/50 shadow text-left">
              <span className="text-2xl opacity-80">📦</span>
              <div className="mt-1">
                <span className="text-[11px] font-bold text-white block">List User Apps</span>
                <span className="text-[9px] font-mono text-zinc-500 block leading-tight mt-0.5">Scans all 3rd party package names.</span>
              </div>
            </button>
            
            <button onClick={() => { const pkg = prompt("Enter package to force-stop (e.g., com.android.chrome):"); if(pkg) runCommand(`am force-stop ${pkg}`, 'Assassin'); }} className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-3xl flex flex-col items-start gap-2 active:scale-95 transition-transform hover:border-amber-500/50 shadow text-left">
              <span className="text-2xl opacity-80">🔪</span>
              <div className="mt-1">
                <span className="text-[11px] font-bold text-white block">Process Assassin</span>
                <span className="text-[9px] font-mono text-zinc-500 block leading-tight mt-0.5">Force-kill running background tasks.</span>
              </div>
            </button>
            
            <button onClick={() => runCommand('logcat -d | tail -n 50', 'Logcat')} className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-3xl flex flex-col items-start gap-2 active:scale-95 transition-transform hover:border-amber-500/50 shadow text-left">
              <span className="text-2xl opacity-80">📋</span>
              <div className="mt-1">
                <span className="text-[11px] font-bold text-white block">Logcat Inspector</span>
                <span className="text-[9px] font-mono text-zinc-500 block leading-tight mt-0.5">Dump live Android system logs.</span>
              </div>
            </button>
            
            <button onClick={() => setShowPicker(!showPicker)} className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-3xl flex flex-col items-start gap-2 active:scale-95 transition-transform hover:border-amber-500/50 shadow text-left">
              <span className="text-2xl opacity-80">⬇️</span>
              <div className="mt-1">
                <span className="text-[11px] font-bold text-white block">APK Downgrader</span>
                <span className="text-[9px] font-mono text-zinc-500 block leading-tight mt-0.5">Force install via -d flag bypass.</span>
              </div>
            </button>
          </div>

          {showPicker && (
            <div className="bg-black/90 border border-zinc-800 rounded-2xl p-3 space-y-3 animate-fadeIn">
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="🔍 Search APKs..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white font-mono focus:outline-none" />
              <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                {filteredFiles.length === 0 ? (
                  <div className="flex flex-col gap-2 items-center text-center text-zinc-600 font-mono text-xs py-4">
                      <span>No local APKs indexed.</span>
                      <button onClick={runGlobalScan} className="bg-zinc-800 text-white px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold border border-zinc-700 mt-2">Rescan Storage</button>
                  </div>
                ) : (
                  filteredFiles.map((file, idx) => (
                    <div key={idx} onClick={() => executeDowngrade(file.path)} className="bg-zinc-900/90 border border-zinc-800 p-2 rounded-xl cursor-pointer hover:border-amber-500/50 flex justify-between items-center active:scale-95 transition-all">
                      <span className="text-[10px] font-bold text-white truncate pr-2">{file.name}</span>
                      <span className="text-[8px] text-zinc-500 font-mono uppercase">{file.folder}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="shrink-0 mt-4 bg-black/60 backdrop-blur border border-zinc-800 p-5 rounded-3xl shadow-lg">
            <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2"><span>ℹ️</span> Module Disclaimers</h4>
            <p className="text-[9px] text-zinc-400 font-mono leading-relaxed">
              These commands require elevated privileges. Execution will route via <span className="text-emerald-400">Shizuku (Root)</span> if connected. If offline, the engine falls back to <span className="text-red-400">Standard (User)</span> which may trigger native Android Permission Denial exceptions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
