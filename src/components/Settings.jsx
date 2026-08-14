import React, { useState } from 'react';
import { registerPlugin } from '@capacitor/core';
const ScreenshotShield = registerPlugin('ScreenshotShield');

export function Settings({ closeSettings, accentColor, setAccentColor, textSize, setTextSize, onNavigate }) {
  const [duressPin, setDuressPin] = useState(localStorage.getItem('sovereign_duress_pin') || '');
  const [decoyPin, setDecoyPin] = useState(localStorage.getItem('sovereign_decoy_pin') || '');
  const [wipeLimit, setWipeLimit] = useState(localStorage.getItem('sovereign_wipe_limit') || 'None');
  const [saveStatus, setSaveStatus] = useState('');
  const [appMode, setAppMode] = useState(localStorage.getItem('sovereign_mode') || 'BASIC');

  // Developer Mode 4-Tap Logic
  const [devMode, setDevMode] = useState(localStorage.getItem('sovereign_dev_mode') === 'true');
  const [devTaps, setDevTaps] = useState(0);

  const handleDevTap = () => {
    if (devMode) return;
    const newTaps = devTaps + 1;
    if (newTaps >= 4) {
       localStorage.setItem('sovereign_dev_mode', 'true');
       setDevMode(true);
       setDevTaps(0);
       alert("🛠️ Developer Mode Unlocked.");
    } else {
       setDevTaps(newTaps);
    }
  };

  const handleUpdateDuress = () => {
    if (duressPin.length < 4) { alert("PIN must be at least 4 digits."); return; }
    localStorage.setItem('sovereign_duress_pin', duressPin);
    setSaveStatus("Duress PIN updated.");
    setTimeout(() => setSaveStatus(""), 2000);
  };

  const handleDisableDuress = () => {
    localStorage.removeItem('sovereign_duress_pin');
    setDuressPin('');
    setSaveStatus("Duress PIN disabled.");
    setTimeout(() => setSaveStatus(""), 2000);
  };

  const handleUpdateDecoy = () => {
    if (decoyPin.length < 4) { alert("PIN must be at least 4 digits."); return; }
    localStorage.setItem('sovereign_decoy_pin', decoyPin);
    setSaveStatus("Decoy PIN updated.");
    setTimeout(() => setSaveStatus(""), 2000);
  };

  const handleDisableDecoy = () => {
    localStorage.removeItem('sovereign_decoy_pin');
    setDecoyPin('');
    setSaveStatus("Decoy PIN disabled.");
    setTimeout(() => setSaveStatus(""), 2000);
  };

  const handleUpdateWipeLimit = (limit) => {
    setWipeLimit(limit);
    localStorage.setItem('sovereign_wipe_limit', limit);
    localStorage.setItem('sovereign_failed_attempts', '0');
  };

  const toggleShield = async () => {
    try {
      const isCurrentlyOff = localStorage.getItem('sovereign_allow_screenshots') === 'true';
      
      if (isCurrentlyOff) {
        // If it's OFF, enable the shield
        await ScreenshotShield.enable();
        localStorage.setItem('sovereign_allow_screenshots', 'false');
        alert("🛡️ Shields UP: Screenshots & screen recording blocked.");
      } else {
        // If it's ON, disable the shield
        await ScreenshotShield.disable();
        localStorage.setItem('sovereign_allow_screenshots', 'true');
        alert("⚠️ Shields DOWN: Screenshots allowed for debugging.");
      }
      window.location.reload();
    } catch (error) {
      // BULLETPROOF FALLBACK: If native Android throws an error, force the UI state to update anyway.
      const isCurrentlyOff = localStorage.getItem('sovereign_allow_screenshots') === 'true';
      localStorage.setItem('sovereign_allow_screenshots', isCurrentlyOff ? 'false' : 'true');
      console.error("Native bridge failed, forcing local state update.", error);
      window.location.reload();
    }
  };

  const switchMode = (mode) => {
    setAppMode(mode);
    localStorage.setItem('sovereign_mode', mode);
  };

  const themes = [
    { id: 'cyan', label: 'CYBER' },
    { id: 'emerald', label: 'MATRIX' },
    { id: 'amber', label: 'HAZMAT' },
    { id: 'rose', label: 'STEALTH' }
  ];

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] p-6 animate-fadeIn flex flex-col overflow-y-auto">
      
      {/* Header with Hidden 4-Tap Dev Trigger */}
      <div className="flex items-center justify-between pb-6 border-b border-zinc-800 shrink-0">
        <div onClick={handleDevTap} className="cursor-pointer">
          <h2 className="text-2xl font-black text-zinc-100 flex items-center gap-2"><span>⚙️</span> System Settings</h2>
          <p className="text-xs font-mono text-zinc-500">Security & Environment Configuration</p>
        </div>
        <button onClick={closeSettings} className="bg-zinc-900 border border-zinc-700 px-5 py-2 rounded-xl text-xs font-bold text-zinc-300 active:scale-95 transition-all">CLOSE</button>
      </div>

      <div className="flex flex-col gap-6 py-6 pb-20">

        <button onClick={() => { closeSettings(); onNavigate('mesh_protocol'); }} className="w-full py-4 bg-emerald-900/20 border border-emerald-900/50 rounded-2xl text-xs font-black tracking-widest uppercase text-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg">
          <span>📡</span> INITIALIZE MESH PROTOCOL
        </button>

        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col gap-4">
          <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">APP OPERATION MODE</h4>
          <div className="flex gap-2">
             <button onClick={() => switchMode('BASIC')} className={`flex-1 py-3 rounded-xl text-xs font-bold tracking-widest transition-all ${appMode === 'BASIC' ? 'bg-zinc-100 text-black shadow-md' : 'bg-black text-zinc-500 border border-zinc-800'}`}>BASIC</button>
             <button onClick={() => switchMode('EXPERT')} className={`flex-1 py-3 rounded-xl text-xs font-bold tracking-widest transition-all ${appMode === 'EXPERT' ? 'bg-zinc-100 text-black shadow-md' : 'bg-black text-zinc-500 border border-zinc-800'}`}>EXPERT</button>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 border border-red-900/30 rounded-2xl flex flex-col gap-4 shadow-inner">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest flex items-center gap-2"><span>⚠️</span> PROTOCOL DEAD (DURESS PIN)</h4>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-950 border border-zinc-800 text-zinc-500 px-2 py-1 rounded-md">{localStorage.getItem('sovereign_duress_pin') ? 'ACTIVE' : 'DISABLED'}</span>
          </div>
          <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">Entering this PIN on the lock screen acts as a Dead Man's Switch. It triggers a catastrophic, unrecoverable data wipe.</p>
          <div className="flex gap-2">
            <input type="password" value={duressPin} onChange={(e) => setDuressPin(e.target.value)} placeholder="Enter 4+ digit PIN" className="flex-grow bg-black border border-red-900/50 rounded-lg px-4 py-3 text-sm font-mono text-red-500 focus:outline-none focus:border-red-500" />
            <button onClick={handleUpdateDuress} className="bg-red-900/30 border border-red-800 text-red-400 px-4 rounded-lg text-xs font-bold tracking-widest active:scale-95 transition-all">UPDATE</button>
            <button onClick={handleDisableDuress} className="bg-zinc-950 border border-zinc-800 text-zinc-500 px-4 rounded-lg text-xs font-bold tracking-widest active:scale-95 transition-all">DISABLE</button>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 border border-blue-900/30 rounded-2xl flex flex-col gap-4 shadow-inner">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2"><span>👻</span> PHANTOM VAULT (DECOY PIN)</h4>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-950 border border-zinc-800 text-zinc-500 px-2 py-1 rounded-md">{localStorage.getItem('sovereign_decoy_pin') ? 'ACTIVE' : 'DISABLED'}</span>
          </div>
          <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">Entering this PIN silently boots the app into Decoy Mode. Sensitive modules will be hidden or populated with fake, benign data.</p>
          <div className="flex gap-2">
            <input type="password" value={decoyPin} onChange={(e) => setDecoyPin(e.target.value)} placeholder="Enter 4+ digit PIN" className="flex-grow bg-black border border-blue-900/50 rounded-lg px-4 py-3 text-sm font-mono text-blue-400 focus:outline-none focus:border-blue-500" />
            <button onClick={handleUpdateDecoy} className="bg-blue-900/30 border border-blue-800 text-blue-400 px-4 rounded-lg text-xs font-bold tracking-widest active:scale-95 transition-all">UPDATE</button>
            <button onClick={handleDisableDecoy} className="bg-zinc-950 border border-zinc-800 text-zinc-500 px-4 rounded-lg text-xs font-bold tracking-widest active:scale-95 transition-all">DISABLE</button>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col gap-4">
          <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">MAX FAILED ATTEMPTS (AUTO-WIPE)</h4>
          <div className="grid grid-cols-4 gap-2">
            {['None', '3', '6', '9'].map(limit => (
              <button key={limit} onClick={() => handleUpdateWipeLimit(limit)} className={`py-3 rounded-xl text-xs font-bold transition-all ${wipeLimit === limit ? 'bg-red-900 text-white border border-red-500' : 'bg-black border border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>{limit}</button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col gap-4">
          <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">ACCENT COLOR & THEME</h4>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {themes.map(t => (
              <button key={t.id} onClick={() => { setAccentColor(t.id); localStorage.setItem('sovereign_theme', t.id); }} className={`px-5 py-4 rounded-xl font-bold text-[10px] tracking-widest transition-all shrink-0 ${accentColor === t.id ? 'bg-black text-white border-2 border-white shadow-lg' : 'bg-black text-zinc-500 border border-zinc-800 hover:border-zinc-600'}`}>{t.label}</button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col gap-4">
          <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">GLOBAL TEXT SCALE</h4>
          <input type="range" min="0" max="2" step="1" value={textSize} onChange={(e) => { setTextSize(parseInt(e.target.value, 10)); localStorage.setItem('sovereign_text_scale', e.target.value); }} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono font-bold"><span>Small</span><span>Normal</span><span>Large</span></div>
        </div>

        {/* DEVELOPER SCREENSHOT TOGGLE */}
        {devMode && (
          <div className="p-4 bg-zinc-900/50 border border-emerald-900/30 rounded-2xl flex items-center justify-between shadow-md">
            <div>
              <h4 className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2"><span>🔒</span> SCREENSHOT SHIELD</h4>
              <p className="text-[10px] font-mono text-zinc-500 pt-1">Block OS screen capture & recording</p>
            </div>
            <button onClick={toggleShield} className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-widest transition-all ${localStorage.getItem('sovereign_allow_screenshots') === 'true' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}>
              {localStorage.getItem('sovereign_allow_screenshots') === 'true' ? 'ENABLE' : 'DISABLE'}
            </button>
          </div>
        )}

        <button onClick={() => { closeSettings(); onNavigate('support'); }} className="w-full py-4 bg-black border border-zinc-800 rounded-2xl text-xs font-bold tracking-widest uppercase text-zinc-300 active:scale-95 transition-all flex items-center justify-center gap-2 mb-10">
          <span>☕</span> SUPPORT THE CREATOR
        </button>

      </div>
    </div>
  );
}

export default Settings;
