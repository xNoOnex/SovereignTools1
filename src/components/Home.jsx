import React from 'react';

export function Home({ onNavigate, appMode }) {
  const tools = [
    { id: 'worldclock', icon: '🌍', label: 'World Clock', desc: 'Local & Global TimeTracker' },
    { id: 'calendar', icon: '📅', label: 'Calendar & Alarms', desc: 'Offline Scheduling & Agenda' },
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
    <div className="p-4 pt-6 space-y-6 max-w-2xl mx-auto select-none animate-fadeIn">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tools.map(tool => (
          <button 
            key={tool.id} 
            onClick={() => onNavigate(tool.id)} 
            className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-3xl flex flex-col items-start gap-2 active:scale-95 transition-transform hover:border-[var(--accent-text)] shadow-lg text-left"
          >
            <span className="text-3xl mb-1">{tool.icon}</span>
            <div>
              <span className="text-[11px] font-bold text-white block">{tool.label}</span>
              <span className="text-[9px] font-mono text-zinc-500 block leading-tight mt-0.5">{tool.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
