import React, { useState, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function Settings({ onLock }) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [mode, setMode] = useState(localStorage.getItem('sovereign_mode') || 'expert');
  
  // Proxy state
  const [proxyType, setProxyType] = useState(localStorage.getItem('sovereign_proxy_type') || 'direct'); // 'direct' | 'tor' | 'custom'
  const [proxyHost, setProxyHost] = useState(localStorage.getItem('sovereign_proxy_host') || '127.0.0.1');
  const [proxyPort, setProxyPort] = useState(localStorage.getItem('sovereign_proxy_port') || '9050');
  
  const [statusMsg, setStatusMsg] = useState('');
  const savedPin = localStorage.getItem('sovereign_pin') || '1234';

  const applyProxySettings = (type, host, port) => {
    setProxyType(type);
    localStorage.setItem('sovereign_proxy_type', type);
    localStorage.setItem('sovereign_proxy_host', host);
    localStorage.setItem('sovereign_proxy_port', port);

    if (window.AndroidNative && window.AndroidNative.setNetworkProxy) {
      window.AndroidNative.setNetworkProxy(type, host, parseInt(port) || 9050);
    }

    setStatusMsg(`🧅 Network Proxy set to: ${type.toUpperCase()} (${host}:${port})`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

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
    window.location.reload();
  };

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          ⚙️ Sovereign Suite Settings
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Configure Tor routing, proxy tunnels, security PINs, and mode interfaces.
        </p>
      </div>

      {statusMsg && (
        <div className="bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      {/* TOR & PRIVACY PROXY MANAGER */}
      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">🧅 Tor & Network Proxy Manager</h3>
        <p className="text-[11px] text-zinc-400">Route all app web traffic, API queries, and AI searches through Tor or custom SOCKS5 tunnels.</p>
        
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => applyProxySettings('direct', '127.0.0.1', '9050')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              proxyType === 'direct' ? 'bg-cyan-500/20 border-cyan-500 text-white' : 'bg-black/40 border-zinc-800 text-zinc-500'
            }`}
          >
            <div className="font-bold text-xs">🚫 Direct</div>
            <div className="text-[9px] text-zinc-400 mt-0.5">No proxy tunnel</div>
          </button>

          <button
            type="button"
            onClick={() => applyProxySettings('tor', '127.0.0.1', '9050')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              proxyType === 'tor' ? 'bg-cyan-500/20 border-cyan-500 text-white' : 'bg-black/40 border-zinc-800 text-zinc-500'
            }`}
          >
            <div className="font-bold text-xs">🧅 Orbot / Tor</div>
            <div className="text-[9px] text-zinc-400 mt-0.5">SOCKS5 127.0.0.1:9050</div>
          </button>

          <button
            type="button"
            onClick={() => applyProxySettings('custom', proxyHost, proxyPort)}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              proxyType === 'custom' ? 'bg-cyan-500/20 border-cyan-500 text-white' : 'bg-black/40 border-zinc-800 text-zinc-500'
            }`}
          >
            <div className="font-bold text-xs">🌐 Custom</div>
            <div className="text-[9px] text-zinc-400 mt-0.5">Custom SOCKS5/HTTP</div>
          </button>
        </div>

        {proxyType === 'custom' && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
            <div className="col-span-2">
              <label className="text-[10px] text-zinc-400 font-bold uppercase">Proxy Host IP</label>
              <input
                type="text"
                value={proxyHost}
                onChange={(e) => setProxyHost(e.target.value)}
                placeholder="127.0.0.1"
                className="w-full mt-1 bg-black border border-zinc-800 rounded-xl p-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-bold uppercase">Port</label>
              <input
                type="text"
                value={proxyPort}
                onChange={(e) => setProxyPort(e.target.value)}
                placeholder="9050"
                className="w-full mt-1 bg-black border border-zinc-800 rounded-xl p-2 text-xs text-white font-mono"
              />
            </div>
            <button
              onClick={() => applyProxySettings('custom', proxyHost, proxyPort)}
              className="col-span-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl"
            >
              Apply Custom Tunnel
            </button>
          </div>
        )}
      </div>

      {/* MODE TOGGLE */}
      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Interface Complexity Mode</h3>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleModeChange('easy')}
            className={`p-3 rounded-xl border text-left transition-all ${
              mode === 'easy' ? 'bg-cyan-500/20 border-cyan-500 text-white' : 'bg-black/40 border-zinc-800 text-zinc-500'
            }`}
          >
            <div className="font-bold text-xs">🌱 Easy Mode</div>
            <div className="text-[10px] text-zinc-400 mt-1">Simplified controls and minimal technical text.</div>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('expert')}
            className={`p-3 rounded-xl border text-left transition-all ${
              mode === 'expert' ? 'bg-cyan-500/20 border-cyan-500 text-white' : 'bg-black/40 border-zinc-800 text-zinc-500'
            }`}
          >
            <div className="font-bold text-xs">⚡ Expert Mode</div>
            <div className="text-[10px] text-zinc-400 mt-1">Full raw parameters and shell scripts.</div>
          </button>
        </div>
      </div>

      {/* PIN CHANGE FORM */}
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

      <ToolFooter
        title="Settings & Network Tunnels"
        details="Configure local PIN locks, UI complexity flags, and Android WebKit ProxyController tunnels."
        disclaimer="Routing requires active local Orbot/SOCKS5 server when enabled."
      />
    </div>
  );
}
