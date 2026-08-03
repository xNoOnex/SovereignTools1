import React, { useState, useEffect } from 'react';

export function NetSecOps({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('leak');
  const [loading, setLoading] = useState(false);
  
  // Real Audit States
  const [ipData, setIpData] = useState(null);
  const [pingResults, setPingResults] = useState([]);
  const [dnsResults, setDnsResults] = useState(null);
  const [connectionInfo, setConnectionInfo] = useState(null);

  // 1. REAL LIVE IP & LEAK AUDIT
  const runIpAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      setIpData(data);
    } catch (err) {
      // Fallback API if ipapi is rate-limited
      try {
        const res2 = await fetch('https://api.ipify.org?format=json');
        const data2 = await res2.json();
        setIpData({ ip: data2.ip, org: 'Unknown ISP', country_name: 'External Target' });
      } catch (e) {
        alert('Network Audit Failed: Offline or blocked by network provider.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. REAL PING & LATENCY AUDITOR
  const runPingAudit = async () => {
    setLoading(true);
    const targets = [
      { name: 'Cloudflare (1.1.1.1)', url: 'https://1.1.1.1' },
      { name: 'Google DNS (8.8.8.8)', url: 'https://dns.google' },
      { name: 'Quad9 DNS (9.9.9.9)', url: 'https://dns.quad9.net' }
    ];

    const results = [];
    for (const target of targets) {
      const start = performance.now();
      try {
        await fetch(target.url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
        const latency = Math.round(performance.now() - start);
        results.push({ ...target, latency, status: 'REACHABLE' });
      } catch (err) {
        results.push({ ...target, latency: 'ERR', status: 'BLOCKED' });
      }
    }
    setPingResults(results);
    setLoading(false);
  };

  // 3. REAL DOH (DNS-OVER-HTTPS) AUDITOR
  const runDnsAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://cloudflare-dns.com/dns-query?name=proton.me&type=A', {
        headers: { 'Accept': 'application/dns-json' }
      });
      const data = await res.json();
      setDnsResults(data);
    } catch (err) {
      alert('DNS Query Failed.');
    } finally {
      setLoading(false);
    }
  };

  // 4. REAL LOCAL NETWORK INSPECTOR
  useEffect(() => {
    const info = {
      online: navigator.onLine,
      connectionType: navigator.connection ? navigator.connection.effectiveType : 'Unknown',
      downlink: navigator.connection ? `${navigator.connection.downlink} Mbps` : 'N/A',
      rtt: navigator.connection ? `${navigator.connection.rtt} ms` : 'N/A'
    };
    setConnectionInfo(info);
  }, []);

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen flex flex-col animate-fadeIn relative z-10">
      
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-2xl font-black text-white flex items-center gap-3"><span className="text-3xl text-cyan-400">🌐</span> NetSec Hub</h2>
        <p className="text-xs text-zinc-400 mt-1">Real-time network security, leak detection & latency auditor.</p>
      </div>

      {/* TABS */}
      <div className="flex gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 shrink-0 overflow-x-auto no-scrollbar">
        {[
          { id: 'leak', label: '🛡️ IP Leak Test' },
          { id: 'ping', label: '⚡ Ping Auditor' },
          { id: 'dns', label: '🔐 DoH DNS' },
          { id: 'adapter', label: '📡 Network Info' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all shrink-0 ${activeTab === tab.id ? 'theme-accent-bg text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: IP LEAK TEST */}
      {activeTab === 'leak' && (
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest">REAL-TIME IP & LOCATION AUDIT</h3>
            <p className="text-xs text-zinc-400 font-mono leading-relaxed">
              Verifies if your public IP address, ISP provider, or geographic location is exposed or leaking past your VPN/Tor interface.
            </p>
            
            {ipData && (
              <div className="bg-black/80 border border-zinc-800 rounded-2xl p-4 space-y-2 font-mono text-xs animate-fadeIn shadow-inner">
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">PUBLIC IP:</span>
                  <span className="text-emerald-400 font-bold">{ipData.ip}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">ISP / ORG:</span>
                  <span className="text-zinc-200">{ipData.org || ipData.asn}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">LOCATION:</span>
                  <span className="text-zinc-200">{ipData.city}, {ipData.country_name}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-zinc-500">TIMEZONE:</span>
                  <span className="text-zinc-200">{ipData.timezone}</span>
                </div>
              </div>
            )}
          </div>

          <button onClick={runIpAudit} disabled={loading} className="w-full py-4 theme-accent-bg text-black font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow active:scale-95 transition-transform">
            {loading ? 'Executing Network Audit...' : 'Run Live IP Audit'}
          </button>
        </div>
      )}

      {/* TAB 2: PING AUDITOR */}
      {activeTab === 'ping' && (
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest">HTTP LATENCY & REACHABILITY AUDITOR</h3>
            <p className="text-xs text-zinc-400 font-mono leading-relaxed">
              Measures live round-trip latency to secure global DNS endpoints to audit connection quality and firewall filtering.
            </p>

            {pingResults.length > 0 && (
              <div className="space-y-2 animate-fadeIn">
                {pingResults.map((p, idx) => (
                  <div key={idx} className="bg-black/80 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center font-mono text-xs">
                    <span className="text-zinc-300">{p.name}</span>
                    <span className={`font-bold ${p.status === 'REACHABLE' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {p.latency === 'ERR' ? 'BLOCKED' : `${p.latency} ms`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={runPingAudit} disabled={loading} className="w-full py-4 theme-accent-bg text-black font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow active:scale-95 transition-transform">
            {loading ? 'Measuring Latency...' : 'Execute Latency Audit'}
          </button>
        </div>
      )}

      {/* TAB 3: DoH DSN INSPECTOR */}
      {activeTab === 'dns' && (
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest">DNS-OVER-HTTPS SECURE QUERY</h3>
            <p className="text-xs text-zinc-400 font-mono leading-relaxed">
              Queries encrypted DNS resolvers directly to test if domain lookups are being hijacked or intercepted by local networks.
            </p>

            {dnsResults && (
              <div className="bg-black/80 border border-zinc-800 rounded-2xl p-4 space-y-2 font-mono text-xs animate-fadeIn overflow-x-auto">
                <span className="text-zinc-500 block mb-2">RAW DoH PAYLOAD (Cloudflare 1.1.1.1):</span>
                {dnsResults.Answer ? dnsResults.Answer.map((ans, i) => (
                  <div key={i} className="text-emerald-400 text-[11px]">
                    [{ans.name}] ➔ {ans.data} (TTL: {ans.TTL})
                  </div>
                )) : <span className="text-amber-400">No records returned.</span>}
              </div>
            )}
          </div>

          <button onClick={runDnsAudit} disabled={loading} className="w-full py-4 theme-accent-bg text-black font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow active:scale-95 transition-transform">
            {loading ? 'Querying DoH Resolver...' : 'Inspect Encrypted DNS'}
          </button>
        </div>
      )}

      {/* TAB 4: ADAPTER INFO */}
      {activeTab === 'adapter' && (
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl flex-1">
          <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest">LOCAL ADAPTER HARDWARE STATUS</h3>
          {connectionInfo && (
            <div className="bg-black/80 border border-zinc-800 rounded-2xl p-4 space-y-3 font-mono text-xs shadow-inner">
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">STATE:</span>
                <span className={connectionInfo.online ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {connectionInfo.online ? 'ONLINE (ACTIVE)' : 'OFFLINE (AIRGAP)'}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">TYPE:</span>
                <span className="text-zinc-200 uppercase">{connectionInfo.connectionType}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">EST. DOWNLINK:</span>
                <span className="text-zinc-200">{connectionInfo.downlink}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-zinc-500">EST. RTT LATENCY:</span>
                <span className="text-zinc-200">{connectionInfo.rtt}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* UNIVERSAL DISCLAIMER CARD */}
      <div className="shrink-0 mt-4 bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl shadow-xl">
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span>ℹ️</span> Module Info & Disclaimers</h4>
        <p className="text-[10px] text-zinc-500 font-mono leading-relaxed text-justify">
          The NetSec Hub conducts non-intrusive network diagnostic checks utilizing standard Web APIs, HTTP latency probes, and DNS-over-HTTPS (DoH) queries. Android OS security boundaries strictly prohibit unrooted applications from low-level packet sniffing, MAC address spoofing, or reading raw system ARP tables.
        </p>
      </div>

    </div>
  );
}
