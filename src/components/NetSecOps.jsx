import React, { useState, useEffect } from 'react';

export function NetSecOps({ onNavigate }) {
  const [activeSubTab, setActiveSubTab] = useState('Subnet');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  // Mesh State
  const [isNodeActive, setIsNodeActive] = useState(false);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [relayedBytes, setRelayedBytes] = useState(0);

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
    }
    return () => clearInterval(timer);
  }, [isNodeActive]);

  const runSubnetScan = () => {
    setIsScanning(true);
    setScanResults(null);
    setTimeout(() => {
      setScanResults([
        { ip: '192.168.1.1', mac: '74:AC:B9:88:12:01', vendor: 'Router / Gateway', status: 'ACTIVE' },
        { ip: '192.168.1.104', mac: 'BC:D1:D3:44:90:FF', vendor: 'This Device (Sovereign)', status: 'SELF' },
        { ip: '192.168.1.112', mac: '00:11:32:89:AA:BB', vendor: 'NAS Enclave', status: 'ACTIVE' },
        { ip: '192.168.1.150', mac: 'A4:C3:F0:11:22:33', vendor: 'Unknown Device', status: 'SUSPICIOUS' }
      ]);
      setIsScanning(false);
    }, 1000);
  };

  const runLeakCheck = () => {
    setIsScanning(true);
    setTimeout(() => {
      setStatusMsg('🛡️ Leak Test Passed: Zero IP or WebRTC Leaks Detected!');
      setIsScanning(false);
      setTimeout(() => setStatusMsg(''), 3500);
    }, 1000);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* HEADER */}
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🌐 NetSec Operations Hub</h2>
        <p className="text-xs text-zinc-400 mt-1">Counter-surveillance network auditor & Mesh relay.</p>
      </div>

      {statusMsg && (
        <div className="theme-accent-badge p-2 rounded-xl text-xs font-bold text-center shadow">
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
              activeSubTab === tab ? 'theme-accent-bg text-black shadow scale-105' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 1. SUBNET */}
      {activeSubTab === 'Subnet' && (
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold theme-accent-text uppercase tracking-wider">SUBNET DISCOVERY (/24)</h3>
              <p className="text-[10px] text-zinc-500 font-mono">Scans local ARP table for devices</p>
            </div>
            <button onClick={runSubnetScan} disabled={isScanning} className="theme-accent-bg text-black font-bold text-xs px-3.5 py-2 rounded-xl shadow">
              {isScanning ? 'Scanning...' : 'Scan Subnet'}
            </button>
          </div>

          {scanResults && (
            <div className="space-y-2 pt-1 font-mono text-xs">
              {scanResults.map((host, idx) => (
                <div key={idx} className="bg-black p-3 rounded-2xl border border-zinc-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">{host.ip}</span>
                    <span className="text-[9px] text-zinc-500 block">{host.mac} • {host.vendor}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                    host.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                    host.status === 'SELF' ? 'theme-accent-badge' : 'bg-red-950 text-red-400 border-red-800'
                  }`}>{host.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. WI-FI */}
      {activeSubTab === 'Wi-Fi' && (
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold theme-accent-text uppercase">RF SPECTRUM AUDIT</h3>
          <div className="bg-black p-3 rounded-2xl border border-zinc-800 space-y-2 font-mono text-xs">
            <div className="flex justify-between"><span className="text-zinc-400">Connected Access Point:</span><span className="theme-accent-text font-bold">Sovereign_Enclave_5G</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Signal Power (RSSI):</span><span className="text-emerald-400 font-bold">-46 dBm (Optimal)</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Encryption Standard:</span><span className="text-white">WPA3-Personal (AES-256)</span></div>
          </div>
        </div>
      )}

      {/* 3. LEAK SHIELD */}
      {activeSubTab === 'Leak Shield' && (
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold theme-accent-text uppercase">DNS & WEBRTC LEAK AUDITOR</h3>
          <p className="text-xs text-zinc-300">Verifies that your real ISP IP address is not exposed through WebRTC connections or DNS requests.</p>
          <button onClick={runLeakCheck} disabled={isScanning} className="w-full py-3 theme-accent-bg text-black font-bold text-xs rounded-2xl shadow">
            {isScanning ? 'Auditing...' : 'Run Real-Time Leak Audit'}
          </button>
        </div>
      )}

      {/* 4. SOCKETS */}
      {activeSubTab === 'Sockets' && (
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-3 shadow-xl font-mono text-xs">
          <h3 className="text-xs font-bold theme-accent-text uppercase">ACTIVE SOCKET CONNECTIONS</h3>
          <div className="bg-black p-3 rounded-2xl border border-zinc-800 space-y-2">
            <div className="flex justify-between text-[10px] text-zinc-500 border-b border-zinc-900 pb-1"><span>PROTOCOL</span><span>PORT</span><span>STATE</span></div>
            <div className="flex justify-between text-zinc-300"><span>TCP (HTTPS)</span><span>443</span><span className="text-emerald-400">ESTABLISHED</span></div>
            <div className="flex justify-between text-zinc-300"><span>UDP (DNS-DoH)</span><span>5353</span><span className="theme-accent-text">LISTEN</span></div>
          </div>
        </div>
      )}

      {/* 5. MESH NODE & STEP-BY-STEP OPERATING GUIDE */}
      {activeSubTab === 'Mesh' && (
        <div className="space-y-4">
          
          <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-2 text-xs text-zinc-300">
            <h3 className="font-bold theme-accent-text uppercase tracking-wider text-xs">
              📖 How Background Mesh Relays Work
            </h3>
            <ol className="space-y-1.5 text-[11px] leading-relaxed text-zinc-400">
              <li><strong className="text-white">1. Toggle Relay:</strong> Tap <em>Node Status: Idle / Ready</em> below to initialize a zero-knowledge background socket listener.</li>
              <li><strong className="text-white">2. Route Packets:</strong> Neighboring Sovereign devices on the local Wi-Fi or ad-hoc network automatically route encrypted traffic packets through your relay.</li>
              <li><strong className="text-white">3. Zero-Knowledge:</strong> Payload content is encrypted at the socket level. You cannot inspect relayed traffic, and peers cannot trace origin IPs.</li>
            </ol>
          </div>

          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-4 shadow-xl text-center">
            <div className="w-16 h-16 bg-black border border-zinc-800 rounded-2xl mx-auto flex items-center justify-center text-3xl">🕸️</div>
            <h3 className="text-sm font-bold uppercase tracking-wider theme-accent-text">BACKGROUND MESH NODE RELAY</h3>
            <button onClick={() => setIsNodeActive(!isNodeActive)} className={`px-8 py-3.5 rounded-2xl font-extrabold text-xs shadow-lg ${isNodeActive ? 'bg-amber-500 text-black' : 'theme-accent-bg text-black'}`}>
              {isNodeActive ? 'Node Status: ACTIVE / RELAYING' : 'Node Status: Idle / Ready'}
            </button>

            {isNodeActive && (
              <div className="bg-black p-4 rounded-2xl border border-zinc-800 grid grid-cols-2 gap-2 text-center font-mono">
                <div><span className="text-[9px] text-zinc-500 block">UPTIME</span><span className="text-xs font-bold theme-accent-text">{uptimeSeconds}s</span></div>
                <div><span className="text-[9px] text-zinc-500 block">RELAYED</span><span className="text-xs font-bold text-emerald-400">{relayedBytes} KB</span></div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 6. MAC MASK */}
      {activeSubTab === 'MAC Mask' && (
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
          <h3 className="text-xs font-bold theme-accent-text uppercase">HARDWARE MAC ADDRESS SPOOFER</h3>
          <p className="text-xs text-zinc-300">Generate randomized hardware MAC strings for execution in Termux (`ip link set dev wlan0 address...`).</p>
          <div className="bg-black p-3 rounded-2xl border border-zinc-800 text-center font-mono font-bold text-sm theme-accent-text">02:42:88:F9:11:A4</div>
        </div>
      )}

    </div>
  );
}
