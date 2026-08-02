import React, { useState, useEffect } from 'react';

export function SecureVault({ onNavigate }) {
  // Password Generator Settings
  const [passLength, setPassLength] = useState(16);
  const [incUpper, setIncUpper] = useState(true);
  const [incLower, setIncLower] = useState(true);
  const [incNum, setIncNum] = useState(true);
  const [incSym, setIncSym] = useState(true);
  const [generatedPass, setGeneratedPass] = useState('J-K}7M1D^DOwg}]d');

  // New Entry Form Controls
  const [showAddForm, setShowAddForm] = useState(false);
  const [serviceTitle, setServiceTitle] = useState('');
  const [usernameEmail, setUsernameEmail] = useState('');
  const [passwordKey, setPasswordKey] = useState('');

  const [statusMsg, setStatusMsg] = useState('');
  const [visiblePassIds, setVisiblePassIds] = useState([]);

  // Local Storage Credentials Persistence
  const [credentials, setCredentials] = useState(() => {
    try {
      const stored = localStorage.getItem('sovereign_vault_credentials');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sovereign_vault_credentials', JSON.stringify(credentials));
    } catch (e) {}
  }, [credentials]);

  // High-Entropy Password Generation Engine
  const generatePassword = () => {
    let chars = '';
    if (incUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (incLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (incNum) chars += '0123456789';
    if (incSym) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) {
      setGeneratedPass('Select at least 1 set');
      return;
    }

    let result = '';
    const array = new Uint32Array(passLength);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < passLength; i++) {
      result += chars[array[i] % chars.length];
    }
    setGeneratedPass(result);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setStatusMsg(`📋 Copied ${label} to clipboard!`);
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const saveGeneratedToForm = () => {
    setPasswordKey(generatedPass);
    setShowAddForm(true);
    setStatusMsg('💾 Loaded generated password into new entry form!');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const saveCredentialEntry = (e) => {
    e.preventDefault();
    if (!serviceTitle.trim() || !passwordKey.trim()) {
      setStatusMsg('❌ Title and Password/Key are required.');
      setTimeout(() => setStatusMsg(''), 3000);
      return;
    }

    const newEntry = {
      id: Date.now(),
      title: serviceTitle.trim(),
      username: usernameEmail.trim(),
      password: passwordKey.trim(),
      date: new Date().toLocaleDateString()
    };

    setCredentials([newEntry, ...credentials]);
    setServiceTitle('');
    setUsernameEmail('');
    setPasswordKey('');
    setShowAddForm(false);
    setStatusMsg('🔐 Saved new credential entry to enclave vault!');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const deleteEntry = (id) => {
    setCredentials(credentials.filter(c => c.id !== id));
  };

  const toggleVisibility = (id) => {
    if (visiblePassIds.includes(id)) {
      setVisiblePassIds(visiblePassIds.filter(i => i !== id));
    } else {
      setVisiblePassIds([...visiblePassIds, id]);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* HEADER & NEW ENTRY BUTTON (Matches Screenshot 4943.jpg) */}
      <div className="flex justify-between items-start border-b border-zinc-900 pb-3 pt-2">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🔐 Password Generator & Vault
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Secure password creation and local credential storage.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs px-3 py-2 rounded-2xl shadow-lg active:scale-95 transition-transform shrink-0"
        >
          {showAddForm ? '✕ Close' : '+ New Entry'}
        </button>
      </div>

      {/* TOAST NOTIFICATION */}
      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg animate-fadeIn">
          {statusMsg}
        </div>
      )}

      {/* HIGH-ENTROPY PASSWORD GENERATOR CARD (Matches Screenshot 4943.jpg) */}
      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>🎲</span> HIGH-ENTROPY PASSWORD GENERATOR
          </h3>
        </div>

        {/* PASSWORD DISPLAY BOX WITH COPY & SAVE */}
        <div className="bg-black border border-zinc-800 rounded-2xl p-3 flex items-center justify-between gap-2">
          <span className="text-sm font-mono text-cyan-400 font-bold truncate tracking-wider">
            &gt;{generatedPass}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => copyToClipboard(generatedPass, 'password')}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-zinc-700 flex items-center gap-1"
            >
              📋 Copy
            </button>
            <button
              onClick={saveGeneratedToForm}
              className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold px-3 py-1.5 rounded-xl shadow flex items-center gap-1"
            >
              💾 Save
            </button>
          </div>
        </div>

        {/* SLIDER & REGENERATE BUTTON */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-zinc-400">
            <span>Length: {passLength} characters</span>
            <button
              onClick={generatePassword}
              className="text-cyan-400 font-bold hover:underline flex items-center gap-1"
            >
              🔄 Regenerate
            </button>
          </div>
          <input
            type="range"
            min="8"
            max="64"
            value={passLength}
            onChange={(e) => {
              setPassLength(Number(e.target.value));
              generatePassword();
            }}
            className="w-full accent-cyan-400 bg-black rounded-lg h-1.5 cursor-pointer"
          />
        </div>

        {/* CHECKBOX TOGGLES */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono text-zinc-300">
          <label className="flex items-center gap-2 bg-black/60 p-2 rounded-xl border border-zinc-800 cursor-pointer">
            <input
              type="checkbox"
              checked={incUpper}
              onChange={(e) => { setIncUpper(e.target.checked); generatePassword(); }}
              className="accent-cyan-400"
            />
            <span>Uppercase (A-Z)</span>
          </label>

          <label className="flex items-center gap-2 bg-black/60 p-2 rounded-xl border border-zinc-800 cursor-pointer">
            <input
              type="checkbox"
              checked={incLower}
              onChange={(e) => { setIncLower(e.target.checked); generatePassword(); }}
              className="accent-cyan-400"
            />
            <span>Lowercase (a-z)</span>
          </label>

          <label className="flex items-center gap-2 bg-black/60 p-2 rounded-xl border border-zinc-800 cursor-pointer">
            <input
              type="checkbox"
              checked={incNum}
              onChange={(e) => { setIncNum(e.target.checked); generatePassword(); }}
              className="accent-cyan-400"
            />
            <span>Numbers (0-9)</span>
          </label>

          <label className="flex items-center gap-2 bg-black/60 p-2 rounded-xl border border-zinc-800 cursor-pointer">
            <input
              type="checkbox"
              checked={incSym}
              onChange={(e) => { setIncSym(e.target.checked); generatePassword(); }}
              className="accent-cyan-400"
            />
            <span>Symbols (!@#$)</span>
          </label>
        </div>
      </div>

      {/* SAVE NEW PASSWORD ENTRY FORM (Matches Screenshot 4945.jpg 1:1) */}
      {showAddForm && (
        <form onSubmit={saveCredentialEntry} className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-3 shadow-xl animate-fadeIn">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            SAVE NEW PASSWORD ENTRY
          </h3>

          <input
            type="text"
            value={serviceTitle}
            onChange={(e) => setServiceTitle(e.target.value)}
            placeholder="Service / Title (e.g. Monero Wallet / ProtonMail)"
            className="w-full bg-black border border-zinc-800 rounded-2xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          />

          <input
            type="text"
            value={usernameEmail}
            onChange={(e) => setUsernameEmail(e.target.value)}
            placeholder="Username / Email (Optional)"
            className="w-full bg-black border border-zinc-800 rounded-2xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          />

          <input
            type="text"
            value={passwordKey}
            onChange={(e) => setPasswordKey(e.target.value)}
            placeholder="Password / Key"
            className="w-full bg-black border border-zinc-800 rounded-2xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          />

          <button
            type="submit"
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-2xl shadow active:scale-95 transition-transform"
          >
            Save Password Entry
          </button>
        </form>
      )}

      {/* SAVED CREDENTIALS LIST (Matches Screenshot 4943.jpg) */}
      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-3">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          SAVED CREDENTIALS ({credentials.length})
        </h3>

        {credentials.length === 0 ? (
          <div className="bg-black/40 border border-zinc-800/80 rounded-2xl p-6 text-center text-xs text-zinc-500 font-mono">
            No saved passwords. Generate or enter credentials above to store them locally.
          </div>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {credentials.map((item) => {
              const isVisible = visiblePassIds.includes(item.id);
              return (
                <div key={item.id} className="bg-black p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.title}</h4>
                      {item.username && <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{item.username}</p>}
                    </div>
                    <button
                      onClick={() => deleteEntry(item.id)}
                      className="text-red-400 text-xs font-bold hover:bg-red-950/50 px-2 py-1 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>

                  {/* MASKED / UNMASKED PASSWORD ROW */}
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 flex justify-between items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400 font-bold truncate">
                      {isVisible ? item.password : '••••••••••••••••'}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleVisibility(item.id)}
                        className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-1 rounded-lg border border-zinc-700"
                      >
                        {isVisible ? '👁️ Hide' : '👁️ Show'}
                      </button>
                      <button
                        onClick={() => copyToClipboard(item.password, 'password')}
                        className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-1 rounded-lg border border-cyan-800 font-bold"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
