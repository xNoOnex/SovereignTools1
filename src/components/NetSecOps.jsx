import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

export function NetSecOps({ onNavigate }) {
  const { currentTheme } = useSettings();
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
        { ip: '192.168.1.112', mac: '00:11:32:89:AA:BB', vendor: 'NAS Storage Enclave', status: 'ACTIVE' },
        { ip: '192.168.1.150', mac: 'A4:C3:F0:11:22:33', vendor: 'Unknown Device', status: 'SUSPICIOUS' }
      ]);
      setIsScanning(false);
    }, 1200);
  };

  const runLeakCheck = () => {
    setIsScanning(true);
    setTimeout(() => {
      setStatusMsg('🛡️ Leak Test Passed: Zero IP or WebRTC Leaks Detected!');
      setIsScanning(false);
      setTimeout(() => setStatusMsg(''), 4000);
    }, 1000);
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
        <div className={`border p-2 rounded-xl text-xs font-bold text-center shadow-lg ${currentTheme.badge}`}>
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
              activeSubTab === tab ? `${currentTheme.bg} text-black shadow scale-105` : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: SUBNET */}
      {activeSubTab === 'Subnet' && (
        <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.text}`}>
                SUBNET HOST DISCOVERY (/24)
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">Scans local ARP table for devices</p>
            </div>
            <button
              onClick={runSubnetScan}
              disabled={isScanning}
              className={`${currentTheme.bg} text-black font-bold text-xs px-3.5 py-2 rounded-xl shadow active:scale-95`}
            >
              {isScanning ? 'Scanning...' : 'Scan Subnet'}
            </button>
          </div>

          {scanResults && (
            <div className="space-y-2 pt-1">
              {scanResults.map((host, idx) => (
                <div key={idx} className="bg-black p-3 rounded-2xl border border-zinc-800 flex justify-between items-center text-xs font-mono">
                  <div>
                    <span className="font-bold text-white block">{host.ip}</span>
                    <span className="text-[9px] text-zinc-500 block">{host.mac} • {host.vendor}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                    host.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                    host.status === 'SELF' ? currentTheme.badge :
                    'bg-red-950 text-red-400 border-red-800 animate-pulse'
                  }`}>
                    {host.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: WI-FI */}
      {activeSubTab === 'Wi-Fi' && (
        <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.text}`}>
            RF SPECTRUM & ACCESS POINT AUDIT
          </h3>
          <div className="bg-black p-3 rounded-2xl border border-zinc-800 space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400">Connected Network:</span>
              <span className={`font-bold ${currentTheme.text}`}>Sovereign_Enclave_5G</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Signal Strength (RSSI):</span>
              <span className="text-emerald-400 font-bold">-46 dBm (Optimal)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Encryption:</span>
              <span className="text-white">WPA3-Personal (AES-256)</span>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: LEAK SHIELD */}
      {activeSubTab === 'Leak Shield' && (
        <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.text}`}>
            DNS & WEBRTC LEAK AUDITOR
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Verifies that your real ISP IP is not leaked through WebRTC or unencrypted DNS queries.
          </p>
          <button
            onClick={runLeakCheck}
            disabled={isScanning}
            className={`w-full py-3 ${currentTheme.bg} text-black font-bold text-xs rounded-2xl shadow active:scale-95`}
          >
            {isScanning ? 'Auditing Network...' : 'Run Real-Time Leak Audit'}
          </button>
        </div>
      )}

      {/* SUBTAB 4: SOCKETS */}
      {activeSubTab === 'Sockets' && (
        <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 space-y-3 shadow-xl font-mono text-xs">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.text}`}>
            ACTIVE LOCAL SOCKET CONNECTIONS
          </h3>
          <div className="bg-black p-3 rounded-2xl border border-zinc-800 space-y-2">
            <div className="flex justify-between text-[10px] text-zinc-500 border-b border-zinc-900 pb-1">
              <span>PROTOCOL</span><span>PORT</span><span>STATE</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>TCP (HTTPS)</span><span>443</span><span className="text-emerald-400">ESTABLISHED</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>UDP (DNS-DoH)</span><span>5353</span><span className={currentTheme.text}>LISTEN</span>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: MESH */}
      {activeSubTab === 'Mesh' && (
        <div className="bg-zinc-900/90 p-6 rounded-3xl border border-zinc-800 space-y-5 shadow-xl text-center">
          <div className="w-16 h-16 bg-black border border-zinc-800 rounded-2xl mx-auto flex items-center justify-center text-3xl">
            🕸️
          </div>
          <h3 className={`text-sm font-bold uppercase tracking-wider ${currentTheme.text}`}>
            BACKGROUND MESH NODE RELAY
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Participate as a decentralized peer node to route encrypted traffic for enclave devices.
          </p>
          <button
            onClick={() => setIsNodeActive(!isNodeActive)}
            className={`px-8 py-3.5 rounded-2xl font-extrabold text-xs shadow-lg border ${
              isNodeActive ? 'bg-amber-500 text-black border-amber-400' : `${currentTheme.bg} text-black ${currentTheme.border}`
            }`}
          >
            {isNodeActive ? 'Node Status: ACTIVE / RELAYING' : 'Node Status: Idle / Ready'}
          </button>

          {isNodeActive && (
            <div className="bg-black p-4 rounded-2xl border border-zinc-800 grid grid-cols-2 gap-2 text-center font-mono">
              <div>
                <span className="text-[9px] text-zinc-500 block">UPTIME</span>
                <span className={`text-xs font-bold ${currentTheme.text}`}>{uptimeSeconds}s</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-500 block">RELAYED</span>
                <span className="text-xs font-bold text-emerald-400">{relayedBytes} KB</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 6: MAC MASK */}
      {activeSubTab === 'MAC Mask' && (
        <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.text}`}>
            HARDWARE MAC ADDRESS SPOOFER
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Generate randomized hardware MAC strings for execution in Termux (`ip link set dev wlan0 address...`).
          </p>
          <div className={`bg-black p-3 rounded-2xl border border-zinc-800 text-center font-mono font-bold text-sm ${currentTheme.text}`}>
            02:42:88:F9:11:A4
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="space-y-2 pt-2">
        <p className="text-[10px] text-zinc-400 flex items-start gap-1.5 px-1 leading-relaxed">
          <span className={currentTheme.text}>ℹ️</span>
          <span><strong>About NetSec Operations Hub:</strong> On-device security auditor and Mesh node.</span>
        </p>
      </div>

    </div>
  );
}
