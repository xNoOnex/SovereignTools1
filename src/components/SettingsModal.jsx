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

  const isAiCached = localStorage.getItem('sovereign_local_llm_cached') === 'true';

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
      
      {/* MODAL HEADER */}
      <div className="w-full max-w-lg flex justify-between items-center border-b border-zinc-800 pb-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            Sovereign Settings
          </h2>
        </div>
        <button
          onClick={() => setIsSettingsOpen(false)}
          className="text-zinc-400 hover:text-white text-xl font-bold px-3 py-1"
        >
          ✕
        </button>
      </div>

      {/* TOAST FEEDBACK */}
      {statusMsg && (
        <div className="w-full max-w-lg my-2 bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg">
          {statusMsg}
        </div>
      )}

      <div className="w-full max-w-lg space-y-4 my-4">
        
        {/* 1. APP MODE TOGGLE (EXPERT vs EASY) */}
        <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-2.5 shadow-xl">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            ⚙️ App Operation Mode
          </h3>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Easy mode hides advanced security tools (Debloat, Comms, Shredder, NetSec, AES).
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setMode('expert')}
              className={`py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                mode === 'expert'
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow font-extrabold'
                  : 'bg-black text-zinc-400 border-zinc-800'
              }`}
            >
              ⚡ EXPERT MODE
            </button>
            <button
              onClick={() => setMode('easy')}
              className={`py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                mode === 'easy'
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow font-extrabold'
                  : 'bg-black text-zinc-400 border-zinc-800'
              }`}
            >
              🌿 EASY MODE
            </button>
          </div>
        </div>

        {/* 2. CHANGE SECURITY PIN */}
        <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            🔒 Security Access PIN
          </h3>

          <div className="flex gap-2">
            <input
              type="password"
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value)}
              placeholder="Enter new 4+ digit PIN"
              className="flex-1 bg-black border border-zinc-800 rounded-2xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
            />
            <button
              onClick={savePin}
              className="bg-zinc-800 hover:bg-zinc-700 text-cyan-400 font-bold text-xs px-4 py-2 rounded-2xl border border-zinc-700 shadow"
            >
              Save PIN
            </button>
          </div>
        </div>

        {/* 3. TEXT SIZE SCALE */}
        <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-2.5 shadow-xl">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            🔤 Text Scale / Font Size
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'small', label: 'Small' },
              { id: 'medium', label: 'Medium' },
              { id: 'large', label: 'Large' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFontSize(f.id)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  fontSize === f.id
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow font-extrabold'
                    : 'bg-black text-zinc-400 border-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. COLOR PROFILE THEME */}
        <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-2.5 shadow-xl">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            🎨 Accent Color Profile
          </h3>

          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'cyan', label: 'Cyan', color: 'text-cyan-400 border-cyan-500' },
              { id: 'amber', label: 'Amber', color: 'text-amber-400 border-amber-500' },
              { id: 'emerald', label: 'Matrix', color: 'text-emerald-400 border-emerald-500' },
              { id: 'purple', label: 'Onion', color: 'text-purple-400 border-purple-500' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setThemeColor(t.id)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  themeColor === t.id
                    ? 'bg-zinc-800 font-extrabold shadow ' + t.color
                    : 'bg-black text-zinc-500 border-zinc-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. AI MODEL DOWNLOAD STATUS */}
        <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-2 shadow-xl">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            🤖 Offline AI Model Status
          </h3>

          <div className="bg-black p-3 rounded-2xl border border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-300">Cached Local Smart LLM:</span>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
              isAiCached
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}>
              {isAiCached ? '🟢 Downloaded / Cached' : '⚪ Not Downloaded'}
            </span>
          </div>
        </div>

        {/* 6. AUTO-DELETE RETENTION TIMER (UNCHECKED BY DEFAULT) */}
        <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoDeleteToggle"
              checked={autoDeleteEnabled}
              onChange={(e) => setAutoDeleteEnabled(e.target.checked)}
              className="accent-cyan-400 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="autoDeleteToggle" className="text-xs font-bold text-white uppercase cursor-pointer">
              ☣️ Automatic Storage Self-Destruct
            </label>
          </div>

          <p className="text-[10px] text-zinc-400 leading-relaxed pl-6">
            Automatically zero-fill and purge app databases if inactive after selected threshold.
          </p>

          {autoDeleteEnabled && (
            <div className="grid grid-cols-4 gap-2 pt-1 pl-6">
              {[30, 15, 10, 5].map(days => (
                <button
                  key={days}
                  onClick={() => setAutoDeleteDays(days)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                    autoDeleteDays === days
                      ? 'bg-red-950 text-red-400 border-red-500 shadow'
                      : 'bg-black text-zinc-500 border-zinc-800'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* CLOSE BUTTON */}
      <button
        onClick={() => setIsSettingsOpen(false)}
        className="w-full max-w-lg py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-2xl shadow-lg my-2"
      >
        Close Settings
      </button>

    </div>
  );
}
