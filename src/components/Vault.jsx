import React, { useState } from 'react';
import CryptoJS from 'crypto-js';

export function Vault({ onNavigate }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPass, setMasterPass] = useState('');
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [genLength, setGenLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNums, setUseNums] = useState(true);
  const [useSyms, setUseSyms] = useState(true);
  const [generatedPass, setGeneratedPass] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!masterPass.trim()) return;
    const savedVault = localStorage.getItem('sovereign_pass_vault');
    if (!savedVault) { setIsUnlocked(true); return; }
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

  const lockVault = () => { setIsUnlocked(false); setMasterPass(''); setEntries([]); setVisiblePasswords({}); };

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

  const deleteEntry = (id) => saveVault(entries.filter(e => e.id !== id));

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
    for (let i = 0; i < genLength; i++) { pass += charset[randomValues[i] % charset.length]; }
    setGeneratedPass(pass);
    setPassword(pass);
  };

  const copyToClipboard = (text) => navigator.clipboard.writeText(text);
  const toggleEntryVisibility = (id) => setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));

  const Checkbox = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-3 cursor-pointer bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-colors shadow-inner">
      <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${checked ? 'theme-accent-bg text-black shadow-md' : 'bg-black border border-zinc-700'}`}>
        {checked && <span className="text-[12px] font-black">✔</span>}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="hidden" />
      <span className="font-bold text-sm text-zinc-200">{label}</span>
    </label>
  );

  if (!isUnlocked) {
    return (
      <div className="p-4 space-y-4 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh] select-none font-sans text-white relative z-10">
        <div className="text-center space-y-4 w-full">
          <span className="text-6xl drop-shadow-lg block mb-6">🔐</span>
          <h2 className="text-xl font-bold tracking-widest uppercase">AES-256 Vault</h2>
          <p className="text-xs text-zinc-400 font-mono max-w-xs mx-auto">All credentials are encrypted locally. There is no password recovery.</p>
          <form onSubmit={handleUnlock} className="space-y-4 pt-4">
            <input type="password" value={masterPass} onChange={(e) => setMasterPass(e.target.value)} placeholder="Enter Master Password..." className="w-full bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-center text-white font-mono focus:outline-none shadow-inner" />
            <button type="submit" className="w-full py-4 theme-accent-bg text-black font-extrabold text-xs tracking-widest uppercase rounded-2xl shadow active:scale-95 transition-transform">Decrypt & Access</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen flex flex-col animate-fadeIn relative z-10">
      
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-2xl font-black text-white flex items-center gap-3"><span className="text-3xl">🔐</span> Password Vault</h2>
        <button onClick={lockVault} className="bg-red-950/40 border border-red-900 text-red-400 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform">Lock</button>
      </div>
      <p className="text-xs text-zinc-400 mt-[-10px]">AES-256 encrypted credential manager.</p>

      {/* GENERATOR EXACT MATCH TO 5642.JPG */}
      <div className="space-y-4 shrink-0">
        <div className="grid grid-cols-2 gap-3">
          <Checkbox label="A-Z" checked={useUpper} onChange={setUseUpper} />
          <Checkbox label="a-z" checked={useLower} onChange={setUseLower} />
          <Checkbox label="0-9" checked={useNums} onChange={setUseNums} />
          <Checkbox label="!@#$" checked={useSyms} onChange={setUseSyms} />
        </div>

        <div className="space-y-2 py-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Length</span>
            <span className="text-xs font-mono theme-accent-text font-bold tracking-widest">{genLength} Chars</span>
          </div>
          <input type="range" min="8" max="64" value={genLength} onChange={(e) => setGenLength(e.target.value)} className="w-full accent-cyan-400 h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer" />
        </div>

        <button onClick={generatePassword} className="w-full py-5 theme-accent-bg text-black font-black text-sm uppercase tracking-widest rounded-2xl shadow active:scale-95 transition-transform">
          Generate & Auto-Fill
        </button>
      </div>

      {/* ADD CREDENTIAL EXACT MATCH TO 5642.JPG */}
      <div className="bg-black border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl shrink-0">
        <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest px-1 flex items-center gap-2"><span>🗃️</span> ADD CREDENTIAL</h3>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title / Service (e.g., ProtonMail)" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-xs text-white font-bold focus:outline-none placeholder-zinc-500" />
        <div className="flex gap-3">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username / Email" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-xs text-white font-mono focus:outline-none placeholder-zinc-500" />
          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (Auto-filled)" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-xs text-white font-mono focus:outline-none placeholder-zinc-500" />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={() => setShowPassword(!showPassword)} className="px-6 py-4 bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-lg font-bold border border-zinc-800 active:scale-95 transition-all">👁️</button>
          <button onClick={addEntry} className="flex-1 theme-accent-bg text-black font-black text-sm uppercase tracking-widest rounded-xl shadow active:scale-95 transition-transform">Encrypt & Save</button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="text-center text-zinc-500 font-mono text-xs py-12 bg-zinc-900/50 rounded-3xl border border-zinc-900">Vault is empty.</div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl flex flex-col space-y-4 shadow-lg">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <span className="font-bold text-sm text-white">{entry.title}</span>
                <button onClick={() => deleteEntry(entry.id)} className="text-red-400 hover:text-red-300 font-bold text-[10px] uppercase tracking-widest bg-red-950/30 px-3 py-1.5 rounded-lg border border-red-900/30">Delete</button>
              </div>
              <div className="bg-black/50 rounded-xl p-4 space-y-3 border border-zinc-800/50">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col pr-2 overflow-hidden">
                    <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-0.5">Username</span>
                    <span className="text-zinc-300 text-xs font-mono truncate">{entry.username || 'N/A'}</span>
                  </div>
                  <button onClick={() => copyToClipboard(entry.username)} className="shrink-0 bg-zinc-800 px-4 py-2 rounded-lg text-[10px] font-bold text-white shadow">Copy</button>
                </div>
                <div className="flex justify-between items-center border-t border-zinc-900/50 pt-3">
                  <div className="flex flex-col pr-2 overflow-hidden">
                    <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-0.5">Password</span>
                    <span className="text-zinc-300 text-xs font-mono truncate">{visiblePasswords[entry.id] ? entry.password : '••••••••••••••••'}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => toggleEntryVisibility(entry.id)} className="bg-zinc-800 px-3 py-2 rounded-lg text-xs shadow">👁️</button>
                    <button onClick={() => copyToClipboard(entry.password)} className="bg-zinc-800 px-4 py-2 rounded-lg text-[10px] font-bold text-white shadow">Copy</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 mt-4 bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl shadow-xl">
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span>ℹ️</span> Module Info & Disclaimers</h4>
        <p className="text-[10px] text-zinc-500 font-mono leading-relaxed text-justify">
          The AES-256 Vault encrypts all credentials entirely client-side. The Master Password acts as the sole cryptographic key and is never stored, cached, or transmitted. If the Master Password is lost, the enclave cannot be decrypted by any means.
        </p>
      </div>
    </div>
  );
}
