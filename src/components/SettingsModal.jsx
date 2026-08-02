import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';

export function SettingsModal() {
  const {
    pin, setPin,
    mode, setMode,
    fontSize, setFontSize,
    themeColor, setThemeColor,
    autoDeleteEnabled, setAutoDeleteEnabled,
    autoDeleteDays, setAutoDeleteDays,
    isSettingsOpen, setIsSettingsOpen
  } = useSettings();

  const [newPinInput, setNewPinInput] = useState(pin);
  const [statusMsg, setStatusMsg] = useState('');

  // Correctly read 3B / Qwen cached status
  const isAiCached = localStorage.getItem('sovereign_3b_llm_cached') === 'true' || localStorage.getItem('sovereign_qwen_llm_cached') === 'true';

  const savePin = () => {
    if (newPinInput.length < 4) {
      setStatusMsg('❌ PIN must be at least 4 digits.');
      setTimeout(() => setStatusMsg(''), 3000);
      return;
    }
    setPin(newPinInput);
    setStatusMsg('🔒 Security PIN updated successfully!');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 p-4 flex flex-col justify-between items-center backdrop-blur-md font-sans text-white overflow-y-auto animate-fadeIn">
      
      <div className="w-full max-w-lg flex justify-between items-center border-b border-zinc-800 pb-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Sovereign Settings</h2>
        </div>
        <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-400 hover:text-white text-xl font-bold px-3 py-1">✕</button>
      </div>

      {statusMsg && (
        <div className="w-full max-w-lg my-2 theme-accent-badge py-2 px-3 rounded-xl text-xs font-bold text-center shadow">
          {statusMsg}
        </div>
      )}

      <div className="w-full max-w-lg space-y-4 my-4">
        
        {/* MODE */}
        <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-2">
          <h3 className="text-xs font-bold theme-accent-text uppercase">⚙️ App Operation Mode</h3>
          <p className="text-[10px] text-zinc-400">Easy mode hides advanced security tools (Debloat, Comms, Shredder, NetSec, AES).</p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button onClick={() => setMode('expert')} className={`py-2.5 rounded-2xl text-xs font-bold border ${mode === 'expert' ? 'theme-accent-bg text-black font-extrabold shadow' : 'bg-black text-zinc-400 border-zinc-800'}`}>⚡ EXPERT MODE</button>
            <button onClick={() => setMode('easy')} className={`py-2.5 rounded-2xl text-xs font-bold border ${mode === 'easy' ? 'theme-accent-bg text-black font-extrabold shadow' : 'bg-black text-zinc-400 border-zinc-800'}`}>🌿 EASY MODE</button>
          </div>
        </div>

        {/* PIN */}
        <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-3">
          <h3 className="text-xs font-bold theme-accent-text uppercase">🔒 Security Access PIN</h3>
          <div className="flex gap-2">
            <input type="password" value={newPinInput} onChange={(e) => setNewPinInput(e.target.value)} placeholder="New 4+ digit PIN" className="flex-1 bg-black border border-zinc-800 rounded-2xl px-3 py-2 text-xs text-white font-mono focus:outline-none" />
            <button onClick={savePin} className="bg-zinc-800 theme-accent-text font-bold text-xs px-4 py-2 rounded-2xl border border-zinc-700">Save PIN</button>
          </div>
        </div>

        {/* FONT SIZE */}
        <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-2">
          <h3 className="text-xs font-bold theme-accent-text uppercase">🔤 Text Scale</h3>
          <div className="grid grid-cols-3 gap-2">
            {['small', 'medium', 'large'].map(f => (
              <button key={f} onClick={() => setFontSize(f)} className={`py-2 rounded-xl text-xs font-bold border capitalize ${fontSize === f ? 'theme-accent-bg text-black font-extrabold shadow' : 'bg-black text-zinc-400 border-zinc-800'}`}>{f}</button>
            ))}
          </div>
        </div>

        {/* THEME */}
        <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-2">
          <h3 className="text-xs font-bold theme-accent-text uppercase">🎨 Accent Color Profile</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'cyan', label: 'Cyan' },
              { id: 'amber', label: 'Amber' },
              { id: 'emerald', label: 'Matrix' },
              { id: 'purple', label: 'Onion' }
            ].map(t => (
              <button key={t.id} onClick={() => setThemeColor(t.id)} className={`py-2 rounded-xl text-xs font-bold border capitalize ${themeColor === t.id ? 'bg-zinc-800 font-extrabold shadow theme-accent-text border-current' : 'bg-black text-zinc-500 border-zinc-800'}`}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* AI STATUS */}
        <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-2">
          <h3 className="text-xs font-bold theme-accent-text uppercase">🤖 Offline AI Model Status</h3>
          <div className="bg-black p-3 rounded-2xl border border-zinc-800 flex justify-between items-center">
            <span className="text-xs font-mono text-zinc-300">Cached Local 3B LLM:</span>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${isAiCached ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
              {isAiCached ? '🟢 Cached & Active' : '⚪ Not Downloaded'}
            </span>
          </div>
        </div>

      </div>

      <button onClick={() => setIsSettingsOpen(false)} className="w-full max-w-lg py-3 theme-accent-bg text-black font-extrabold text-xs rounded-2xl shadow-lg my-2">
        Close Settings
      </button>

    </div>
  );
}
