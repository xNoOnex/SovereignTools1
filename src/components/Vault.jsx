import React, { useState } from 'react';
import CryptoJS from 'crypto-js';

export function Vault({ onNavigate }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPass, setMasterPass] = useState('');
  const [entries, setEntries] = useState([]);
  
  // Entry Form
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Generator Options
  const [genLength, setGenLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNums, setUseNums] = useState(true);
  const [useSyms, setUseSyms] = useState(true);
  const [generatedPass, setGeneratedPass] = useState('');

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!masterPass.trim()) return;

    const savedVault = localStorage.getItem('sovereign_pass_vault');
    if (!savedVault) {
      setIsUnlocked(true);
      return;
    }

    try {
      const bytes = CryptoJS.AES.decrypt(savedVault, masterPass);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) throw new Error('Bad password');
      
      setEntries(JSON.parse(decrypted));
      setIsUnlocked(true);
    } catch (err) {
      alert("❌ Decryption Failed: Invalid Master Password");
      setMasterPass('');
    }
  };

  const lockVault = () => {
    setIsUnlocked(false);
    setMasterPass('');
    setEntries([]);
  };

  const saveVault = (updatedEntries) => {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(updatedEntries), masterPass).toString();
    localStorage.setItem('sovereign_pass_vault', encrypted);
    setEntries(updatedEntries);
  };

  const addEntry = () => {
    if (!title || !password) return alert("Title and Password are required.");
    const newEntry = { id: Date.now(), title, username, password };
    saveVault([newEntry, ...entries]);
    setTitle(''); setUsername(''); setPassword(''); setGeneratedPass('');
  };

  const deleteEntry = (id) => {
    saveVault(entries.filter(e => e.id !== id));
  };

  const generatePassword = () => {
    let charset = "";
    if (useUpper) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (useLower) charset += "abcdefghijklmnopqrstuvwxyz";
    if (useNums) charset += "0123456789";
    if (useSyms) charset += "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    
    if (!charset) return alert("Select at least one character type.");

    let pass = "";
    const randomValues = new Uint32Array(genLength);
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < genLength; i++) {
      pass += charset[randomValues[i] % charset.length];
    }
    setGeneratedPass(pass);
    setPassword(pass); // Auto-fill the Manager form below
  };

  const copyToClipboard = (text) => navigator.clipboard.writeText(text);

  if (!isUnlocked) {
    return (
      <div className="p-4 space-y-4 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh] select-none font-sans text-white">
        <div className="text-center space-y-4 w-full">
          <span className="text-6xl drop-shadow-lg block mb-6">🔐</span>
          <h2 className="text-xl font-bold tracking-widest uppercase">AES-256 Vault</h2>
          <p className="text-xs text-zinc-400 font-mono max-w-xs mx-auto">
            All credentials are encrypted locally. There is no password recovery.
          </p>
          
          <form onSubmit={handleUnlock} className="space-y-4 pt-4">
            <input type="password" value={masterPass} onChange={(e) => setMasterPass(e.target.value)} placeholder="Enter Master Password..." className="w-full bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-center text-white font-mono focus:outline-none shadow-inner" />
            <button type="submit" className="w-full py-4 theme-accent-bg text-black font-extrabold text-xs tracking-widest uppercase rounded-2xl shadow active:scale-95 transition-transform">
              Decrypt & Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen flex flex-col animate-fadeIn">
      
      <div className="flex justify-between items-center border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">🔐 Password Vault</h2>
          <p className="text-xs text-zinc-400 mt-1">AES-256 encrypted credential manager.</p>
        </div>
        <button onClick={lockVault} className="bg-red-950/40 border border-red-900 text-red-400 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-transform">Lock</button>
      </div>

      {/* GENERATOR STACKED ON TOP */}
      <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-3xl flex flex-col space-y-4 shadow-xl shrink-0">
        <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest px-1">⚡ ENTROPY GENERATOR</h3>
        
        <div className="w-full bg-black/60 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <span className={`font-mono ${generatedPass ? 'text-white' : 'text-zinc-600'} text-base break-all`}>
            {generatedPass || "Awaiting Generation..."}
          </span>
          {generatedPass && (
             <button onClick={() => copyToClipboard(generatedPass)} className="mt-2 text-[9px] uppercase tracking-widest text-zinc-400 hover:text-white border border-zinc-700 px-3 py-1 rounded-full">Copy Hash</button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-bold text-zinc-300">
          <label className="flex items-center gap-2 cursor-pointer bg-black/40 p-2 rounded-lg border border-zinc-800/50">
            <input type="checkbox" checked={useUpper} onChange={(e) => setUseUpper(e.target.checked)} className="accent-emerald-500 w-4 h-4" /> A-Z
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-black/40 p-2 rounded-lg border border-zinc-800/50">
            <input type="checkbox" checked={useLower} onChange={(e) => setUseLower(e.target.checked)} className="accent-emerald-500 w-4 h-4" /> a-z
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-black/40 p-2 rounded-lg border border-zinc-800/50">
            <input type="checkbox" checked={useNums} onChange={(e) => setUseNums(e.target.checked)} className="accent-emerald-500 w-4 h-4" /> 0-9
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-black/40 p-2 rounded-lg border border-zinc-800/50">
            <input type="checkbox" checked={useSyms} onChange={(e) => setUseSyms(e.target.checked)} className="accent-emerald-500 w-4 h-4" /> !@#$
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Length</span>
            <span className="text-[10px] font-mono theme-accent-text font-bold">{genLength} Chars</span>
          </div>
          <input type="range" min="8" max="64" value={genLength} onChange={(e) => setGenLength(e.target.value)} className="w-full accent-emerald-500 h-2 bg-black rounded-lg appearance-none cursor-pointer" />
        </div>
        
        <button onClick={generatePassword} className="w-full py-3 theme-accent-bg text-black font-extrabold text-xs uppercase tracking-widest rounded-xl shadow active:scale-95 transition-transform">
          Generate & Auto-Fill
        </button>
      </div>

      {/* MANAGER STACKED BELOW */}
      <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-3xl space-y-3 shadow-xl shrink-0">
        <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest px-1">🗃️ ADD CREDENTIAL</h3>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title / Service (e.g., ProtonMail)" className="w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white font-bold focus:outline-none" />
        <div className="flex gap-2">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username / Email" className="flex-1 bg-black/60 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none" />
          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (Auto-filled)" className="flex-1 bg-black/60 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none" />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={() => setShowPassword(!showPassword)} className="px-4 py-3 bg-zinc-800/80 text-zinc-300 rounded-xl text-xs font-bold border border-zinc-700">👁️</button>
          <button onClick={addEntry} className="flex-1 theme-accent-bg text-black font-extrabold text-xs rounded-xl shadow active:scale-95 transition-transform">Encrypt & Save</button>
        </div>
      </div>

      {/* SAVED ENTRIES */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="text-center text-zinc-500 font-mono text-xs py-10 bg-black/30 rounded-3xl border border-zinc-900/50">Vault is empty.</div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="bg-zinc-950/80 backdrop-blur border border-zinc-800 p-4 rounded-2xl flex flex-col space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="font-bold text-sm text-white">{entry.title}</span>
                <button onClick={() => deleteEntry(entry.id)} className="text-red-500 font-bold text-xs bg-red-950/30 px-2 py-1 rounded">Delete</button>
              </div>
              <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-2 items-center text-xs font-mono">
                <span className="text-zinc-500 text-[10px]">USER:</span>
                <span className="text-zinc-300 truncate">{entry.username || 'N/A'}</span>
                <button onClick={() => copyToClipboard(entry.username)} className="bg-zinc-800/80 px-3 py-1.5 rounded-lg text-zinc-300 active:bg-zinc-700">Copy</button>
                
                <span className="text-zinc-500 text-[10px]">PASS:</span>
                <span className="text-zinc-300 truncate">{showPassword ? entry.password : '••••••••••••'}</span>
                <button onClick={() => copyToClipboard(entry.password)} className="bg-zinc-800/80 px-3 py-1.5 rounded-lg text-zinc-300 active:bg-zinc-700">Copy</button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
