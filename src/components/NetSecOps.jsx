import React, { useState, useEffect, useRef } from 'react';
import { registerPlugin } from '@capacitor/core';

const ShizukuRunner = registerPlugin('ShizukuRunner');

export function NetSecOps({ onNavigate }) {
  const [activeModule, setActiveModule] = useState(null); // null = Master Dashboard
  const [loading, setLoading] = useState(false);
  const [shizukuState, setShizukuState] = useState({ active: false, granted: false });

  // Network States
  const [ipData, setIpData] = useState(null);
  const [pingResults, setPingResults] = useState([]);
  const [dnsResults, setDnsResults] = useState(null);
  const [connectionInfo, setConnectionInfo] = useState(null);

  // SysOps States
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState('SOVEREIGN TERMINAL [Version 1.0.0]\nConnected via Shizuku Shell Bridge.\n\n$ ');
  const terminalEndRef = useRef(null);
  const [logcatData, setLogcatData] = useState('Awaiting logcat execution...');
  const [targetPkg, setTargetPkg] = useState('');
  const [targetOp, setTargetOp] = useState('WAKE_LOCK');
  const [apkPath, setApkPath] = useState('/storage/emulated/0/Download/app.apk');

  useEffect(() => {
    checkShizuku();
    const info = {
      online: navigator.onLine,
      connectionType: navigator.connection ? navigator.connection.effectiveType : 'Unknown',
      downlink: navigator.connection ? `${navigator.connection.downlink} Mbps` : 'N/A',
      rtt: navigator.connection ? `${navigator.connection.rtt} ms` : 'N/A'
    };
    setConnectionInfo(info);
  }, []);

  useEffect(() => {
    if (activeModule === 'terminal' && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalOutput, activeModule]);

  const checkShizuku = async () => {
    try {
      const res = await ShizukuRunner.checkStatus();
      setShizukuState({ active: res.active, granted: res.granted });
    } catch (e) {
      setShizukuState({ active: false, granted: false });
    }
  };

  const executeShizuku = async (cmd, successMsg = null) => {
    if (!shizukuState.granted) return alert("Shizuku is offline or denied.");
    setLoading(true);
    try {
      const res = await ShizukuRunner.executeCommand({ command: cmd });
      if (successMsg && res.success) alert(successMsg);
      return res.output;
    } catch (e) {
      alert(`Execution Failed: ${e.message}`);
      return `ERROR: ${e.message}`;
    } finally {
      setLoading(false);
    }
  };

  // --- MODULE LOGIC ---

  const runTerminal = async (e) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput;
    setTerminalInput('');
    setTerminalOutput(prev => prev + cmd + '\n');
    const output = await executeShizuku(cmd);
    setTerminalOutput(prev => prev + output + '\n$ ');
  };

  const runLogcat = async () => {
    const output = await executeShizuku('logcat -d -v time -t 100');
    setLogcatData(output || 'No logs retrieved.');
  };

  const runAssassin = async () => {
    if (!targetPkg) return alert("Enter a package name.");
    await executeShizuku(`am force-stop ${targetPkg}`, `Force Stop signal sent to ${targetPkg}`);
    setTargetPkg('');
  };

  const runAppOps = async () => {
    if (!targetPkg) return alert("Enter a package name.");
    await executeShizuku(`cmd appops set ${targetPkg} ${targetOp} ignore`, `Permission ${targetOp} revoked for ${targetPkg}`);
  };

  const runApkDowngrade = async () => {
    if (!apkPath) return alert("Enter absolute APK path.");
    const output = await executeShizuku(`pm install -r -d "${apkPath}"`, "Installation attempted. Check output for Success.");
    alert(`System Output: \n${output}`);
  };

  const runIpAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://ipapi.co/json/');
      setIpData(await res.json());
    } catch (err) { alert('Network Audit Failed. You may be offline.'); } 
    finally { setLoading(false); }
  };

  const runPingAudit = async () => {
    setLoading(true);
    const targets = [{ name: 'Cloudflare', url: 'https://1.1.1.1' }, { name: 'Google DNS', url: 'https://dns.google' }, { name: 'Quad9', url: 'https://dns.quad9.net' }];
    const results = [];
    for (const t of targets) {
      const start = performance.now();
      try {
        await fetch(t.url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
        results.push({ ...t, latency: Math.round(performance.now() - start), status: 'REACHABLE' });
      } catch (err) {
        results.push({ ...t, latency: 'ERR', status: 'BLOCKED' });
      }
    }
    setPingResults(results);
    setLoading(false);
  };

  const runDnsAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://cloudflare-dns.com/dns-query?name=proton.me&type=A', { headers: { 'Accept': 'application/dns-json' } });
      setDnsResults(await res.json());
    } catch (err) { alert('DNS Query Failed.'); } 
    finally { setLoading(false); }
  };

  // --- RENDERERS ---

  if (activeModule === null) {
    return (
      <div className="p-4 space-y-6 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen relative z-10 animate-fadeIn">
        <div className="border-b border-zinc-900 pb-3 pt-2">
          <h2 className="text-2xl font-black text-white flex items-center gap-3"><span className="text-3xl text-cyan-400">⚡</span> NetSec & SysOps Hub</h2>
          <p className="text-xs text-zinc-400 mt-2">Unified dashboard for network diagnostics and native shell administration.</p>
        </div>

        {/* SHIZUKU STATUS */}
        <div className={`p-4 rounded-3xl flex justify-between items-center shadow-lg ${shizukuState.granted ? 'bg-emerald-950/30 border border-emerald-900/50' : 'bg-red-950/30 border border-red-900/50'}`}>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Shizuku Shell Bridge</h4>
            <p className="text-[10px] font-mono mt-1 text-zinc-400">Required for SysOps Modules</p>
          </div>
          <button onClick={checkShizuku} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow ${shizukuState.granted ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {shizukuState.granted ? 'CONNECTED' : 'OFFLINE'}
          </button>
        </div>

        {/* SYS-OPS GRID */}
        <div>
          <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3 px-2 flex items-center gap-2"><span>⚙️</span> Shizuku SysOps (Root-Level)</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'terminal', icon: '💻', title: 'Local Terminal', desc: 'Raw ADB Shell execution' },
              { id: 'appops', icon: '🛑', title: 'AppOps Revoker', desc: 'Strip hidden permissions' },
              { id: 'assassin', icon: '🔪', title: 'Process Assassin', desc: 'Force-kill any package' },
              { id: 'logcat', icon: '📋', title: 'Logcat Inspector', desc: 'Live system logging' },
              { id: 'apk', icon: '📦', title: 'APK Downgrader', desc: 'Bypass version blocks' }
            ].map(mod => (
              <button key={mod.id} onClick={() => setActiveModule(mod.id)} className={`bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-3xl text-left active:scale-95 transition-all shadow-md ${!shizukuState.granted && 'opacity-50 grayscale'}`} disabled={!shizukuState.granted}>
                <span className="text-2xl drop-shadow mb-2 block">{mod.icon}</span>
                <h4 className="text-xs font-bold text-white tracking-wide">{mod.title}</h4>
                <p className="text-[9px] text-zinc-500 font-mono mt-1">{mod.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* NETWORK GRID */}
        <div>
          <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-2"><span>🌐</span> Network Security</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'leak', icon: '🛡️', title: 'IP Leak Audit', desc: 'Verify tunnel integrity' },
              { id: 'ping', icon: '⚡', title: 'Ping Auditor', desc: 'Test HTTP latency' },
              { id: 'dns', icon: '🔐', title: 'DoH Inspector', desc: 'Test encrypted DNS' },
              { id: 'adapter', icon: '📡', title: 'Adapter Status', desc: 'Local hardware state' }
            ].map(mod => (
              <button key={mod.id} onClick={() => setActiveModule(mod.id)} className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-3xl text-left active:scale-95 transition-all shadow-md hover:border-zinc-700">
                <span className="text-2xl drop-shadow mb-2 block">{mod.icon}</span>
                <h4 className="text-xs font-bold text-white tracking-wide">{mod.title}</h4>
                <p className="text-[9px] text-zinc-500 font-mono mt-1">{mod.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- INDIVIDUAL MODULE VIEWS ---
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen relative z-10 flex flex-col animate-fadeIn">
      <div className="flex items-center gap-3 bg-zinc-900/90 backdrop-blur p-4 rounded-3xl border border-zinc-800 shadow-xl shrink-0">
        <button onClick={() => setActiveModule(null)} className="text-xl px-3 py-2 bg-black rounded-xl border border-zinc-700 active:scale-95">⬅️</button>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">{activeModule} Module</h3>
          <p className="text-[9px] text-zinc-400 font-mono">Sovereign Tools SysOps</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        
        {activeModule === 'terminal' && (
          <div className="flex-1 flex flex-col bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-inner">
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[10px] text-emerald-400 whitespace-pre-wrap leading-relaxed">
              {terminalOutput}
              <div ref={terminalEndRef} />
            </div>
            <form onSubmit={runTerminal} className="flex gap-2 p-3 bg-zinc-900 border-t border-zinc-800 shrink-0">
              <span className="text-emerald-500 font-mono font-bold py-3 pl-2">$</span>
              <input type="text" value={terminalInput} onChange={e => setTerminalInput(e.target.value)} autoFocus className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none placeholder-zinc-600" placeholder="Type shell command..." />
              <button type="submit" className="bg-emerald-600/20 text-emerald-400 border border-emerald-900/50 px-4 rounded-xl text-[10px] font-bold uppercase active:scale-95 shadow">Run</button>
            </form>
          </div>
        )}

        {activeModule === 'assassin' && (
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-6 rounded-3xl space-y-5 shadow-xl">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Process Assassin</h3>
            <p className="text-[10px] text-zinc-400 font-mono">Bypass Android task management and send a SIGKILL equivalent to force-stop any running background package.</p>
            <input type="text" value={targetPkg} onChange={e => setTargetPkg(e.target.value)} placeholder="Package (e.g., com.facebook.katana)" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-4 text-xs text-white font-mono focus:outline-none shadow-inner" />
            <button onClick={runAssassin} disabled={loading} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg active:scale-95 disabled:opacity-50">
              {loading ? 'KILLING PROCESS...' : '🔪 FORCE STOP PACKAGE'}
            </button>
          </div>
        )}

        {activeModule === 'appops' && (
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-6 rounded-3xl space-y-5 shadow-xl">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest">AppOps Permission Revoker</h3>
            <p className="text-[10px] text-zinc-400 font-mono">Modify hidden system permissions not visible in the standard Android Settings menu.</p>
            <input type="text" value={targetPkg} onChange={e => setTargetPkg(e.target.value)} placeholder="Target Package Name..." className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-4 text-xs text-white font-mono focus:outline-none shadow-inner" />
            <select value={targetOp} onChange={e => setTargetOp(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-4 text-xs text-white font-mono focus:outline-none shadow-inner appearance-none">
              <option value="WAKE_LOCK">WAKE_LOCK (Prevent Sleep)</option>
              <option value="RUN_IN_BACKGROUND">RUN_IN_BACKGROUND</option>
              <option value="SYSTEM_ALERT_WINDOW">SYSTEM_ALERT_WINDOW (Overlays)</option>
              <option value="CAMERA">CAMERA</option>
              <option value="RECORD_AUDIO">RECORD_AUDIO</option>
            </select>
            <button onClick={runAppOps} disabled={loading} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg active:scale-95 disabled:opacity-50">
              {loading ? 'REVOKING...' : '🛑 REVOKE PERMISSION'}
            </button>
          </div>
        )}

        {activeModule === 'logcat' && (
          <div className="flex-1 flex flex-col bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center shrink-0">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Live Logcat Dump</h3>
              <button onClick={runLogcat} disabled={loading} className="bg-zinc-800 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase active:scale-95 shadow border border-zinc-700">
                {loading ? 'Fetching...' : 'Dump Last 100'}
              </button>
            </div>
            <div className="flex-1 bg-black border border-zinc-800 rounded-2xl p-4 overflow-y-auto font-mono text-[9px] text-zinc-400 whitespace-pre-wrap shadow-inner">
              {logcatData}
            </div>
          </div>
        )}

        {activeModule === 'apk' && (
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-6 rounded-3xl space-y-5 shadow-xl">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Advanced APK Downgrader</h3>
            <p className="text-[10px] text-zinc-400 font-mono">Bypass Android's version downgrade blocks by forcing package manager installation via shell.</p>
            <input type="text" value={apkPath} onChange={e => setApkPath(e.target.value)} placeholder="Absolute APK Path..." className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-4 text-xs text-white font-mono focus:outline-none shadow-inner" />
            <button onClick={runApkDowngrade} disabled={loading} className="w-full py-4 theme-accent-bg text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg active:scale-95 disabled:opacity-50">
              {loading ? 'INSTALLING...' : '📦 FORCE INSTALL / DOWNGRADE'}
            </button>
          </div>
        )}

        {/* NETWORK VIEWS INJECTED FROM PREVIOUS SCRIPT */}
        {activeModule === 'leak' && (
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-6 rounded-3xl space-y-5 shadow-xl">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Live IP Leak Audit</h3>
            {ipData && (
              <div className="bg-black/80 border border-zinc-800 rounded-2xl p-4 space-y-2 font-mono text-xs shadow-inner">
                <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">IP:</span><span className="text-emerald-400 font-bold">{ipData.ip}</span></div>
                <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">ISP:</span><span className="text-zinc-200">{ipData.org}</span></div>
                <div className="flex justify-between pt-1"><span className="text-zinc-500">LOC:</span><span className="text-zinc-200">{ipData.city}, {ipData.country_name}</span></div>
              </div>
            )}
            <button onClick={runIpAudit} disabled={loading} className="w-full py-4 theme-accent-bg text-black font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow active:scale-95">Run Audit</button>
          </div>
        )}

        {activeModule === 'ping' && (
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-6 rounded-3xl space-y-5 shadow-xl">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Ping Auditor</h3>
            {pingResults.length > 0 && (
              <div className="space-y-2">
                {pingResults.map((p, idx) => (
                  <div key={idx} className="bg-black/80 border border-zinc-800 rounded-2xl p-4 flex justify-between font-mono text-xs"><span className="text-zinc-300">{p.name}</span><span className={p.status === 'REACHABLE' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{p.latency} ms</span></div>
                ))}
              </div>
            )}
            <button onClick={runPingAudit} disabled={loading} className="w-full py-4 theme-accent-bg text-black font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow active:scale-95">Execute Ping</button>
          </div>
        )}

        {activeModule === 'dns' && (
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-6 rounded-3xl space-y-5 shadow-xl">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">DoH Inspector</h3>
            {dnsResults && (
              <div className="bg-black/80 border border-zinc-800 rounded-2xl p-4 space-y-2 font-mono text-[10px] overflow-x-auto shadow-inner text-emerald-400">
                {JSON.stringify(dnsResults.Answer, null, 2)}
              </div>
            )}
            <button onClick={runDnsAudit} disabled={loading} className="w-full py-4 theme-accent-bg text-black font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow active:scale-95">Query DoH</button>
          </div>
        )}

        {activeModule === 'adapter' && (
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-6 rounded-3xl space-y-5 shadow-xl">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Adapter Status</h3>
            {connectionInfo && (
              <div className="bg-black/80 border border-zinc-800 rounded-2xl p-4 space-y-3 font-mono text-xs shadow-inner">
                <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">STATE:</span><span className={connectionInfo.online ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{connectionInfo.online ? 'ONLINE' : 'OFFLINE'}</span></div>
                <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">TYPE:</span><span className="text-zinc-200">{connectionInfo.connectionType}</span></div>
                <div className="flex justify-between pt-1"><span className="text-zinc-500">EST. RTT:</span><span className="text-zinc-200">{connectionInfo.rtt}</span></div>
              </div>
            )}
          </div>
        )}

      </div>
      
      <div className="shrink-0 mt-4 bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl shadow-xl">
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span>ℹ️</span> Module Info & Disclaimers</h4>
        <p className="text-[10px] text-zinc-500 font-mono leading-relaxed text-justify">
          Operations executed via the Shizuku Shell Bridge interact directly with the Android kernel at an elevated user 0 privilege. Modifying AppOps or forcefully killing critical system packages may cause device instability until reboot. Execute commands strictly at your own discretion.
        </p>
      </div>

    </div>
  );
}
