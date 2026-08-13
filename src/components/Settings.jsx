import { useSecureStorage } from '../hooks/useSecureStorage';
import { SecurityToggle } from '../utils/securityToggle';
import React, { useState } from 'react';

export function Settings({ closeSettings, appMode, setAppMode, accentColor, setAccentColor, textSize, setTextSize, onNavigate }) {
  const [pin, setPin] = useState(localStorage.getItem('sovereign_pin') || '');

  const [duressPin, setDuressPin] = useState(localStorage.getItem('sovereign_duress_pin') || '');
  const [decoyPin, setDecoyPin] = useState(localStorage.getItem('sovereign_decoy_pin') || '');
  const [wipeLimit, setWipeLimit] = useState(localStorage.getItem('sovereign_wipe_limit') || 'None');
  const [saveStatus, setSaveStatus] = useState('');

  const handleSavePin = () => {
    if (pin.length < 4) {
      setSaveStatus('Too short');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }
    localStorage.setItem('sovereign_pin', pin);
    setSaveStatus('Saved!');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  
  
  const handleUpdateDuress = () => {
      if (duressPin.length >= 4) {
          localStorage.setItem('sovereign_duress_pin', duressPin);
          alert("DURESS PIN ARMED: Entering this exact PIN on the lock screen will irrevocably wipe all data.");
      } else {
          alert("PIN must be at least 4 digits.");
      }
  };

  const handleDisableDuress = () => {
      localStorage.removeItem('sovereign_duress_pin');
      setDuressPin('');
      alert("Duress PIN has been successfully disabled.");
  };

  const handleUpdateDecoy = () => {
      if (decoyPin.length >= 4) {
          localStorage.setItem('sovereign_decoy_pin', decoyPin);
          alert("DECOY PIN ARMED: Entering this PIN will open the Phantom Vault (Decoy Mode).");
      } else {
          alert("PIN must be at least 4 digits.");
      }
  };

  const handleDisableDecoy = () => {
      localStorage.removeItem('sovereign_decoy_pin');
      setDecoyPin('');
      alert("Decoy PIN disabled.");
  };

  const handleUpdateWipeLimit = (limit) => {
      setWipeLimit(limit);
      localStorage.setItem('sovereign_wipe_limit', limit);
      // Reset failed attempts when changing limits
      localStorage.setItem('sovereign_failed_attempts', '0');
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] p-6 animate-fadeIn overflow-y-auto">

          {/* Protocol Manual Button */}
          <div className="mb-6">
              <button 
                  onClick={() => onNavigate('mesh_protocol')} 
                  className="w-full bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 py-4 rounded-2xl flex items-center justify-center gap-3 font-black tracking-widest hover:bg-emerald-900/40 transition-all active:scale-95 shadow-lg">
                  <span>📖</span> MESH NETWORK PROTOCOL
              </button>
          </div>
        

      
      <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <span className="text-2xl text-zinc-400">⚙️</span> SETTINGS
        </h2>
        <button onClick={closeSettings} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-xl font-bold border border-zinc-700 active:scale-95 text-zinc-400 hover:text-white">✕</button>
      </div>
      
      <div className="space-y-6 pb-20">
        
        {/* APP OPERATION MODE */}
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Interface Mode</h3>
          <div className="flex gap-3">
            <button onClick={() => { setAppMode('BASIC'); localStorage.setItem('sovereign_mode', 'BASIC'); }} className={`flex-1 py-4 rounded-xl font-bold text-xs tracking-widest border transition-all flex justify-center items-center gap-2 ${appMode === 'BASIC' ? 'theme-accent-bg text-black shadow-lg border-transparent' : 'bg-black text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}>
              BASIC
            </button>
            <button onClick={() => { setAppMode('EXPERT'); localStorage.setItem('sovereign_mode', 'EXPERT'); }} className={`flex-1 py-4 rounded-xl font-bold text-xs tracking-widest border transition-all flex justify-center items-center gap-2 ${appMode === 'EXPERT' ? 'theme-accent-bg text-black shadow-lg border-transparent' : 'bg-black text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}>
              EXPERT
            </button>
          </div>
        </div>

        {/* SECURITY ACCESS PIN */}
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Security Access PIN</h3>
          <div className="flex gap-3 relative">
            <input 
              type="password" 
              value={pin} 
              onChange={e => setPin(e.target.value)} 
              placeholder="••••" 
              className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-lg tracking-[0.5em] text-white font-mono focus:outline-none focus:border-[var(--accent-text)] shadow-inner" 
            />
            <button onClick={handleSavePin} className="px-6 shrink-0 bg-zinc-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow active:scale-95 border border-zinc-700 hover:border-zinc-500 transition-all">
              Update
            </button>
            {saveStatus && <span className="absolute -top-8 right-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-black px-3 py-1 rounded-full border border-emerald-900/50">{saveStatus}</span>}
          </div>
        </div>

            {/* PROTOCOL ZERO: DURESS PIN */}
            <div className="bg-[#0a0000] border border-red-900/60 rounded-2xl p-5 mb-6 shadow-[0_0_15px_rgba(220,38,38,0.1)]">
                <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2"><span className="animate-pulse">☢️</span> PROTOCOL ZERO (DURESS WIPE)</span>
                    {localStorage.getItem('sovereign_duress_pin') ? <span className="text-[9px] bg-red-900/50 text-red-200 px-2 py-1 rounded border border-red-700">ARMED</span> : <span className="text-[9px] bg-zinc-900 text-zinc-500 px-2 py-1 rounded border border-zinc-700">DISABLED</span>}
                </h3>
                
                <div className="bg-red-950/40 border border-red-900/50 rounded-lg p-3 mb-4">
                    <p className="text-[9px] text-red-400 font-mono leading-relaxed uppercase tracking-wide">
                        <strong>⚠️ LEGAL & OPERATIONAL DISCLAIMER:</strong> Entering the armed Duress PIN on the lock screen acts as a Dead Man's Switch. It triggers a catastrophic, unrecoverable data wipe. All encryption keys, vaults, and Swarm ledgers will be permanently incinerated. The app will instantly reset to a factory state. Use at your own risk.
                    </p>
                </div>

                <div className="flex gap-2">
                    <input 
                        type="password" 
                        value={duressPin}
                        onChange={(e) => setDuressPin(e.target.value)}
                        placeholder="Enter 4+ digit PIN"
                        className="flex-1 bg-black border border-red-900/50 rounded-xl px-4 py-3 text-red-500 tracking-[0.3em] font-mono focus:outline-none focus:border-red-500 transition-colors placeholder:tracking-normal placeholder:text-red-900/50 placeholder:text-xs"
                    />
                    <button 
                        onClick={handleUpdateDuress}
                        className="bg-red-900/20 border border-red-900 text-red-500 px-4 py-3 rounded-xl text-[10px] font-bold tracking-wider hover:bg-red-900 hover:text-white transition-all">
                        UPDATE
                    </button>
                    <button 
                        onClick={handleDisableDuress}
                        className="bg-zinc-950 border border-zinc-800 text-zinc-500 px-4 py-3 rounded-xl text-[10px] font-bold tracking-wider hover:bg-zinc-800 hover:text-zinc-300 transition-all">
                        DISABLE
                    </button>
                </div>
            </div>

            
            {/* PHANTOM VAULT: DECOY PIN */}
            <div className="bg-[#050510] border border-blue-900/60 rounded-2xl p-5 mb-6 shadow-lg">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2"><span>👻</span> PHANTOM VAULT (DECOY PIN)</span>
                    {localStorage.getItem('sovereign_decoy_pin') ? <span className="text-[9px] bg-blue-900/50 text-blue-200 px-2 py-1 rounded border border-blue-700">ARMED</span> : <span className="text-[9px] bg-zinc-900 text-zinc-500 px-2 py-1 rounded border border-zinc-700">DISABLED</span>}
                </h3>
                <p className="text-[10px] text-blue-200/60 mb-4 font-sans leading-relaxed">
                    Entering this PIN silently boots the app into Decoy Mode. Sensitive modules will be hidden or populated with fake, benign data to establish plausible deniability.
                </p>
                <div className="flex gap-2">
                    <input 
                        type="password" 
                        value={decoyPin}
                        onChange={(e) => setDecoyPin(e.target.value)}
                        placeholder="Enter 4+ digit PIN"
                        className="flex-1 bg-black border border-blue-900/50 rounded-xl px-4 py-3 text-blue-400 tracking-[0.3em] font-mono focus:outline-none focus:border-blue-500 transition-colors placeholder:tracking-normal placeholder:text-blue-900/50 placeholder:text-xs"
                    />
                    <button onClick={handleUpdateDecoy} className="bg-blue-900/30 border border-blue-800 text-blue-400 px-4 py-3 rounded-xl text-[10px] font-bold tracking-wider hover:bg-blue-900 hover:text-white transition-all">
                        UPDATE
                    </button>
                    <button onClick={handleDisableDecoy} className="bg-zinc-950 border border-zinc-800 text-zinc-500 px-4 py-3 rounded-xl text-[10px] font-bold tracking-wider hover:bg-zinc-800 transition-all">
                        DISABLE
                    </button>
                </div>
            </div>

            {/* PROTOCOL ZERO: BRUTE FORCE LIMIT */}
            <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-5 mb-6 shadow-lg">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">
                    MAX FAILED ATTEMPTS (AUTO-WIPE)
                </h3>
                <div className="grid grid-cols-4 gap-2">
                    {['None', '3', '6', '9'].map(limit => (
                        <button
                            key={limit}
                            onClick={() => handleUpdateWipeLimit(limit)}
                            className={`py-3 rounded-xl text-xs font-bold transition-all ${wipeLimit === limit ? 'bg-red-900 text-white border border-red-500' : 'bg-black border border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                        >
                            {limit}
                        </button>
                    ))}
                </div>
            </div>


        {/* ACCENT COLOR PROFILE */}
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Accent Color & Theme</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {[
              { id: 'cyan', label: 'CYBER' },
              { id: 'emerald', label: 'MATRIX' },
              { id: 'amber', label: 'HAZMAT' },
              { id: 'purple', label: 'STEALTH' },
              { id: 'rose', label: 'ALERT' }
            ].map(c => (
              <button 
                key={c.id} 
                onClick={() => setAccentColor(c.id)} 
                className={`px-5 py-4 rounded-xl font-bold text-[10px] tracking-widest transition-all shrink-0 ${accentColor === c.id ? 'bg-black text-white border-2 border-white shadow-lg' : 'bg-black text-zinc-500 border border-zinc-800 hover:border-zinc-600'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* TEXT SCALE */}
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global Text Scale</h3>
          <input type="range" min="0" max="2" step="1" value={textSize} onChange={e => setTextSize(parseInt(e.target.value, 10))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none accent-[var(--accent-text)] cursor-pointer" />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono font-bold">
            <span>Small</span>
            <span>Normal</span>
            <span>Large</span>
          </div>
        </div>

        
      {/* DEVELOPER SCREENSHOT TOGGLE */}
      {localStorage.getItem("sovereign_dev_mode") === "true" && (
        <div className="bg-black/60 backdrop-blur border border-emerald-500/50 p-5 rounded-xl space-y-3 shadow-lg mb-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              🔓 Screenshot Shield
            </span>
            <button
              onClick={async () => {
                const isCurrentlyOff = localStorage.getItem("sovereign_allow_screenshots") === "true";
                if (isCurrentlyOff) {
                  await SecurityToggle.enableSecureFlag();
                  localStorage.setItem("sovereign_allow_screenshots", "false");
                  alert("Shields UP: Screenshots & screen recording blocked.");
                } else {
                  await SecurityToggle.disableSecureFlag();
                  localStorage.setItem("sovereign_allow_screenshots", "true");
                  alert("Shields DOWN: Screenshots allowed for debugging.");
                }
                window.location.reload();
              }}
              className="px-4 py-2 bg-emerald-900/50 border border-emerald-500 text-emerald-300 text-xs font-bold rounded-lg hover:bg-emerald-500 hover:text-black transition-all"
            >
              {localStorage.getItem("sovereign_allow_screenshots") === "true" ? "DISABLE" : "ENABLE"}
            </button>
          </div>
        </div>
      )}

      {/* SUPPORT BUTTON */}
        <button onClick={() => { closeSettings(); onNavigate('support'); }} className="w-full py-5 bg-black border border-zinc-800 hover:border-zinc-600 rounded-3xl flex items-center justify-center gap-3 text-xs font-bold text-white uppercase tracking-widest active:scale-95 transition-all shadow-lg mt-8">
          <span className="text-xl">☕</span> Support The Creator
        </button>

      </div>
    </div>
  );
}
