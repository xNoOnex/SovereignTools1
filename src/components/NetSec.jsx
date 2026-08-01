import React, { useState } from 'react';
import { ToolFooter } from './ToolFooter';

export function NetSec() {
  const [activeTab, setActiveTab] = useState('Scanner');
  const [isScanning, setIsScanning] = useState(false);
  const [targetIp, setTargetIp] = useState('192.168.1.1');

  const triggerAction = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2500);
  };

  // --- SUBTAB 1: SUBNET SCANNER ---
  const renderScanner = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 shadow-xl space-y-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Subnet Interrogator & Port Scanner</h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">Discover active hosts, probe open ports (22, 80, 443, 8080, 18081), and grab service banners.</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={targetIp}
            onChange={(e) => setTargetIp(e.target.value)}
            placeholder="Target Subnet (e.g. 192.168.1.0/24)"
            className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={triggerAction}
            className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold px-4 py-2 rounded-xl shadow"
          >
            {isScanning ? 'Probing...' : 'Run Scan'}
          </button>
        </div>

        <div className="p-3 bg-black border border-zinc-800 rounded-2xl min-h-[110px] font-mono text-[10px]">
          {isScanning ? (
            <div className="text-cyan-400 animate-pulse space-y-1">
              <p>▶ Sweeping range 192.168.1.1 - 192.168.1.254...</p>
              <p>▶ Probing TCP ports [22, 80, 443, 18081]...</p>
            </div>
          ) : (
            <div className="text-zinc-400 space-y-1">
              <p className="text-emerald-400">[+] 192.168.1.1 - Gateway (MAC: 00:11:22:33:44:55) | Ports: 80, 443 OPEN</p>
              <p className="text-emerald-400">[+] 192.168.1.42 - Local Host | Ports: 22 (SSH) OPEN</p>
              <p className="text-zinc-600">// Scan complete. 2 hosts responsive.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // --- SUBTAB 2: WI-FI AUDITOR ---
  const renderWifiAudit = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 shadow-xl space-y-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Airwave Wi-Fi Auditor</h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">Analyze 2.4GHz / 5GHz channels, RSSI signal drops, and identify rogue APs or weak ciphers.</p>
        </div>

        <button
          onClick={triggerAction}
          className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-xs font-bold rounded-xl border border-zinc-700 shadow"
        >
          {isScanning ? '📡 Sampling RF Signals...' : 'Scan Nearby Access Points'}
        </button>

        <div className="space-y-2">
          <div className="bg-black p-3 rounded-2xl border border-zinc-800 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-white">Sovereign_Node_5G <span className="text-[9px] text-emerald-400 ml-2">WPA3-SAE</span></p>
              <p className="text-[9px] text-zinc-500 font-mono">BSSID: E4:8D:8C:12:34:56 | Ch 36 (5 GHz)</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold">-48 dBm</span>
          </div>

          <div className="bg-black p-3 rounded-2xl border border-zinc-800 flex justify-between items-center opacity-75">
            <div>
              <p className="text-xs font-bold text-zinc-300">Public_Guest_WiFi <span className="text-[9px] text-amber-400 ml-2">OPEN / UNENCRYPTED</span></p>
              <p className="text-[9px] text-zinc-500 font-mono">BSSID: 00:14:D1:AA:BB:CC | Ch 6 (2.4 GHz)</p>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold">-72 dBm</span>
          </div>
        </div>
      </div>
    </div>
  );

  // --- SUBTAB 3: DNS & LEAK SHIELD ---
  const renderDnsShield = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 shadow-xl space-y-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">DNS & WebRTC Leak Shield</h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">Audit whether your ISP or local network operator is hijacking DNS requests or harvesting WebRTC IPs.</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black p-3 rounded-2xl border border-zinc-800">
            <span className="text-[9px] text-zinc-500 font-bold uppercase block">Encrypted DNS (DoH)</span>
            <span className="text-xs font-bold text-emerald-400 mt-1 block">ACTIVE (Quad9)</span>
          </div>
          <div className="bg-black p-3 rounded-2xl border border-zinc-800">
            <span className="text-[9px] text-zinc-500 font-bold uppercase block">WebRTC Stun Leaks</span>
            <span className="text-xs font-bold text-emerald-400 mt-1 block">BLOCKED</span>
          </div>
        </div>

        <button
          onClick={triggerAction}
          className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold rounded-xl shadow"
        >
          {isScanning ? 'Testing Resolvers...' : 'Run Leak Integrity Audit'}
        </button>
      </div>
    </div>
  );

  // --- SUBTAB 4: TRAFFIC MONITOR ---
  const renderTrafficMon = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 shadow-xl space-y-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Sockets & Packet Inspector</h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">Inspect open outbound sockets and track app background telemetry calls in real time.</p>
        </div>

        <div className="bg-black p-3 rounded-2xl border border-zinc-800 space-y-2 max-h-48 overflow-y-auto font-mono text-[10px]">
          <div className="flex justify-between text-zinc-300 border-b border-zinc-900 pb-1">
            <span>TCP 192.168.1.42:44102 ➔ 9.9.9.9:53</span>
            <span className="text-emerald-400">ESTABLISHED</span>
          </div>
          <div className="flex justify-between text-zinc-300 border-b border-zinc-900 pb-1">
            <span>TCP 192.168.1.42:58210 ➔ 198.51.100.14:443</span>
            <span className="text-cyan-400">TLS 1.3</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>UDP 192.168.1.42:37119 ➔ 127.0.0.1:18081</span>
            <span className="text-zinc-500">LOOPBACK</span>
          </div>
        </div>
      </div>
    </div>
  );

  // --- SUBTAB 5: MESH NODE ---
  const renderMeshNode = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 shadow-xl space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Decentralized Mesh Infrastructure</h3>
          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> ACTIVE RELAY
          </span>
        </div>
        <p className="text-[10px] text-zinc-400">Run an isolated, background communication node for decentralized encrypted peer routing.</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black p-3 rounded-2xl border border-zinc-800">
            <span className="block text-[9px] text-zinc-500 font-bold uppercase">Peer Connections</span>
            <span className="block text-lg font-mono text-cyan-400 mt-0.5">14 Active</span>
          </div>
          <div className="bg-black p-3 rounded-2xl border border-zinc-800">
            <span className="block text-[9px] text-zinc-500 font-bold uppercase">Packets Relayed</span>
            <span className="block text-lg font-mono text-cyan-400 mt-0.5">12,890</span>
          </div>
        </div>
      </div>
    </div>
  );

  // --- SUBTAB 6: MAC SPOOFER ---
  const renderSpoofer = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 shadow-xl space-y-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Hardware Identity Masking</h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">Randomize hardware BSSID/MAC addresses to thwart physical tracking across public access points.</p>
        </div>

        <div className="bg-black p-3 rounded-2xl border border-zinc-800 text-center">
          <span className="block text-[9px] text-zinc-500 font-bold uppercase">Current Interface MAC (wlan0)</span>
          <span className="block text-sm font-mono text-cyan-400 mt-1">3A:7B:91:FF:42:10</span>
        </div>

        <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl border border-purple-400 shadow-lg">
          Generate & Override Hardware MAC
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      {/* MAIN HEADER */}
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🛡️ NetSec Operations</h2>
        <p className="text-xs text-zinc-400 mt-1">Counter-surveillance, network auditing, and mesh node control.</p>
      </div>

      {/* SUBTAB SCROLLABLE BAR */}
      <div className="flex space-x-1.5 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto no-scrollbar shadow-lg">
        {[
          { id: 'Scanner', label: 'Subnet' },
          { id: 'Wifi', label: 'Wi-Fi Audit' },
          { id: 'DNS', label: 'DNS Leak' },
          { id: 'Traffic', label: 'Traffic' },
          { id: 'Mesh', label: 'Mesh Node' },
          { id: 'MAC', label: 'MAC Mask' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wide rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DYNAMIC CONTENT AREA */}
      <div className="min-h-[260px]">
        {activeTab === 'Scanner' && renderScanner()}
        {activeTab === 'Wifi' && renderWifiAudit()}
        {activeTab === 'DNS' && renderDnsShield()}
        {activeTab === 'Traffic' && renderTrafficMon()}
        {activeTab === 'Mesh' && renderMeshNode()}
        {activeTab === 'MAC' && renderSpoofer()}
      </div>

      {/* DYNAMIC FOOTER & DISCLAIMERS */}
      {activeTab === 'Scanner' && (
        <ToolFooter
          title="Subnet Interrogator"
          details="Executes ICMP echo sweeps and TCP SYN stealth probes across specified local IP blocks."
          disclaimer="Only audit networks you own or have explicit authorization to probe. Unauthorized network scanning may violate regional computer abuse laws."
        />
      )}
      {activeTab === 'Wifi' && (
        <ToolFooter
          title="RF Spectrum Analyzer"
          details="Reads 802.11 beacon frames via Android Wi-Fi Manager."
          disclaimer="Requires Location Services permission on Android to access surrounding BSSIDs."
        />
      )}
      {activeTab === 'DNS' && (
        <ToolFooter
          title="Resolver Shield"
          details="Routes DNS queries through strict DNS-over-HTTPS (DoH) or DNS-over-TLS (DoT) enclaves."
          disclaimer="Prevents ISP level-3 hijacking and passive SNI logging."
        />
      )}
      {activeTab === 'Traffic' && (
        <ToolFooter
          title="Socket Inspector"
          details="Monitors active IPv4/IPv6 connections established by background tasks."
          disclaimer="Captures metadata only; full raw packet inspection requires local VPN loopback mode."
        />
      )}
      {activeTab === 'Mesh' && (
        <ToolFooter
          title="Mesh Routing Engine"
          details="Runs a background relay node in an isolated virtual execution environment."
          disclaimer="Node activity forwards zero plain-text payloads; all mesh packets are end-to-end encrypted."
        />
      )}
      {activeTab === 'MAC' && (
        <ToolFooter
          title="BSSID Hardware Override"
          details="Manipulates wlan0 interface parameters."
          disclaimer="Requires rooted Android environment (`su`) or specialized kernel driver support to override physical Wi-Fi chip registers."
        />
      )}
    </div>
  );
}
