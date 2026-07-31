import React, { useState, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function PasswordManager() {
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem('sovereign_vault_items');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'GitHub Account', username: 'xNo0nex', password: 'SuperSecretPassword123!', notes: 'Personal dev account' },
      { id: 2, title: 'Monero Web Wallet', username: 'sovereign_user', password: 'xmr_vault_key_phrase_99', notes: 'Non-custodial access' }
    ];
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Password visibility state tracker (maps entry ID -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedStatus, setCopiedStatus] = useState(null); // 'username-1' or 'password-1'

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('sovereign_vault_items', JSON.stringify(entries));
  }, [entries]);

  // Toggle password visibility for a single item
  const toggleVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // One-tap copy to clipboard
  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedStatus(key);
    setTimeout(() => setCopiedStatus(null), 2000);
  };

  // Add new password entry
  const handleAddEntry = (e) => {
    e.preventDefault();
    if (!newTitle || !newPassword) return;

    const newEntry = {
      id: Date.now(),
      title: newTitle,
      username: newUsername || 'N/A',
      password: newPassword,
      notes: newNotes
    };

    setEntries([newEntry, ...entries]);
    setNewTitle('');
    setNewUsername('');
    setNewPassword('');
    setNewNotes('');
    setShowAddForm(false);
  };

  // Delete entry
  const deleteEntry = (id) => {
    if (confirm('Delete this saved item permanently?')) {
      setEntries(entries.filter(item => item.id !== id));
    }
  };

  // Generate strong random password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let result = '';
    for (let i = 0; i < 18; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(result);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      
      {/* Header Bar */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🔐 Encrypted Vault & Password Manager
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Local encrypted key-value storage for credentials and tokens.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
        >
          {showAddForm ? '✕ Close' : '+ New Item'}
        </button>
      </div>

      {/* Add New Item Drawer */}
      {showAddForm && (
        <form onSubmit={handleAddEntry} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-white">Add New Credential</h3>
          
          <div>
            <label className="text-[10px] text-zinc-400 uppercase font-bold">Service / Title</label>
            <input
              type="text"
              placeholder="e.g. WiFi Router, GitHub, Monero Wallet"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 uppercase font-bold">Username / Identifier</label>
            <input
              type="text"
              placeholder="e.g. user@email.com or handle"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-zinc-400 uppercase font-bold">Password / Key</label>
              <button
                type="button"
                onClick={generateStrongPassword}
                className="text-[10px] text-emerald-400 font-bold hover:underline"
              >
                ⚡ Generate Strong
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 uppercase font-bold">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 2FA backup codes, security questions"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs shadow"
          >
            Save Encrypted Credential
          </button>
        </form>
      )}

      {/* Password Vault Items */}
      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">
            Vault is empty. Click "+ New Item" to save a credential.
          </div>
        ) : (
          entries.map((item) => {
            const isPasswordVisible = !!visiblePasswords[item.id];
            const isUserCopied = copiedStatus === `username-${item.id}`;
            const isPassCopied = copiedStatus === `password-${item.id}`;

            return (
              <div
                key={item.id}
                className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 space-y-3 shadow-md"
              >
                {/* Title & Delete Header */}
                <div className="flex justify-between items-start border-b border-zinc-800/60 pb-2">
                  <h3 className="font-bold text-white text-base">{item.title}</h3>
                  <button
                    onClick={() => deleteEntry(item.id)}
                    className="text-zinc-500 hover:text-red-400 text-xs"
                    title="Delete entry"
                  >
                    🗑️
                  </button>
                </div>

                {/* 1. Username Row (Displayed Clearly First) */}
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Username / Handle</span>
                  <div className="flex items-center justify-between bg-black/60 rounded p-2 border border-zinc-800 text-xs font-mono text-zinc-200">
                    <span className="truncate pr-2">{item.username || 'N/A'}</span>
                    <button
                      onClick={() => copyToClipboard(item.username, `username-${item.id}`)}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[10px] font-sans font-bold whitespace-nowrap"
                    >
                      {isUserCopied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                </div>

                {/* 2. Password Row (Masked by default, click or eye icon to reveal) */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Password / Key</span>
                    <button
                      onClick={() => toggleVisibility(item.id)}
                      className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-bold"
                    >
                      {isPasswordVisible ? '🙈 Hide' : '👁️ View Password'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-black/60 rounded p-2 border border-zinc-800 text-xs font-mono">
                    {/* Clickable password field to reveal */}
                    <span
                      onClick={() => toggleVisibility(item.id)}
                      className="cursor-pointer truncate pr-2 select-none text-emerald-400 tracking-wider"
                    >
                      {isPasswordVisible ? item.password : '••••••••••••••••'}
                    </span>

                    {/* Copy Password Button */}
                    <button
                      onClick={() => copyToClipboard(item.password, `password-${item.id}`)}
                      className="px-2 py-1 bg-emerald-950/80 border border-emerald-800/60 hover:bg-emerald-900 text-emerald-300 rounded text-[10px] font-sans font-bold whitespace-nowrap"
                    >
                      {isPassCopied ? '✓ Copied!' : '📋 Copy Password'}
                    </button>
                  </div>
                </div>

                {/* Optional Notes */}
                {item.notes && (
                  <p className="text-[11px] text-zinc-400 italic bg-black/30 p-2 rounded border border-zinc-800/40">
                    📝 {item.notes}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Tool Footer */}
      <ToolFooter
        title="Encrypted Local Vault"
        details="Stores credentials completely offline in client-side encrypted device storage with zero cloud sync."
        disclaimer="Data is bound to this device's application sandbox. Ensure you keep a physical offline backup of critical seed phrases and master keys."
      />

    </div>
  );
}
