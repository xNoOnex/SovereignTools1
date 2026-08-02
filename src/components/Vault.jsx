import React from 'react';

export function Vault({ onNavigate }) {
  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen text-white bg-black select-none font-sans">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center space-y-3">
        <span className="text-4xl">🚧</span>
        <h2 className="text-lg font-bold text-white tracking-widest uppercase">Vault</h2>
        <p className="text-zinc-500 text-xs font-mono">Module framework initialized. Awaiting cryptographic code injection.</p>
      </div>
    </div>
  );
}
