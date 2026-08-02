import React from 'react';
import { useSettings } from '../context/SettingsContext';

export function Home({ onNavigate, onLock }) {
  const { mode, currentTheme, setIsSettingsOpen } = useSettings();

  const allLaunchItems = [
    { id: 'camera', label: 'Camera', sub: 'EXIF-Free & QR', icon: '📷', easy: true },
    { id: 'gallery', label: 'Gallery', sub: 'Albums & Video', icon: '🖼️', easy: true },
    { id: 'vault', label: 'Vault', sub: 'AES-256 Storage', icon: '🔐', easy: true },
    { id: 'audio', label: 'Audio', sub: 'Offline Player', icon: '🎧', easy: true },
    { id: 'docs', label: 'Docs', sub: 'Encrypted Notes', icon: '📝', easy: true },
    { id: 'calc', label: 'Calc', sub: 'Multi-Calculator', icon: '🧮', easy: true },
    { id: 'calendar', label: 'Calendar', sub: 'Zero Telemetry', icon: '📅', easy: true },
    { id: 'ai', label: 'AI Engine', sub: 'Smart Local AI', icon: '🤖', easy: true },
    { id: 'shred', label: 'Shredder', sub: 'Sector Zero-Fill', icon: '☣️', easy: false },
    { id: 'debloat', label: 'Debloat', sub: 'Risk Inspector', icon: '⚡', easy: false },
    { id: 'comms', label: 'Comms', icon: '📡', sub: 'PGP & P2P', easy: false },
    { id: 'aes', label: 'Cipher', icon: '🛡️', sub: 'AES-GCM 256', easy: false },
    { id: 'netsec', label: 'NetSec', icon: '🌐', sub: 'Network Audits', easy: false }
  ];

  const displayedItems = mode === 'easy' 
    ? allLaunchItems.filter(item => item.easy)
    : allLaunchItems;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans bg-black min-h-screen text-white">
      {/* HEADER */}
      <div className="flex justify-between items-center pt-2 pb-3 border-b border-zinc-900">
        <div>
          <h1 className="text-xl font-black tracking-wider text-white">SOVEREIGN TOOLS</h1>
          <span className={`text-[9px] font-bold tracking-widest uppercase ${currentTheme.text}`}>
            {mode === 'easy' ? 'EASY MODE' : 'EXPERT MODE'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSettingsOpen(true)} 
            className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all active:scale-95"
          >
            ⚙️ Settings
          </button>
          <button 
            onClick={onLock}
            className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all active:scale-95"
          >
            🔒 Lock
          </button>
        </div>
      </div>

      {/* HERO CARD */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 text-center space-y-3 shadow-2xl">
        <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-2xl mx-auto flex items-center justify-center text-3xl">
          🛡️
        </div>

        <h2 className="text-2xl font-black tracking-wide text-white">SOVEREIGN TOOLS</h2>
        
        <p className={`text-xs font-bold tracking-wider font-mono ${currentTheme.text}`}>
          "PRIVACY IS SOVEREIGNTY. ABSOLUTE LOCAL CONTROL."
        </p>

        <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
          A 100% offline-first privacy utility suite designed to replace surveillance-heavy stock phone apps.
        </p>
      </div>

      {/* QUICK LAUNCH GRID */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
          <span className="text-amber-400">⚡</span> MASTER SUITE QUICK LAUNCH ({displayedItems.length})
        </div>

        <div className="grid grid-cols-2 gap-3">
          {displayedItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate && onNavigate(item.id)}
              className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-600 p-4 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-95 shadow-lg"
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-white block truncate">{item.label}</span>
                <span className={`text-[9px] font-mono truncate block mt-0.5 ${currentTheme.text}`}>{item.sub}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
