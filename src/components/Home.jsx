import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';

const ShizukuRunner = registerPlugin('ShizukuRunner');

export function Home({ onNavigate, appMode }) {
  const [shizukuState, setShizukuState] = useState('CHECKING');

  useEffect(() => {
    checkEngineStatus();
  }, []);

  const checkEngineStatus = async () => {
    try {
      const res = await ShizukuRunner.checkStatus();
      // Ensure BOTH the OS permission is granted and the binder is actively alive
      if (res.granted && res.active) {
          setShizukuState('CONNECTED');
      } else {
          setShizukuState('OFFLINE');
      }
    } catch (e) {
      setShizukuState('OFFLINE');
    }
  };

  const forceConnect = async () => {
    try {
      await ShizukuRunner.requestPermission();
      // Wait half a second after the popup resolves before re-checking state
      setTimeout(checkEngineStatus, 500);
    } catch (e) {
      console.warn("Failed to trigger native Shizuku intent.");
    }
  };

  const tools = [
    { id: 'worldclock', icon: '⏱️', label: 'Chronos Hub', desc: 'Stopwatch, Timer, Alarms' },
    { id: 'calendar', icon: '📅', label: 'Calendar Grid', desc: 'Offline Scheduling' },
    { id: 'netsec', icon: '⚡', label: 'NetSec & SysOps', desc: 'Network Map & Root Shell' },
    { id: 'debloat', icon: '☣️', label: 'Target Eradication', desc: 'Freeze & Nuke System Bloat' },
    { id: 'shred', icon: '☢️', label: 'Data Shredder', desc: 'Zero-fill Metadata Obfuscation' },
    { id: 'fileviewer', icon: '📁', label: 'Universal Explorer', desc: 'Raw Filesystem Navigator' },
    { id: 'audio', icon: '🎧', label: 'Sovereign Audio', desc: 'Local Background Player' },
    { id: 'gallery', icon: '🖼️', label: 'Secure Gallery', desc: 'Encrypted Media Viewer' },
    { id: 'comms', icon: '📡', label: 'Comm Link', desc: 'P2P Encrypted Messaging' },
    { id: 'aes', icon: '🔐', label: 'AES Cipher', desc: 'Military-Grade Text Crypto' },
    { id: 'camera', icon: '📸', label: 'Sovereign Camera', desc: 'Stealth Capture Engine' },
    { id: 'docs', icon: '📝', label: 'Encrypted Docs', desc: 'Local Markdown Vault' },
    { id: 'vault', icon: '🏦', label: 'Secure Vault', desc: 'Zero-Knowledge Storage' },
    { id: 'ai', icon: '🧠', label: 'Smart AI', desc: 'Local Intelligence Node' },
    { id: 'calc', icon: '🧮', label: 'Stealth Calc', desc: 'Decoy Interface Masking' }
  ];

  return (
    <div className="p-4 pt-6 space-y-6 max-w-2xl mx-auto select-none animate-fadeIn pb-32">
      
      <div className={`p-4 rounded-3xl flex justify-between items-center shadow-xl mb-6 border ${shizukuState === 'CONNECTED' ? 'bg-emerald-950/30 border-emerald-900/50' : shizukuState === 'CHECKING' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-red-950/30 border-red-900/50'}`}>
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <span>⚙️</span> Shizuku Core Engine
          </h4>
          <p className="text-[9px] font-mono text-zinc-400 mt-1">Master Link for Root Modules</p>
        </div>
        
        {shizukuState === 'CONNECTED' ? (
          <span className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow">
            ESTABLISHED
          </span>
        ) : (
          <button onClick={forceConnect} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.4)]">
            FORCE LINK
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tools.map(tool => (
          <button 
            key={tool.id} 
            onClick={() => onNavigate(tool.id)} 
            className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-3xl flex flex-col items-start gap-2 active:scale-95 transition-transform hover:border-[var(--accent-text)] shadow-lg text-left relative overflow-hidden"
          >
            <span className="text-3xl mb-1 relative z-10">{tool.icon}</span>
            <div className="relative z-10">
              <span className="text-[11px] font-bold text-white block">{tool.label}</span>
              <span className="text-[9px] font-mono text-zinc-500 block leading-tight mt-0.5">{tool.desc}</span>
            </div>
            
            {['netsec', 'debloat', 'shred'].includes(tool.id) && (
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
