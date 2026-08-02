import React from 'react';

export function Home({ onNavigate, appMode }) {
  const allTools = [
    { id: 'clock', icon: '⏰', title: 'Clock', desc: 'Timer & Alarms', reqExpert: false },
    { id: 'camera', icon: '📷', title: 'Camera', desc: 'EXIF-Free & QR', reqExpert: false },
    { id: 'gallery', icon: '🖼️', title: 'Gallery', desc: 'Albums & Video', reqExpert: false },
    { id: 'vault', icon: '🔐', title: 'Vault', desc: 'AES-256 Storage', reqExpert: false },
    { id: 'audio', icon: '🎧', title: 'Audio', desc: 'Offline Player', reqExpert: false },
    { id: 'docs', icon: '📝', title: 'Docs', desc: 'Encrypted Notes', reqExpert: false },
    { id: 'calc', icon: '🧮', title: 'Calc', desc: 'Multi-Calculator', reqExpert: false },
    { id: 'calendar', icon: '📅', title: 'Calendar', desc: 'Zero Telemetry', reqExpert: false },
    { id: 'fileviewer', icon: '📂', title: 'Files', desc: 'Universal Viewer', reqExpert: false },
    { id: 'ai', icon: '🤖', title: 'AI Engine', desc: 'Smart Local AI', reqExpert: true },
    { id: 'shred', icon: '☣️', title: 'Shredder', desc: 'Sector Zero-Fill', reqExpert: true },
    { id: 'debloat', icon: '⚡', title: 'Debloat', desc: 'Risk Inspector', reqExpert: true },
    { id: 'comms', icon: '📡', title: 'Comms', desc: 'PGP & P2P', reqExpert: true },
    { id: 'aes', icon: '🛡️', title: 'Cipher', desc: 'AES-GCM 256', reqExpert: true },
    { id: 'netsec', icon: '🌐', title: 'NetSec', desc: 'Network Audits', reqExpert: true }
  ];

  // Filter tools based on whether the app is in EASY or EXPERT mode
  const displayedTools = appMode === 'EXPERT' ? allTools : allTools.filter(t => !t.reqExpert);

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen flex flex-col">
      
      {/* Header Splash */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col items-center text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-full theme-accent-bg flex items-center justify-center shadow-lg">
          <span className="text-2xl text-black">🛡️</span>
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-widest text-white">SOVEREIGN TOOLS</h2>
          <p className="text-xs font-bold theme-accent-text uppercase tracking-widest mt-2 mb-3 px-6">
            "Privacy is sovereignty. Absolute local control."
          </p>
          <p className="text-xs text-zinc-400 max-w-sm px-4">
            A 100% offline-first privacy utility suite designed to replace surveillance-heavy stock phone apps.
          </p>
        </div>
      </div>

      {/* Grid Header */}
      <div className="flex items-center gap-2 px-2 shrink-0">
        <span className="text-amber-500 font-black">⚡</span>
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
          MASTER SUITE QUICK LAUNCH ({displayedTools.length})
        </h3>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-3 pb-8">
        {displayedTools.map(tool => (
          <button 
            key={tool.id} 
            onClick={() => onNavigate(tool.id)} 
            className="bg-zinc-950 border border-zinc-900 hover:border-zinc-700 p-4 rounded-3xl flex items-center text-left transition-all active:scale-95 shadow-md gap-3"
          >
            <span className="text-3xl shrink-0 drop-shadow-md">{tool.icon}</span>
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold text-white truncate">{tool.title}</span>
              <span className="text-[10px] theme-accent-text font-mono truncate">{tool.desc}</span>
            </div>
          </button>
        ))}
      </div>

    </div>
  );
}
