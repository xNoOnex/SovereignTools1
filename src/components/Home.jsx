import React from 'react';

export function Home({ onNavigate }) {
  const quickLaunchItems = [
    { id: 'camera', label: 'Camera', sub: 'EXIF-Free & QR', icon: '📷' },
    { id: 'browser', label: 'Browser', sub: 'Zero Telemetry', icon: '🌐' },
    { id: 'gallery', label: 'Gallery', sub: 'Albums & Video', icon: '🖼️' },
    { id: 'vault', label: 'Vault', sub: 'AES-256 Storage', icon: '🔐' },
    { id: 'audio', label: 'Audio', sub: 'Offline Player', icon: '🎧' },
    { id: 'shred', label: 'Shredder', sub: 'Sector Zero-Fill', icon: '☣️' }
  ];

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans bg-black min-h-screen text-white">
      {/* APP HEADER */}
      <div className="flex justify-between items-center pt-2 pb-3 border-b border-zinc-900">
        <div>
          <h1 className="text-xl font-black tracking-wider text-white">SOVEREIGN TOOLS</h1>
          <span className="text-[9px] font-bold text-cyan-400 tracking-widest uppercase">EXPERT MODE</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onNavigate && onNavigate('support')} 
            className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all"
          >
            ⚙️ Settings
          </button>
          <button className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all">
            🔒 Lock
          </button>
        </div>
      </div>

      {/* CENTRAL HERO CARD */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 text-center space-y-3 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 bg-zinc-950 border border-cyan-500/40 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-inner shadow-cyan-500/10">
          🛡️
        </div>

        <h2 className="text-2xl font-black tracking-wide text-white">SOVEREIGN TOOLS</h2>
        
        <p className="text-xs font-bold text-cyan-400 tracking-wider font-mono">
          "PRIVACY IS SOVEREIGNTY. ABSOLUTE LOCAL CONTROL."
        </p>

        <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
          A 100% offline-first, tracker-free privacy utility suite designed to replace surveillance-heavy stock phone apps. Operates entirely on-device with zero telemetry.
        </p>
      </div>

      {/* QUICK LAUNCH GRID */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
          <span className="text-amber-400">⚡</span> MASTER SUITE QUICK LAUNCH
        </div>

        <div className="grid grid-cols-2 gap-3">
          {quickLaunchItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate && onNavigate(item.id)}
              className="bg-zinc-900/90 border border-zinc-800 hover:border-cyan-500/50 p-4 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-95 group shadow-lg"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-white block truncate">{item.label}</span>
                <span className="text-[9px] font-mono text-cyan-400 truncate block mt-0.5">{item.sub}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
