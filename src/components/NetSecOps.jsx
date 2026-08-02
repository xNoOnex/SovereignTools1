import React, { useState, useEffect } from 'react';

export function NetSecOps({ onNavigate }) {
  const [activeSubTab, setActiveSubTab] = useState('Mesh');
  
  // Mesh Node State
  const [isNodeActive, setIsNodeActive] = useState(false);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [relayedBytes, setRelayedBytes] = useState(0);
  const [activePeersCount, setActivePeersCount] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');

  // Mesh Node Uptime & Bandwidth Simulation Timer
  useEffect(() => {
    let timer;
    if (isNodeActive) {
      timer = setInterval(() => {
        setUptimeSeconds(prev => prev + 1);
        setRelayedBytes(prev => prev + Math.floor(Math.random() * 45 + 12));
      }, 1000);
    } else {
      setUptimeSeconds(0);
      setRelayedBytes(0);
      setActivePeersCount(0);
    }
    return () => clearInterval(timer);
  }, [isNodeActive]);

  const toggleMeshNode = () => {
    if (!isNodeActive) {
      setIsNodeActive(true);
      setActivePeersCount(3);
      setStatusMsg('🕸️ Sovereign Background Mesh Node Relay initialized on local socket!');
      setTimeout(() => setStatusMsg(''), 3500);
    } else {
      setIsNodeActive(false);
      setStatusMsg('🛑 Mesh Relay Node Stopped.');
      setTimeout(() => setStatusMsg(''), 3500);
    }
  };

  const formatUptime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* HEADER */}
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🌐 NetSec Operations Hub
        </h2>
        <p className="text-xs text-zinc-400 mt-1">Counter-surveillance network auditor & Mesh relay.</p>
      </div>

      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg animate-fadeIn">
          {statusMsg}
        </div>
      )}

      {/* SUBTABS */}
      <div className="flex gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 overflow-x-auto no-scrollbar">
        {['Subnet', 'Wi-Fi', 'Leak Shield', 'Sockets', 'Mesh', 'MAC Mask'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === tab ? 'bg-cyan-500 text-black shadow scale-105' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* MESH SUBTAB */}
      {activeSubTab === 'Mesh' && (
        <div className="bg-zinc-900/90 p-6 rounded-3xl border border-zinc-800 space-y-5 shadow-xl text-center">
          
          <div className="w-16 h-16 bg-black border border-cyan-500/40 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-inner">
            🕸️
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
              BACKGROUND MESH NODE RELAY
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Participate as a decentralized peer node to route zero-knowledge encrypted traffic for neighboring enclave devices.
            </p>
          </div>

          {/* TOGGLE BUTTON */}
          <button
            onClick={toggleMeshNode}
            className={`px-8 py-3.5 rounded-2xl font-extrabold text-xs shadow-lg transition-all active:scale-95 border ${
              isNodeActive
                ? 'bg-amber-500 text-black border-amber-400 shadow-amber-500/20'
                : 'bg-cyan-500 text-black border-cyan-400 shadow-cyan-500/20'
            }`}
          >
            {isNodeActive ? 'Node Status: ACTIVE / RELAYING' : 'Node Status: Idle / Ready'}
          </button>

          {/* LIVE METRICS DASHBOARD */}
          {isNodeActive && (
            <div className="bg-black p-4 rounded-2xl border border-zinc-800 grid grid-cols-3 gap-2 text-center animate-fadeIn font-mono">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase block">NODE UPTIME</span>
                <span className="text-xs font-bold text-cyan-400 mt-1 block">{formatUptime(uptimeSeconds)}</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-500 uppercase block">PEERS ROUTED</span>
                <span className="text-xs font-bold text-emerald-400 mt-1 block">{activePeersCount} PEERS</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-500 uppercase block">DATA RELAYED</span>
                <span className="text-xs font-bold text-amber-400 mt-1 block">{relayedBytes} KB</span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* FOOTER */}
      <div className="space-y-2 pt-2">
        <p className="text-[10px] text-zinc-400 flex items-start gap-1.5 px-1 leading-relaxed">
          <span className="text-cyan-400">ℹ️</span>
          <span><strong>About NetSec Operations Hub:</strong> On-device network security auditor and WebRTC background relay node.</span>
        </p>
      </div>

    </div>
  );
}
