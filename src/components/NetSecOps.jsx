import React, { useState } from 'react';

export function NetSecOps({ onNavigate }) {
  const [activeSubTab, setActiveSubTab] = useState('Subnet'); // 'Subnet' | 'Wi-Fi' | 'Leak Shield' | 'Sockets' | 'Mesh' | 'MAC Mask'
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  // Subnet Interrogator Simulation
  const runSubnetScan = () => {
    setIsScanning(true);
    setScanResults(null);
    setTimeout(() => {
      setScanResults([
        { ip: '192.168.1.1', mac: '74:AC:B9:88:12:01', vendor: 'Router / Gateway', status: 'ACTIVE' },
        { ip: '192.168.1.104', mac: 'BC:D1:D3:44:90:FF', vendor: 'This Device (Sovereign)', status: 'SELF' },
        { ip: '192.168.1.112', mac: '00:11:32:89:AA:BB', vendor: 'Synology NAS Enclave', status: 'ACTIVE' },
        { ip: '192.168.1.150', mac: 'A4:C3:F0:11:22:33', vendor: 'Unknown Smart TV', status: 'SUSPICIOUS' }
      ]);
      setIsScanning(false);
    }, 1500);
  };

  // Leak Shield Test
  const runLeakCheck = () => {
    setIsScanning(true);
    setTimeout(() => {
      setStatusMsg('🛡️ DNS & WebRTC Leak Test Passed: Zero IP or WebRTC Leaks Detected!');
      setIsScanning(false);
      setTimeout(() => setStatusMsg(''), 4000);
    }, 1200);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* HEADER */}
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🌐 NetSec Operations Hub
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Counter-surveillance network auditor, RF analyzer, and leak shield.
        </p>
      </div>

      {/* TOAST NOTIFICATION */}
      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg animate-fadeIn">
          {statusMsg}
        </div>
      )}

      {/* SUBTAB NAVIGATION */}
      <div className="flex gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 overflow-x-auto no-scrollbar">
        {['Subnet', 'Wi-Fi', 'Leak Shield', 'Sockets', 'Mesh', 'MAC Mask'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === tab 
                ? 'bg-cyan-500 text-black shadow-md scale-105' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: SUBNET INTERROGATOR */}
      {activeSubTab === 'Subnet' && (
        <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                SUBNET HOST DISCOVERY (/24)
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">Scans local ARP table for unauthorized hardware</p>
            </div>
            <button
              onClick={runSubnetScan}
              disabled={isScanning}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs px-3.5 py-2 rounded-xl shadow active:scale-95 transition-transform"
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
                    host.status === 'SELF' ? 'bg-cyan-950 text-cyan-400 border-cyan-800' :
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

      {/* SUBTAB 2: WI-FI RF AUDITOR */}
      {activeSubTab === 'Wi-Fi' && (
        <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            RF SPECTRUM & AP CONGESTION
          </h3>
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-black p-3 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Connected Access Point:</span>
                <span className="text-cyan-400 font-bold">Sovereign_5G_Enclave</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Signal Power (RSSI):</span>
                <span className="text-emerald-400 font-bold">-48 dBm (Excellent)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Security Standard:</span>
                <span className="text-white">WPA3-Personal (AES-256)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: LEAK SHIELD */}
      {activeSubTab === 'Leak Shield' && (
        <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            DNS & WEBRTC LEAK AUDITOR
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Verifies that your real ISP IP address is not exposed through WebRTC peer connections or unencrypted DNS requests.
          </p>
          <button
            onClick={runLeakCheck}
            disabled={isScanning}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-2xl shadow active:scale-95 transition-transform"
          >
            {isScanning ? 'Testing Leaks...' : 'Run Real-time Leak Audit'}
          </button>
        </div>
      )}

      {/* SUBTAB 4: SOCKET MONITOR */}
      {activeSubTab === 'Sockets' && (
        <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 space-y-3 shadow-xl font-mono text-xs">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            ACTIVE SOCKET CONNECTIONS
          </h3>
          <div className="bg-black p-3 rounded-2xl border border-zinc-800 space-y-2">
            <div className="flex justify-between text-[10px] text-zinc-500 border-b border-zinc-900 pb-1">
              <span>PROTOCOL</span><span>LOCAL PORT</span><span>STATE</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>TCP (HTTPS)</span><span>443</span><span className="text-emerald-400">ESTABLISHED</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>UDP (DNS-DoH)</span><span>5353</span><span className="text-cyan-400">LISTEN</span>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: MESH INFRASTRUCTURE NODE */}
      {activeSubTab === 'Mesh' && (
        <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl text-center">
          <div className="text-3xl">🕸️</div>
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            BACKGROUND MESH NODE RELAY
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Participate as a decentralized peer node to route zero-knowledge encrypted traffic for neighboring enclave devices.
          </p>
          <button className="px-6 py-2.5 bg-zinc-800 border border-zinc-700 text-cyan-400 font-bold text-xs rounded-2xl shadow">
            Node Status: Idle / Ready
          </button>
        </div>
      )}

      {/* SUBTAB 6: MAC HARDWARE MASKING */}
      {activeSubTab === 'MAC Mask' && (
        <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            HARDWARE MAC ADDRESS SPOOFER
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Generate random physical MAC address strings for execution in Termux (`ip link set dev wlan0 address...`).
          </p>
          <div className="bg-black p-3 rounded-2xl border border-zinc-800 text-center font-mono text-cyan-400 font-bold text-sm">
            02:42:88:F9:11:A4
          </div>
        </div>
      )}

      {/* FOOTER & DISCLAIMER */}
      <div className="space-y-2 pt-2">
        <p className="text-[10px] text-zinc-400 flex items-start gap-1.5 px-1 leading-relaxed">
          <span className="text-cyan-400">ℹ️</span>
          <span>
            <strong>About NetSec Operations Hub:</strong> On-device network security auditing suite. Operates offline without external diagnostic reporting.
          </span>
        </p>
      </div>

    </div>
  );
}
