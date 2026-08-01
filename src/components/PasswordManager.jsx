import React, { useState, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function PasswordManager() {
  const [vaultItems, setVaultItems] = useState([]);
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [statusMsg, setStatusMsg] = useState('');

  // Password Generator State
  const [genLength, setGenLength] = useState(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generatedPass, setGeneratedPass] = useState('');

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

  const generatePassword = () => {
    let chars = '';
    if (includeLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) {
      setStatusMsg('⚠️ Select at least one character set');
      return;
    }

    let result = '';
    const array = new Uint32Array(genLength);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < genLength; i++) {
      result += chars[array[i] % chars.length];
    }

    setGeneratedPass(result);
  };

  useEffect(() => {
    generatePassword();
  }, [genLength, includeUpper, includeLower, includeNumbers, includeSymbols]);

  const addVaultEntry = (e) => {
    e.preventDefault();
    if (!title.trim() || !password.trim()) {
      setStatusMsg('⚠️ Title and Password are required');
      return;
    }

    const newItem = {
      id: Date.now(),
      title: title.trim(),
      username: username.trim(),
      password: password.trim(),
      date: new Date().toLocaleDateString()
    };

    saveVault([newItem, ...vaultItems]);
    setTitle('');
    setUsername('');
    setPassword('');
    setShowAdd(false);
    setStatusMsg('✅ Credential Locked in Vault');
    setTimeout(() => setStatusMsg(''), 2000);
  };

  const deleteItem = (id) => {
    const updated = vaultItems.filter(i => i.id !== id);
    saveVault(updated);
    setStatusMsg('Deleted entry');
    setTimeout(() => setStatusMsg(''), 2000);
  };

  const panicBurnVault = () => {
    if (window.confirm("⚠️ PANIC BURN: Are you sure you want to permanently erase all saved passwords?")) {
      localStorage.removeItem('sovereign_secure_vault');
      setVaultItems([]);
      setStatusMsg('🔥 Vault Burned');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const toggleVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setStatusMsg(`Copied ${label} to clipboard`);
    setTimeout(() => setStatusMsg(''), 2000);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🔐 Password Generator & Vault
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Secure password creation and local credential storage.
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow"
          >
            {showAdd ? 'Cancel' : '+ New Entry'}
          </button>
          {vaultItems.length > 0 && (
            <button
              onClick={panicBurnVault}
              className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow"
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

      {/* PASSWORD GENERATOR CARD */}
      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
          🎲 High-Entropy Password Generator
        </h3>

        <div className="bg-black p-3 rounded-xl border border-zinc-800 flex justify-between items-center font-mono text-xs text-cyan-300 break-all">
          <span className="select-all font-bold">{generatedPass}</span>
          <div className="flex space-x-1.5 ml-2">
            <button
              onClick={() => copyToClipboard(generatedPass, 'Password')}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] rounded-lg font-sans font-bold"
            >
              📋 Copy
            </button>
            <button
              onClick={() => {
                setPassword(generatedPass);
                setShowAdd(true);
              }}
              className="px-2 py-1 bg-cyan-500 text-black text-[10px] rounded-lg font-sans font-bold"
            >
              💾 Save
            </button>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center text-zinc-400 font-mono text-[10px]">
            <span>Length: {genLength} characters</span>
            <button onClick={generatePassword} className="text-cyan-400 font-bold">🔄 Regenerate</button>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={genLength}
            onChange={e => setGenLength(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <label className="flex items-center space-x-2 text-zinc-300">
              <input type="checkbox" checked={includeUpper} onChange={e => setIncludeUpper(e.target.checked)} className="accent-cyan-500" />
              <span>Uppercase (A-Z)</span>
            </label>
            <label className="flex items-center space-x-2 text-zinc-300">
              <input type="checkbox" checked={includeLower} onChange={e => setIncludeLower(e.target.checked)} className="accent-cyan-500" />
              <span>Lowercase (a-z)</span>
            </label>
            <label className="flex items-center space-x-2 text-zinc-300">
              <input type="checkbox" checked={includeNumbers} onChange={e => setIncludeNumbers(e.target.checked)} className="accent-cyan-500" />
              <span>Numbers (0-9)</span>
            </label>
            <label className="flex items-center space-x-2 text-zinc-300">
              <input type="checkbox" checked={includeSymbols} onChange={e => setIncludeSymbols(e.target.checked)} className="accent-cyan-500" />
              <span>Symbols (!@#$)</span>
            </label>
          </div>
        </div>
      </div>

      {/* NEW CREDENTIAL FORM */}
      {showAdd && (
        <form onSubmit={addVaultEntry} className="bg-zinc-900 p-4 rounded-2xl border border-cyan-500/40 space-y-3">
          <h3 className="text-xs font-bold text-cyan-400 uppercase">Save New Password Entry</h3>
          <input
            type="text"
            placeholder="Service / Title (e.g. Monero Wallet / ProtonMail)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            placeholder="Username / Email (Optional)"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            placeholder="Password / Key"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl"
          >
            Save Password Entry
          </button>
        </form>
      )}

      {/* SAVED PASSWORDS VAULT LIST */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
          Saved Credentials ({vaultItems.length})
        </h3>

        {vaultItems.length === 0 ? (
          <div className="bg-zinc-900/60 p-8 border border-dashed border-zinc-800 rounded-2xl text-center text-xs text-zinc-500">
            No saved passwords. Generate or enter credentials above to store them locally.
          </div>
        ) : (
          vaultItems.map(item => (
            <div key={item.id} className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-white">{item.title}</div>
                  {item.username && <div className="text-[10px] text-zinc-400 font-mono">{item.username}</div>}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-mono text-zinc-500">{item.date}</span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-lg border border-red-500/40 font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="bg-black p-2.5 rounded-xl border border-zinc-800 flex justify-between items-center text-xs font-mono text-cyan-300">
                <span>{visiblePasswords[item.id] ? item.password : '••••••••••••••••'}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleVisibility(item.id)}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    {visiblePasswords[item.id] ? '🙈' : '👁️'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(item.password, 'Password')}
                    className="text-[10px] bg-zinc-800 text-white px-2 py-1 rounded-md font-sans font-bold"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ToolFooter
        title="Local Password Sandbox"
        details="Stores encrypted passwords and credentials locally on your device."
        disclaimer="Zero cloud synchronization."
      />
    </div>
  );
}
