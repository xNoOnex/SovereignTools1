import React, { useState, useEffect } from 'react';

export function Vault({ onNavigate }) {
  // Vault Data State
  const [vaultData, setVaultData] = useState(() => {
    const saved = localStorage.getItem('sovereign_vault');
    return saved ? JSON.parse(saved) : [];
  });

  // Generator State
  const [genLen, setGenLen] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNum, setUseNum] = useState(true);
  const [useSym, setUseSym] = useState(true);
  const [generatedPass, setGeneratedPass] = useState('...');

  // Draft Credential State
  const [draftTitle, setDraftTitle] = useState('');
  const [draftUser, setDraftUser] = useState('');
  const [draftPass, setDraftPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('sovereign_vault', JSON.stringify(vaultData));
  }, [vaultData]);

  const generatePassword = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const nums = '0123456789';
    const syms = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    let chars = '';
    if (useUpper) chars += upper;
    if (useLower) chars += lower;
    if (useNum) chars += nums;
    if (useSym) chars += syms;
    
    if (chars === '') return setGeneratedPass('Select a parameter');
    
    let pass = '';
    for (let i = 0; i < genLen; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPass(pass);
  };

  const saveCredential = () => {
    if (!draftTitle || !draftPass) return alert("Title and Password required.");
    const newCred = {
      id: Date.now(),
      title: draftTitle,
      user: draftUser,
      pass: draftPass // Note: In a production app, this would be encrypted via subtleCrypto before storage
    };
    setVaultData([...vaultData, newCred]);
    setDraftTitle('');
    setDraftUser('');
    setDraftPass('');
  };

  const deleteCredential = (id) => {
    if(window.confirm("Permanently delete this credential?")) {
      setVaultData(vaultData.filter(c => c.id !== id));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-32 select-none font-sans text-white min-h-screen relative z-10 animate-fadeIn">
      
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-2xl font-black text-white flex items-center gap-3"><span className="text-3xl drop-shadow">🔐</span> Vault</h2>
        <p className="text-xs text-zinc-400 mt-2">Local credential manager.</p>
      </div>

      {/* GENERATOR MODULE */}
      <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl shadow-xl space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-3 bg-black p-3 rounded-xl border border-zinc-800">
            <input type="checkbox" checked={useUpper} onChange={e => setUseUpper(e.target.checked)} className="w-5 h-5 accent-[var(--accent-text)]" />
            <span className="text-xs font-bold font-mono">A-Z</span>
          </label>
          <label className="flex items-center gap-3 bg-black p-3 rounded-xl border border-zinc-800">
            <input type="checkbox" checked={useLower} onChange={e => setUseLower(e.target.checked)} className="w-5 h-5 accent-[var(--accent-text)]" />
            <span className="text-xs font-bold font-mono">a-z</span>
          </label>
          <label className="flex items-center gap-3 bg-black p-3 rounded-xl border border-zinc-800">
            <input type="checkbox" checked={useNum} onChange={e => setUseNum(e.target.checked)} className="w-5 h-5 accent-[var(--accent-text)]" />
            <span className="text-xs font-bold font-mono">0-9</span>
          </label>
          <label className="flex items-center gap-3 bg-black p-3 rounded-xl border border-zinc-800">
            <input type="checkbox" checked={useSym} onChange={e => setUseSym(e.target.checked)} className="w-5 h-5 accent-[var(--accent-text)]" />
            <span className="text-xs font-bold font-mono">!@#$</span>
          </label>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Length</span>
            <span className="text-xs theme-accent-text font-mono font-bold">{genLen} Chars</span>
          </div>
          <input type="range" min="8" max="64" value={genLen} onChange={e => setGenLen(e.target.value)} className="w-full accent-[var(--accent-text)] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
        </div>

        <button onClick={generatePassword} className="w-full py-4 theme-accent-bg text-black font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_0_15px_var(--glass-border)] active:scale-95 transition-transform">
          Generate Password
        </button>

        {/* ISOLATED PASSWORD DISPLAY */}
        <div className="bg-black border border-zinc-800 p-4 rounded-xl flex items-center justify-between gap-3 shadow-inner">
          <span className={`font-mono text-sm truncate ${generatedPass === '...' ? 'text-zinc-600' : 'text-white'}`}>{generatedPass}</span>
          <button 
            onClick={() => { if(generatedPass !== '...') setDraftPass(generatedPass); }} 
            className="shrink-0 bg-zinc-800 text-zinc-300 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:text-white active:scale-95 transition-all border border-zinc-700"
          >
            Auto-Fill ↓
          </button>
        </div>
      </div>

      {/* DRAFT CREDENTIAL MODULE */}
      <div className="bg-black/60 border border-zinc-800 p-5 rounded-3xl space-y-3 shadow-inner">
        <h3 className="text-[10px] font-bold theme-accent-text uppercase tracking-widest mb-2 flex items-center gap-2"><span>🗄️</span> Add Credential</h3>
        
        <input type="text" value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder="Title / Service (e.g., ProtonMail)" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-xs text-white font-mono focus:outline-none focus:border-[var(--accent-text)] transition-colors" />
        
        <input type="text" value={draftUser} onChange={e => setDraftUser(e.target.value)} placeholder="Username / Email" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-xs text-white font-mono focus:outline-none focus:border-[var(--accent-text)] transition-colors" />
        
        <div className="flex gap-2">
          <button onClick={() => setShowPass(!showPass)} className="w-14 shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-lg active:scale-95 text-zinc-400">
            {showPass ? '👁️' : '🕶️'}
          </button>
          <input type={showPass ? "text" : "password"} value={draftPass} onChange={e => setDraftPass(e.target.value)} placeholder="Password" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-xs text-white font-mono focus:outline-none focus:border-[var(--accent-text)] transition-colors" />
        </div>

        <button onClick={saveCredential} className="w-full mt-2 py-4 theme-glass-panel text-white font-black text-sm uppercase tracking-widest rounded-xl shadow active:scale-95 transition-transform hover:bg-[var(--glass-border)]">
          Save Credential
        </button>
      </div>

      {/* SAVED VAULT LIST */}
      <div className="space-y-3">
        {vaultData.length === 0 ? (
          <div className="text-center text-zinc-600 font-mono text-xs py-10 bg-black/40 rounded-3xl border border-zinc-900">Vault is empty.</div>
        ) : (
          vaultData.map(cred => (
            <div key={cred.id} className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-2xl flex flex-col gap-3 shadow hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <h4 className="text-sm font-bold text-white truncate">{cred.title}</h4>
                <button onClick={() => deleteCredential(cred.id)} className="text-red-500 font-bold px-2 py-1 bg-red-950/30 rounded text-xs active:scale-95">✕</button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-black p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest w-16">USER</span>
                  <span className="text-xs text-white font-mono truncate flex-1 text-right mr-3">{cred.user || 'N/A'}</span>
                  <button onClick={() => copyToClipboard(cred.user)} className="text-zinc-400 active:scale-95">📋</button>
                </div>
                
                <div className="flex justify-between items-center bg-black p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest w-16">PASS</span>
                  <span className="text-xs text-zinc-300 font-mono truncate flex-1 text-right mr-3 tracking-widest">••••••••</span>
                  <button onClick={() => copyToClipboard(cred.pass)} className="text-zinc-400 active:scale-95">📋</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
