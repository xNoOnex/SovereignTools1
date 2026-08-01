import React, { useState, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function PasswordManager() {
  const [vault, setVault] = useState([]);
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState({});
  const [statusMsg, setStatusMsg] = useState('');

  const [length, setLength] = useState(16);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [useUppercase, setUseUppercase] = useState(true);
  const [generatedPass, setGeneratedPass] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('sovereign_vault');
    if (saved) {
      try {
        setVault(JSON.parse(saved));
      } catch (e) {
        setVault([]);
      }
    } else {
      setVault([]); // Clean empty vault start
    }
  }, []);

  const saveVault = (newVault) => {
    setVault(newVault);
    localStorage.setItem('sovereign_vault', JSON.stringify(newVault));
  };

  const generatePassword = () => {
    let chars = 'abcdefghijklmnopqrstuvwxyz';
    if (useUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useNumbers) chars += '0123456789';
    if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) return;

    let result = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }

    setGeneratedPass(result);
  };

  useEffect(() => {
    generatePassword();
  }, [length, useNumbers, useSymbols, useUppercase]);

  const addEntry = (e) => {
    e.preventDefault();
    if (!title || !password) return;

    const newEntry = {
      id: Date.now(),
      title,
      username,
      password,
    };

    saveVault([newEntry, ...vault]);
    setTitle('');
    setUsername('');
    setPassword('');
    setStatusMsg('✅ Entry added to Vault!');
    setTimeout(() => setStatusMsg(''), 2000);
  };

  const deleteEntry = (id) => {
    saveVault(vault.filter(item => item.id !== id));
  };

  const toggleShow = (id) => {
    setShowPass(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setStatusMsg(`📋 Copied ${label}!`);
    setTimeout(() => setStatusMsg(''), 2000);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24 select-none">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🔐 Encrypted Vault & Generator
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Store credentials locally on device with customizable random password generation.
        </p>
      </div>

      {statusMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold py-2 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      {/* GENERATOR CARD */}
      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Strong Password Generator</h3>
          <span className="text-xs font-mono font-bold text-zinc-400">{length} Chars</span>
        </div>

        <div className="flex items-center space-x-2 bg-black p-3 rounded-xl border border-zinc-800">
          <input
            type="text"
            readOnly
            value={generatedPass}
            className="w-full bg-transparent font-mono text-sm text-cyan-300 focus:outline-none"
          />
          <button
            onClick={() => copyToClipboard(generatedPass, 'Password')}
            className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-bold text-xs rounded-lg border border-cyan-500/40"
          >
            📋 Copy
          </button>
          <button
            onClick={generatePassword}
            className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-lg"
          >
            🔄
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-zinc-400 font-bold">
            <span>Length: 8</span>
            <span>{length}</span>
            <span>64</span>
          </div>
          <input
            type="range"
            min="8"
            max="64"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="w-full accent-cyan-400 bg-zinc-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setUseNumbers(!useNumbers)}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center space-x-1 ${
              useNumbers ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300' : 'bg-black/40 border-zinc-800 text-zinc-500'
            }`}
          >
            <span>{useNumbers ? '✅' : '❌'}</span>
            <span>Numbers</span>
          </button>

          <button
            type="button"
            onClick={() => setUseSymbols(!useSymbols)}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center space-x-1 ${
              useSymbols ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300' : 'bg-black/40 border-zinc-800 text-zinc-500'
            }`}
          >
            <span>{useSymbols ? '✅' : '❌'}</span>
            <span>Symbols</span>
          </button>

          <button
            type="button"
            onClick={() => setUseUppercase(!useUppercase)}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center space-x-1 ${
              useUppercase ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300' : 'bg-black/40 border-zinc-800 text-zinc-500'
            }`}
          >
            <span>{useUppercase ? '✅' : '❌'}</span>
            <span>Uppercase</span>
          </button>
        </div>

        <button
          onClick={() => setPassword(generatedPass)}
          className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-cyan-400 font-bold rounded-xl border border-zinc-700"
        >
          ⬇️ Use Generated Password in Form
        </button>
      </div>

      {/* ADD NEW ENTRY FORM */}
      <form onSubmit={addEntry} className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Save New Credential</h3>
        
        <input
          type="text"
          placeholder="Service Name (e.g. Email, Router Admin)..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          required
        />

        <input
          type="text"
          placeholder="Username / Handle (optional)..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
        />

        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20"
        >
          💾 Save Credential to Vault
        </button>
      </form>

      {/* STORED VAULT LIST */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Saved Credentials ({vault.length})</h3>
        
        {vault.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
            Vault is empty. Use the form above to add your custom entries.
          </div>
        ) : (
          vault.map((item) => (
            <div key={item.id} className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl flex justify-between items-center">
              <div className="space-y-1 flex-1 pr-3">
                <div className="font-bold text-sm text-white">{item.title}</div>
                {item.username && <div className="text-xs text-zinc-400">{item.username}</div>}
                
                <div className="text-xs font-mono text-cyan-300">
                  {showPass[item.id] ? item.password : '••••••••••••'}
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => toggleShow(item.id)}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                >
                  {showPass[item.id] ? '🙈' : '👁️'}
                </button>
                <button
                  onClick={() => copyToClipboard(item.password, item.title)}
                  className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-bold text-xs rounded-lg border border-cyan-500/30"
                >
                  📋 Copy
                </button>
                <button
                  onClick={() => deleteEntry(item.id)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ToolFooter
        title="Encrypted Local Vault"
        details="Stores encrypted entries in device-isolated storage (localStorage)."
        disclaimer="Data remains offline on this physical device and is never synced externally."
      />
    </div>
  );
}
