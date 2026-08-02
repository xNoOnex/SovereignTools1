import React from 'react';

export function Home({ onNavigate, appMode }) {
  const expertTools = [
    { id: 'ai', icon: '🤖', title: 'Sovereign AI', desc: 'Offline LLM Engine' },
    { id: 'netsec', icon: '🌐', title: 'NetSec Ops', desc: 'Traffic Analysis' },
    { id: 'aes', icon: '🔐', title: 'AES Cipher', desc: 'Cryptographic Core' },
    { id: 'comms', icon: '📡', title: 'Comms', desc: 'Mesh Relay Enclave' },
    { id: 'debloat', icon: '⚡', title: 'Debloater', desc: 'Telemetry Blocker' },
    { id: 'shred', icon: '🔥', title: 'Shredder', desc: 'Sector Erasure' },
  ];

  const standardTools = [
    { id: 'docs', icon: '📝', title: 'Secure Docs', desc: 'Encrypted Editor' },
    { id: 'fileviewer', icon: '📂', title: 'File Viewer', desc: 'Universal Parser' },
    { id: 'vault', icon: '📁', title: 'Data Vault', desc: 'Local Storage' },
    { id: 'camera', icon: '📷', title: 'Camera & QR', desc: 'Optical Scanner' },
    { id: 'gallery', icon: '🖼️', title: 'Gallery', desc: 'Media Hub' },
    { id: 'calc', icon: '🧮', title: 'Stealth Calc', desc: 'Matrix Computations' },
    { id: 'calendar', icon: '📅', title: 'Calendar', desc: 'Offline Scheduling' },
    { id: 'audio', icon: '🎵', title: 'Audio', desc: 'Secure Recorder' },
  ];

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col items-center text-center space-y-3 shadow-xl">
        <div className="w-16 h-16 rounded-full theme-accent-bg flex items-center justify-center shadow-lg">
          <span className="text-3xl text-black">🛡️</span>
        </div>
        <div>
          <h2 className="text-xl font-black tracking-widest text-white">SOVEREIGN HUB</h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">SYSTEM STATUS: <span className="text-emerald-400 font-bold">SECURE & OFFLINE</span></p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest px-2">UTILITIES & MEDIA</h3>
        <div className="grid grid-cols-2 gap-3">
          {standardTools.map(tool => (
            <button key={tool.id} onClick={() => onNavigate(tool.id)} className="bg-zinc-950 border border-zinc-900 hover:border-zinc-700 p-4 rounded-2xl flex flex-col items-start text-left transition-all active:scale-95 shadow">
              <span className="text-2xl mb-2">{tool.icon}</span>
              <span className="text-sm font-bold text-white">{tool.title}</span>
              <span className="text-[9px] text-zinc-500 font-mono mt-1">{tool.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {appMode === 'EXPERT' && (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest px-2 border-b border-red-900/30 pb-2">EXPERT PROTOCOLS ACTIVE</h3>
          <div className="grid grid-cols-2 gap-3">
            {expertTools.map(tool => (
              <button key={tool.id} onClick={() => onNavigate(tool.id)} className="bg-red-950/10 border border-red-900/30 hover:border-red-900/80 p-4 rounded-2xl flex flex-col items-start text-left transition-all active:scale-95 shadow">
                <span className="text-2xl mb-2">{tool.icon}</span>
                <span className="text-sm font-bold text-red-100">{tool.title}</span>
                <span className="text-[9px] text-red-400/60 font-mono mt-1">{tool.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
