import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';

const ShizukuRunner = registerPlugin('ShizukuRunner');

export function Home({ onNavigate }) {
  const [shizukuState, setShizukuState] = useState('CHECKING');
  const [meshOptIn, setMeshOptIn] = useState(localStorage.getItem('sovereign_mesh_node') === 'true');
  const [currentMode, setCurrentMode] = useState('EXPERT');

  useEffect(() => {
    const savedMode = localStorage.getItem('sovereign_mode') || 'EXPERT';
    setCurrentMode(savedMode);
    checkEngineStatus();
  }, []);

  const checkEngineStatus = async () => {
    try {
      const res = await ShizukuRunner.checkStatus();
      setShizukuState((res.granted) ? 'CONNECTED' : 'OFFLINE');
    } catch (e) {
      setShizukuState('OFFLINE');
    }
  };

  const forceConnect = async () => {
    try { 
      // Force Capacitor to trigger the native permission prompt
      await ShizukuRunner.forceShizukuLink(); 
      setTimeout(checkEngineStatus, 1500); 
    } catch (e) {
      console.warn("Failed native request.");
    }
  };

  const allTools = [
    { id: 'worldclock', icon: '⏱️', label: 'Chronos Hub', desc: 'Stopwatch, Timer, Alarms', isExpert: false },
    { id: 'calendar', icon: '📅', label: 'Calendar Grid', desc: 'Offline Scheduling', isExpert: false },
    { id: 'recorder', icon: '🎙️', label: 'Stealth Recorder', desc: 'Voice Capture Archive', isExpert: false },
    { id: 'netsec', icon: '⚡', label: 'NetSec & SysOps', isExpert: true, desc: 'Network scanners & diagnostics', isExpert: true },
    { id: 'debloat', icon: '☣️', label: 'Target Eradication', isExpert: true, desc: 'Remove bloatware & hidden apps', isExpert: true },
    { id: 'shred', icon: '☢️', label: 'Data Shredder', isExpert: true, desc: 'Permanently erase sensitive files', isExpert: true },
    { id: 'fileviewer', icon: '📁', label: 'Universal Explorer', desc: 'Raw Filesystem Navigator', isExpert: false },
    { id: 'audio', icon: '🎧', label: 'Sovereign Audio', desc: 'Local Background Player', isExpert: false },
    { id: 'gallery', icon: '🖼️', label: 'Secure Gallery', desc: 'Encrypted Media Viewer', isExpert: false },
    { id: 'comms', icon: '📡', label: 'Comm Link', isExpert: true, desc: 'Secure offline chat', isExpert: false },
    { id: 'aes', icon: '🔐', label: 'AES Cipher', desc: 'Military-Grade Text Crypto', isExpert: false },
    { id: 'camera', icon: '📸', label: 'Sovereign Camera', desc: 'Stealth Capture Engine', isExpert: false },
    { id: 'docs', icon: '📝', label: 'Encrypted Docs', desc: 'Local Markdown Vault', isExpert: false },
    { id: 'vault', icon: '🏦', label: 'Secure Vault', desc: 'Zero-Knowledge Storage', isExpert: false },
    { id: 'ai', icon: '🧠', label: 'Smart AI', desc: 'Local Intelligence Node', isExpert: false },
    { id: 'calc', icon: '🧮', label: 'Stealth Calc', desc: 'Decoy Interface Masking', isExpert: false }
  ];



  return (
    <div className="p-4 pt-6 space-y-6 max-w-2xl mx-auto select-none animate-fadeIn pb-32">

        {/* Sovereign Mesh Permanent Opt-In */}
        {!meshOptIn ? (
            <div className="mb-6 border-l-4 border-orange-500 bg-orange-950/20 p-4 rounded-r-xl shadow-lg shrink-0 mt-2 mx-4">
                <h3 className="text-[11px] font-black text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    ⚠️ Sovereign Mesh Participation
                </h3>
                <p className="text-[10px] text-orange-200/70 mb-3 leading-relaxed font-sans">
                    By opting in, you authorize this device to permanently participate in the localized darknet. This allows you to host or join encrypted WebRTC tunnels without external infrastructure.
                    <br/><br/><strong className="text-orange-400">WARNING:</strong> This is a one-way, permanent execution.
                </p>
                <button 
                    onClick={() => { localStorage.setItem('sovereign_mesh_node', 'true'); setMeshOptIn(true); }} 
                    className="w-full bg-orange-900/60 border border-orange-500/50 text-orange-400 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-orange-500 hover:text-black transition-all active:scale-95 shadow-inner">
                    UNDERSTOOD: PERMANENTLY OPT-IN
                </button>
            </div>
        ) : (
            <div className="mb-6 mx-4 mt-2 flex items-center justify-between border border-emerald-900/50 bg-emerald-950/20 p-3 rounded-xl shadow-inner shrink-0">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <div>
                        <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Sovereign Node Active</h3>
                        <p className="text-[9px] text-emerald-200/60 uppercase font-sans">Permanent Mesh Opt-In Confirmed</p>
                    </div>
                </div>
                <span className="text-[9px] text-emerald-900 font-black px-2 py-1 bg-emerald-400 rounded">LOCKED</span>
            </div>
        )}

      {currentMode !== 'BASIC' && (
        <div className={`p-4 rounded-3xl flex justify-between items-center shadow-xl mb-6 border ${shizukuState === 'CONNECTED' ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-red-950/30 border-red-900/50'}`}>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2"><span>⚙️</span> Shizuku Core Engine</h4>
            <p className="text-[9px] font-mono text-zinc-400 mt-1">Master Link for Root Modules</p>
          </div>
          {shizukuState === 'CONNECTED' ? (
            <span className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow">ESTABLISHED</span>
          ) : (
            <button onClick={forceConnect} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 shadow">FORCE LINK</button>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
	{allTools.filter(tool => currentMode === 'EXPERT' || !tool.isExpert).map(tool => (
          <button key={tool.id} onClick={() => onNavigate(tool.id)} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-3xl flex flex-col items-start gap-2 active:scale-95 transition-transform hover:border-[var(--accent-text)] shadow-lg text-left relative overflow-hidden">
            <span className="text-3xl mb-1 relative z-10">{tool.icon}</span>
            <div className="relative z-10">
              <span className="text-[11px] font-bold text-white block">{tool.label}</span>
              <span className="text-[9px] font-mono text-zinc-500 block leading-tight mt-0.5">{tool.desc}</span>
            </div>
            {tool.isExpert && (
               <div className={`absolute top-0 right-0 w-8 h-8 rounded-bl-3xl flex items-start justify-end p-2 ${shizukuState === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                  <span className="text-[8px] font-black">R</span>
               </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
