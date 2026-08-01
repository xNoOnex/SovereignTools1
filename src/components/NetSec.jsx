import React, { useState } from 'react';
import { ToolFooter } from './ToolFooter';

export function NetSec() {
  const [activeTab, setActiveTab] = useState('Scanner');
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 3000);
  };

  // SUBTAB COMPONENTS
  const renderScanner = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 shadow-xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Local Topo Scanner</h3>
        <p className="text-[10px] text-zinc-400 mb-4">Map local network topology, identify connected clients, and probe for open ports.</p>
        
        <button 
          onClick={handleScan}
          className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-lg border ${
            isScanning 
              ? 'bg-zinc-800 text-cyan-500 border-cyan-500/30' 
              : 'bg-cyan-600 hover:bg-cyan-500 text-black border-cyan-400'
          }`}
        >
          {isScanning ? '📡 Interrogating Subnet (192.168.1.0/24)...' : 'Initiate Network Scan'}
        </button>

        <div className="mt-4 p-3 bg-black border border-zinc-800 rounded-2xl min-h-[120px]">
          {isScanning ? (
            <div className="text-center text-[10px] text-cyan-400 font-mono mt-8 animate-pulse">
              Broadcasting ARP requests...
            </div>
          ) : (
            <div className="text-center text-[10px] text-zinc-600 font-mono mt-8">
              Awaiting scan initiation.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMeshNode = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 shadow-xl">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Mesh Infrastructure</h3>
          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> ONLINE
          </span>
        </div>
        <p className="text-[10px] text-zinc-400 mb-4">Monitor local background routing node for decentralized mesh communications.</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-black p-3 rounded-2xl border border-zinc-800">
            <span className="block text-[9px] text-zinc-500 font-bold uppercase">Connected Peers</span>
            <span className="block text-lg font-mono text-cyan-400 mt-1">14</span>
          </div>
          <div className="bg-black p-3 rounded-2xl border border-zinc-800">
            <span className="block text-[9px] text-zinc-500 font-bold uppercase">Packets Relayed</span>
            <span className="block text-lg font-mono text-cyan-400 mt-1">8,402</span>
          </div>
        </div>

        <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl border border-zinc-700">
          Configure Node Background Service
        </button>
      </div>
    </div>
  );

  const renderSpoofer = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 shadow-xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Hardware Anonymizer</h3>
        <p className="text-[10px] text-zinc-400 mb-4">Generate randomized MAC addresses to prevent hardware tracking on public Wi-Fi.</p>
        
        <div className="bg-black p-4 rounded-2xl border border-zinc-800 mb-4 text-center">
          <span className="block text-[9px] text-zinc-500 font-bold uppercase mb-1">Current BSSID</span>
          <span className="block text-sm font-mono text-white">00:1A:2B:3C:4D:5E</span>
        </div>

        <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl border border-purple-400 shadow-lg mb-2">
          Generate & Inject Ghost MAC
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      {/* HEADER */}
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🛡️ NetSec Operations</h2>
        <p className="text-xs text-zinc-400 mt-1">Tactical network auditing and infrastructure utilities.</p>
      </div>

      {/* SUBTAB NAVIGATION */}
      <div className="flex space-x-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 shadow-lg">
        {['Scanner', 'Mesh Node', 'Spoofer'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wide rounded-xl transition-all ${
              activeTab === tab 
                ? 'bg-cyan-500 text-black shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ACTIVE TAB CONTENT */}
      <div className="min-h-[280px]">
        {activeTab === 'Scanner' && renderScanner()}
        {activeTab === 'Mesh Node' && renderMeshNode()}
        {activeTab === 'Spoofer' && renderSpoofer()}
      </div>

      {/* DYNAMIC FOOTER BASED ON ACTIVE TAB */}
      {activeTab === 'Scanner' && (
        <ToolFooter 
          title="Subnet Interrogator" 
          details="Executes ICMP sweeps and TCP SYN stealth scans." 
          disclaimer="Only scan networks you own or have explicit authorization to audit. Unauthorized probing is illegal." 
        />
      )}
      {activeTab === 'Mesh Node' && (
        <ToolFooter 
          title="Decentralized Infrastructure" 
          details="Runs a background relay service using isolated virtual environments." 
          disclaimer="Node participation may expose generalized routing metadata to local peers." 
        />
      )}
      {activeTab === 'Spoofer' && (
        <ToolFooter 
          title="MAC Interface Injection" 
          details="Manipulates wlan0 interface configurations." 
          disclaimer="Requires root (su) access on Android 10+ to override hardware configurations permanently." 
        />
      )}
    </div>
  );
}
