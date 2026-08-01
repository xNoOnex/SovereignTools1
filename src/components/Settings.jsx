import React, { useState, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function Settings({ onLock }) {
  const [pin, setPin] = useState(localStorage.getItem('sovereign_pin') || '1234');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [appMode, setAppMode] = useState(localStorage.getItem('sovereign_mode') || 'expert');
  const [proxyType, setProxyType] = useState(localStorage.getItem('sovereign_proxy_type') || 'direct');
  const [statusMsg, setStatusMsg] = useState('');

  const handlePinUpdate = (e) => {
    e.preventDefault();
    if (newPin.length !== 4 || isNaN(newPin)) {
      setStatusMsg('⚠️ PIN must be exactly 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setStatusMsg('⚠️ PINs do not match');
      return;
    }

    localStorage.setItem('sovereign_pin', newPin);
    setPin(newPin);
    setNewPin('');
    setConfirmPin('');
    setStatusMsg('✅ Lock PIN updated successfully!');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const handleModeChange = (mode) => {
    setAppMode(mode);
    localStorage.setItem('sovereign_mode', mode);
    setStatusMsg(`⚙️ Switched to ${mode.toUpperCase()} Mode`);
    setTimeout(() => setStatusMsg(''), 2000);
  };

  const handleNetworkChange = (type) => {
    setProxyType(type);
    localStorage.setItem('sovereign_proxy_type', type);

    if (window.AndroidNative && window.AndroidNative.setNetworkProxy) {
      if (type === 'tor') {
        window.AndroidNative.setNetworkProxy('socks', '127.0.0.1', 9050);
      } else {
        window.AndroidNative.setNetworkProxy('direct', '', 0);
      }
    }

    setStatusMsg(type === 'direct' ? '⚡ Native Zero-Telemetry Mode Active (No Setup Needed)' : '🧅 Custom SOCKS5 Tor Proxy Active');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            ⚙️ App Settings & Security
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configure lock PIN, user interface modes, and network privacy engine.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      {/* AUTOMATIC NETWORK PRIVACY CONFIGURATION */}
      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>🌐 Network Privacy Engine</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <button
            onClick={() => handleNetworkChange('direct')}
            className={`p-3 rounded-xl border transition-all text-left space-y-1 ${
              proxyType === 'direct' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' : 'bg-black border-zinc-800 text-zinc-400'
            }`}
          >
            <div className="text-sm font-black">⚡ Automatic Built-In</div>
            <div className="text-[9px] text-zinc-400 font-sans font-normal">
              100% Plug & Play. Strips user-agents, referrer headers, and cookies natively with zero external apps.
            </div>
          </button>

          <button
            onClick={() => handleNetworkChange('tor')}
            className={`p-3 rounded-xl border transition-all text-left space-y-1 ${
              proxyType === 'tor' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' : 'bg-black border-zinc-800 text-zinc-400'
            }`}
          >
            <div className="text-sm font-black">🧅 Custom SOCKS5 Proxy</div>
            <div className="text-[9px] text-zinc-400 font-sans font-normal">
              Optional manual proxy tunnel for power users running local SOCKS5 or Tor daemons.
            </div>
          </button>
        </div>
      </div>

      {/* SECURITY PIN MANAGEMENT */}
      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          🔒 Security PIN Settings
        </h3>

        <form onSubmit={handlePinUpdate} className="space-y-3">
          <div>
            <label className="text-[10px] font-mono text-zinc-400 uppercase">Current 4-Digit PIN</label>
            <div className="bg-black p-2.5 rounded-xl border border-zinc-800 text-xs font-mono text-white mt-1">
              {pin}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase">New 4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                placeholder="e.g. 8842"
                className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white font-mono mt-1 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase">Confirm New PIN</label>
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value)}
                placeholder="Re-enter..."
                className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white font-mono mt-1 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow"
          >
            Update Lock PIN
          </button>
        </form>
      </div>

      {/* UI MODE SELECTION */}
      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-2">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
          🎛️ UI Complexity Mode
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <button
            onClick={() => handleModeChange('simple')}
            className={`py-2.5 rounded-xl border transition-all ${
              appMode === 'simple' ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-black text-zinc-400 border-zinc-800'
            }`}
          >
            🌱 Simple Mode
          </button>
          <button
            onClick={() => handleModeChange('expert')}
            className={`py-2.5 rounded-xl border transition-all ${
              appMode === 'expert' ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-black text-zinc-400 border-zinc-800'
            }`}
          >
            ⚡ Expert Mode
          </button>
        </div>
      </div>

      <ToolFooter
        title="Settings & Local Configuration"
        details="Sovereign Tools stores all configuration keys in isolated device local storage."
        disclaimer="Zero cloud syncing • Zero analytics telemetry"
      />
    </div>
  );
}
