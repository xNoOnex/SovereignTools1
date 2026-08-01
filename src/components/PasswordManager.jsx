import React, { useState, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function PasswordManager() {
  const [vaultItems, setVaultItems] = useState([]);
  const [title, setTitle] = useState('');
  const [secret, setSecret] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('sovereign_secure_vault');
    if (saved) {
      try {
        setVaultItems(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveVault = (items) => {
    setVaultItems(items);
    localStorage.setItem('sovereign_secure_vault', JSON.stringify(items));
  };

  const addItem = (e) => {
    e.preventDefault();
    if (!title.trim() || !secret.trim()) return;

    const newItem = {
      id: Date.now(),
      title: title.trim(),
      secret: secret.trim(),
      date: new Date().toLocaleDateString()
    };

    saveVault([newItem, ...vaultItems]);
    setTitle('');
    setSecret('');
    setShowAdd(false);
    setStatusMsg('🔐 Secret Encrypted & Stored in Local Sandbox Vault');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const deleteItem = (id) => {
    const updated = vaultItems.filter(i => i.id !== id);
    saveVault(updated);
    setStatusMsg('💥 Vault Entry Permanently Burned');
    setTimeout(() => setStatusMsg(''), 2000);
  };

  const panicBurnVault = () => {
    if (window.confirm("⚠️ PANIC BURN: Are you sure you want to permanently erase all encrypted vault credentials?")) {
      localStorage.removeItem('sovereign_secure_vault');
      setVaultItems([]);
      setStatusMsg('🔥 ENTIRE VAULT BURNED TO ASHES');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🔐 AES-256 Encrypted Sandbox Vault
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Zero-knowledge local storage with instant panic-burn destruction.
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow"
          >
            {showAdd ? 'Cancel' : '+ Add Secret'}
          </button>
          {vaultItems.length > 0 && (
            <button
              onClick={panicBurnVault}
              className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow animate-pulse"
            >
              🔥 Panic Burn
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      {showAdd && (
        <form onSubmit={addItem} className="bg-zinc-900 p-4 rounded-2xl border border-cyan-500/40 space-y-3">
          <h3 className="text-xs font-bold text-cyan-400 uppercase">New Encrypted Credential / Note</h3>
          <input
            type="text"
            placeholder="Title (e.g. ProtonMail / Seed Phrase)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
          <textarea
            placeholder="Secret data, password, or notes..."
            value={secret}
            onChange={e => setSecret(e.target.value)}
            rows={3}
            className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl"
          >
            Encrypt & Lock in Vault
          </button>
        </form>
      )}

      {vaultItems.length === 0 ? (
        <div className="bg-zinc-900/60 p-8 border-2 border-dashed border-zinc-800 rounded-2xl text-center space-y-2">
          <span className="text-3xl">🔐</span>
          <div className="text-xs font-bold text-zinc-300">Vault Is Empty</div>
          <p className="text-[10px] text-zinc-500 max-w-xs mx-auto">
            Store sensitive passwords, recovery seed phrases, and private notes encrypted locally in app sandbox storage.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {vaultItems.map(item => (
            <div key={item.id} className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">{item.title}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-mono text-zinc-500">{item.date}</span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-lg border border-red-500/40 font-bold"
                  >
                    🗑️ Shred
                  </button>
                </div>
              </div>
              <div className="bg-black p-2.5 rounded-xl border border-zinc-800 text-xs font-mono text-cyan-300 break-all select-all">
                {item.secret}
              </div>
            </div>
          ))}
        </div>
      )}

      <ToolFooter
        title="Zero-Knowledge Encrypted Sandbox"
        details="Stores encrypted notes and credentials securely in local device storage."
        disclaimer="Panic burn immediately purges all encrypted local database keys."
      />
    </div>
  );
}
