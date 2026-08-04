import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';

const ShizukuRunner = registerPlugin('ShizukuRunner');

export function NetSecOps({ onNavigate }) {
  const [shizukuGranted, setShizukuGranted] = useState(false);
  const [activeTab, setActiveTab] = useState('NETWORK');
  const [activeModule, setActiveModule] = useState(null);
  
  const [moduleLog, setModuleLog] = useState('');
  const [moduleInput, setModuleInput] = useState('');

  useEffect(() => {
    checkShizuku();
  }, []);

  const checkShizuku = async () => {
    try {
      const res = await ShizukuRunner.checkStatus();
      setShizukuGranted(res.granted);
    } catch (e) {
      setShizukuGranted(false);
    }
  };

  const runModuleCommand = async (cmd, label) => {
    setModuleLog(prev => prev + `\n> Executing [${label}]...\n`);
    try {
      const res = await ShizukuRunner.executeCommand({ command: cmd });
      const engineTag = res.engine ? `[${res.engine}] ` : '';
      setModuleLog(prev => prev + engineTag + (res.output || 'Command completed.') + '\n');
    } catch (e) {
      setModuleLog(prev => prev + `ERROR: ${e.message}\n`);
    }
  };

  const executeModule = (e) => {
    e?.preventDefault();
    if (activeModule.requiresInput && !moduleInput.trim()) return;
    
    let finalCmd = activeModule.cmd;
    if (activeModule.requiresInput) {
       finalCmd = `${activeModule.cmd} ${moduleInput}`;
    }
    
    runModuleCommand(finalCmd, activeModule.title);
  };

  const networkModules = [
    { id: 'subnet', title: 'Subnet Mapping', icon: '🌐', desc: 'Scan routing tables and ARP cache', cmd: 'ip route || arp -a', disclaimer: 'Reveals local gateway paths and hardware addresses of connected network peers.' },
    { id: 'wifi', title: 'Wi-Fi Telemetry', icon: '📶', desc: 'Dump wireless interface data', cmd: 'dumpsys wifi | grep -E "SSID|BSSID|mNetworkInfo"', disclaimer: 'Requires root. Extracts exact BSSID targets and connection logs from the Android Wi-Fi service.' },
    { id: 'leak', title: 'Leak Shield Audit', icon: '🛡️', desc: 'Test ICMP packet routing', cmd: 'ping -c 4 1.1.1.1', disclaimer: 'Verifies outward connectivity to Cloudflare DNS to ensure VPN/Gateway is routing correctly.' },
    { id: 'sockets', title: 'Listening Sockets', icon: '🔌', desc: 'Audit open ports', cmd: 'netstat -tuln || ss -tulpn', disclaimer: 'Requires root to bind to netlink. Reveals all active daemons listening on the device.' }
  ];

  const sysopsModules = [
    { id: 'appops', title: 'AppOps List', icon: '📦', desc: 'Scan installed 3rd-party apps', cmd: 'pm list packages -3', disclaimer: 'Requires root (INTERACT_ACROSS_USERS_FULL). Lists all user-installed packages.' },
    { id: 'assassin', title: 'Process Assassin', icon: '🔪', desc: 'Force-stop running packages', cmd: 'am force-stop', requiresInput: true, inputLabel: 'Target Package (e.g. com.android.chrome)', disclaimer: 'Requires root. Instantly kills the target package and all background services associated with it.' },
    { id: 'logcat', title: 'Logcat Inspector', icon: '📋', desc: 'View recent system log lines', cmd: 'logcat -d | tail -n 50', disclaimer: 'Dumps the last 50 lines of the system log. Highly sensitive data may be exposed here.' },
    { id: 'downgrade', title: 'APK Downgrader', icon: '⬇️', desc: 'Install version block bypass', cmd: 'pm install -r -d', requiresInput: true, inputLabel: 'Absolute APK Path (/storage/emulated/0/... )', disclaimer: 'Requires root. Bypasses Android version restrictions to force-install older APK variants.' },
    { id: 'terminal', title: 'Raw Local Terminal', icon: '💻', desc: 'Execute arbitrary commands', cmd: '', requiresInput: true, inputLabel: 'Shell Command', disclaimer: 'Warning: Direct access to the underlying shell. Commands execute as root if Shizuku is linked.' }
  ];

  const currentList = activeTab === 'NETWORK' ? networkModules : sysopsModules;

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-32 select-none font-sans text-white min-h-screen relative z-10 animate-fadeIn">
      
      {!activeModule ? (
        <>
          <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <span className="text-3xl text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">⚡</span> NetSec & SysOps Hub
            </h2>
            <p className="text-xs text-zinc-400 mt-2">Unified dashboard for network diagnostics and native shell administration.</p>
          </div>

          <div className={`p-4 rounded-3xl flex justify-between items-center shadow-xl ${shizukuGranted ? 'bg-emerald-950/30 border border-emerald-900/50' : 'bg-red-950/30 border border-red-900/50'}`}>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Shizuku Shell Bridge</h4>
              <p className="text-[10px] font-mono text-zinc-400 mt-0.5">Elevated privilege broker</p>
            </div>
            <span className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow ${shizukuGranted ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
              {shizukuGranted ? 'LINKED' : 'OFFLINE'}
            </span>
          </div>

          <div className="flex gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 shrink-0 shadow-inner">
            <button onClick={() => setActiveTab('NETWORK')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === 'NETWORK' ? 'bg-cyan-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}>
              Network Security
            </button>
            <button onClick={() => setActiveTab('SYSOPS')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === 'SYSOPS' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}>
              SysOps Modules
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 animate-fadeIn">
            {currentList.map(mod => (
              <button 
                key={mod.id} 
                onClick={() => { setActiveModule(mod); setModuleLog(`> Module [${mod.title}] Initialized.\n`); setModuleInput(''); }} 
                className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-3xl flex flex-col items-start gap-2 active:scale-95 transition-transform hover:border-amber-500/50 shadow text-left"
              >
                <span className="text-2xl opacity-80">{mod.icon}</span>
                <div>
                  <span className="text-[11px] font-bold text-white block">{mod.title}</span>
                  <span className="text-[9px] font-mono text-zinc-500">{mod.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        /* DEDICATED MODULE VIEW */
        <div className="space-y-4 animate-fadeIn flex flex-col h-[85vh]">
          <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
             <div className="flex items-center gap-3">
                <span className="text-4xl">{activeModule.icon}</span>
                <div>
                   <h3 className="text-xl font-black text-white">{activeModule.title}</h3>
                   <span className="text-[10px] font-mono text-amber-500 bg-amber-900/30 px-2 py-0.5 rounded border border-amber-900/50">
                      {shizukuGranted ? 'ROOT CONTEXT' : 'USER CONTEXT'}
                   </span>
                </div>
             </div>
             <button onClick={() => setActiveModule(null)} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-sm font-bold border border-zinc-700 active:scale-95 text-zinc-400">
               ✕
             </button>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl shadow-inner">
             <h4 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Module Disclaimer</h4>
             <p className="text-[10px] text-zinc-400 leading-relaxed">{activeModule.disclaimer}</p>
          </div>

          {activeModule.requiresInput && (
             <form onSubmit={executeModule} className="flex gap-2">
                <input 
                  type="text" 
                  value={moduleInput} 
                  onChange={(e) => setModuleInput(e.target.value)} 
                  placeholder={activeModule.inputLabel} 
                  className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500" 
                  autoFocus 
                />
             </form>
          )}

          <button onClick={executeModule} className="w-full py-4 bg-amber-600 text-black font-black text-xs uppercase tracking-widest rounded-xl active:scale-95 shadow-[0_0_15px_rgba(217,119,6,0.3)] transition-all shrink-0">
             Execute Module Sequence
          </button>

          <div className="flex-1 bg-black border border-zinc-800 rounded-3xl p-4 overflow-y-auto font-mono text-[9px] text-amber-400 whitespace-pre-wrap shadow-inner relative">
             {moduleLog}
          </div>
        </div>
      )}
    </div>
  );
}
