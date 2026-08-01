import React, { useState, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function Settings({ onLock }) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [mode, setMode] = useState(localStorage.getItem('sovereign_mode') || 'expert');
  const [statusMsg, setStatusMsg] = useState('');

  const savedPin = localStorage.getItem('sovereign_pin') || '1234';

  const handlePinChange = (e) => {
    e.preventDefault();
    if (currentPin !== savedPin) {
      setStatusMsg('❌ Current PIN is incorrect!');
      return;
    }
    if (newPin.length !== 4 || isNaN(newPin)) {
      setStatusMsg('❌ New PIN must be exactly 4 digits!');
      return;
    }
    if (newPin !== confirmPin) {
      setStatusMsg('❌ New PINs do not match!');
      return;
    }

    localStorage.setItem('sovereign_pin', newPin);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setStatusMsg('✅ Custom PIN saved successfully!');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    localStorage.setItem('sovereign_mode', newMode);
    window.location.reload(); // Refresh app to apply mode everywhere
  };

  const handleResetData = () => {
    if (window.confirm("⚠️ Are you sure? This will wipe all local vault items and reset your PIN to default 1234.")) {
      localStorage.clear();
      alert("App storage reset. Locking app...");
      onLock();
    }
  };

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto pb-24 select-none">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          ⚙️ Sovereign Suite Settings
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Configure security PINs, interface modes, and system privacy settings.
        </p>
      </div>

      {statusMsg && (
        <div className="bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      {/* MODE TOGGLE: EASY MODE vs EXPERT MODE */}
      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Interface Complexity Mode</h3>
        <p className="text-[11px] text-zinc-400">Select how much technical detail and raw control options to display.</p>
        
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleModeChange('easy')}
            className={`p-3 rounded-xl border text-left transition-all ${
              mode === 'easy'
                ? 'bg-cyan-500/20 border-cyan-500 text-white'
                : 'bg-black/40 border-zinc-800 text-zinc-500'
            }`}
          >
            <div className="font-bold text-xs flex items-center gap-1.5">
              <span>🌱</span> Easy Mode
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">Simplified controls, pre-set defaults, minimal technical text.</div>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('expert')}
            className={`p-3 rounded-xl border text-left transition-all ${
              mode === 'expert'
                ? 'bg-cyan-500/20 border-cyan-500 text-white'
                : 'bg-black/40 border-zinc-800 text-zinc-500'
            }`}
          >
            <div className="font-bold text-xs flex items-center gap-1.5">
              <span>⚡</span> Expert Mode
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">Full raw parameters, shell commands, and detailed cryptographic data.</div>
          </button>
        </div>
      </div>

      {/* CUSTOM PIN CHANGE FORM */}
      <form onSubmit={handlePinChange} className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">🔒 Security PIN Settings</h3>
        
        <div>
          <label className="text-[10px] text-zinc-400 font-bold uppercase">Current 4-Digit PIN</label>
          <input
            type="password"
            maxLength="4"
            placeholder="Default is 1234..."
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            className="w-full mt-1 bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 text-center font-mono"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase">New 4-Digit PIN</label>
            <input
              type="password"
              maxLength="4"
              placeholder="e.g. 8842"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="w-full mt-1 bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 text-center font-mono"
              required
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase">Confirm New PIN</label>
            <input
              type="password"
              maxLength="4"
              placeholder="Re-enter..."
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full mt-1 bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 text-center font-mono"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md"
        >
          Update Lock PIN
        </button>
      </form>

      {/* SYSTEM STORAGE RESET */}
      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-red-900/50 space-y-2">
        <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">⚠️ System Maintenance</h3>
        <p className="text-[11px] text-zinc-400">Purge local cache, clear stored credentials, or reset lock parameters.</p>
        <button
          onClick={handleResetData}
          className="w-full py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-xs rounded-xl transition-all"
        >
          🗑️ Clear App Data & Reset Vault
        </button>
      </div>

      <ToolFooter
        title="Settings & System Diagnostics"
        details="PIN parameters and mode flags are stored in localized localStorage keys on this hardware."
        disclaimer="Ensure you remember your custom PIN. If lost, app data must be reset."
      />
    </div>
  );
}
