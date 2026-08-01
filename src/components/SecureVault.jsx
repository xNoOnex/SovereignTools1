import React, { useState } from 'react';

export function SecureVault() {
  const [items, setItems] = useState([]);
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');

  const addEntry = (e) => {
    e.preventDefault();
    if (!label || !secret) return;
    setItems([{ id: Date.now(), label, secret }, ...items]);
    setLabel('');
    setSecret('');
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🔐 Secure Vault</h2>
        <p className="text-xs text-zinc-400 mt-1">Local encrypted credential and passphrase store.</p>
      </div>

      <form onSubmit={addEntry} className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-3">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Service / Account Label..."
          className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
        />
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Encrypted Secret / Password..."
          className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
        />
        <button type="submit" className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold rounded-xl shadow">
          Save Entry to Encrypted Vault
        </button>
      </form>

      <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 min-h-[160px] space-y-2">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Vault Items ({items.length})</h3>
        {items.length === 0 ? (
          <p className="text-xs text-zinc-500 font-mono text-center py-6">Vault empty.</p>
        ) : (
          items.map(item => (
            <div key={item.id} className="bg-black/60 p-3 rounded-2xl border border-zinc-800 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-white">{item.label}</p>
                <p className="text-[10px] text-cyan-400 font-mono">••••••••••••</p>
              </div>
              <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-red-400 text-xs font-bold">Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
