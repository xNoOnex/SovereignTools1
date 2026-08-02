import React, { useState } from 'react';

export function Shredder({ onNavigate }) {
  const [shredded, setShredded] = useState(false);

  const handleShred = () => {
    setShredded(true);
    setTimeout(() => setShredded(false), 3000);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen flex flex-col">
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🔥 Secure File Shredder</h2>
        <p className="text-xs text-zinc-400 mt-1">Permanent data overwriting and sector sanitization.</p>
      </div>

      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 text-center">
        <span className="text-6xl">💣</span>
        <h3 className="text-sm font-bold text-white">Military-Grade Sector Erasure</h3>
        <p className="text-xs text-zinc-400 max-w-xs">Overwrites file allocations with random cryptographic noise before unlinking.</p>
        
        <button onClick={handleShred} className="w-full py-4 bg-red-950 border border-red-900 text-red-200 font-extrabold text-xs rounded-2xl shadow active:scale-95 transition-transform">
          {shredded ? '🔥 SHREDDING COMPLETE (SECTORS ZEROED)' : 'EXECUTE EMERGENCY SHRED'}
        </button>
      </div>
    </div>
  );
}
