import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';

const ShizukuRunner = registerPlugin('ShizukuRunner');

export function Debloat({ onNavigate }) {
  const [shizukuState, setShizukuState] = useState({ active: false, granted: false });
  const [executingId, setExecutingId] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  
  const [packages, setPackages] = useState([
    { id: 1, name: 'com.samsung.android.bixby.wakeup', status: 'Active', category: 'BLOATWARE', risk: 'HIGH', cmd: 'pm uninstall -k --user 0 com.samsung.android.bixby.wakeup' },
    { id: 2, name: 'com.sec.android.app.samsungapps', status: 'Active', category: 'STORE', risk: 'MEDIUM', cmd: 'pm uninstall -k --user 0 com.sec.android.app.samsungapps' },
    { id: 3, name: 'com.facebook.services', status: 'Active', category: 'TRACKER', risk: 'HIGH', cmd: 'pm uninstall -k --user 0 com.facebook.services' },
    { id: 4, name: 'com.microsoft.office.outlook', status: 'Active', category: 'BLOATWARE', risk: 'LOW', cmd: 'pm uninstall -k --user 0 com.microsoft.office.outlook' }
  ]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { checkShizuku(); }, []);

  const checkShizuku = async () => {
    try {
      const res = await ShizukuRunner.checkStatus();
      setShizukuState({ active: res.active, granted: res.granted });
    } catch (e) {
      setShizukuState({ active: false, granted: false });
    }
  };

  const executeNeutralize = async (pkg) => {
    if (!shizukuState.active || !shizukuState.granted) {
      alert("Shizuku is not running or permission was denied. Start the Shizuku app via Wireless Debugging first.");
      return;
    }
    setExecutingId(pkg.id);
    try {
      const res = await ShizukuRunner.executeCommand({ command: pkg.cmd });
      if (res.success) {
        setPackages(packages.map(p => p.id === pkg.id ? { ...p, status: 'Neutralized' } : p));
        alert(`${pkg.name} has been neutralized.`);
      }
    } catch (e) {
      alert(`Execution Failed: ${e.message}`);
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen flex flex-col animate-fadeIn relative z-10">
      
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-2xl font-black text-white flex items-center gap-3"><span className="text-3xl text-amber-500">⚡</span> System Debloater</h2>
        <p className="text-xs text-zinc-400 mt-2">Isolate and neutralize background telemetry packages.</p>
      </div>

      <div className={`p-4 rounded-2xl border flex justify-between items-center shadow-inner shrink-0 ${shizukuState.granted ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-red-950/20 border-red-900/50'}`}>
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest">Shizuku Bridge</h4>
          <p className="text-[9px] font-mono mt-1 text-zinc-400">Native Shell Privilege Broker</p>
        </div>
        <button onClick={checkShizuku} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow ${shizukuState.granted ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
          {shizukuState.granted ? 'CONNECTED' : 'OFFLINE'}
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pt-2">
        {packages.map(pkg => (
          <div key={pkg.id} className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl overflow-hidden shadow-lg transition-all">
            <div className="p-5 flex justify-between items-center cursor-pointer hover:bg-zinc-800" onClick={() => setExpandedId(expandedId === pkg.id ? null : pkg.id)}>
              <div className="overflow-hidden pr-4">
                <h4 className={`text-[13px] font-mono font-bold truncate ${pkg.status === 'Neutralized' ? 'text-zinc-600 line-through' : 'text-white'}`}>{pkg.name}</h4>
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-2 block">{pkg.category}</span>
              </div>
              <span className={`shrink-0 px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold border transition-colors ${pkg.status === 'Active' ? 'bg-amber-950/40 border-amber-900/50 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                {pkg.status}
              </span>
            </div>
            
            {expandedId === pkg.id && pkg.status === 'Active' && (
              <div className="p-5 bg-black/60 border-t border-zinc-800 space-y-4 animate-fadeIn shadow-inner">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Risk Level:</span>
                   <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border ${pkg.risk === 'HIGH' ? 'bg-red-950/50 text-red-400 border-red-900' : pkg.risk === 'MEDIUM' ? 'bg-amber-950/50 text-amber-400 border-amber-900' : 'bg-emerald-950/50 text-emerald-400 border-emerald-900'}`}>{pkg.risk}</span>
                </div>
                
                <button onClick={() => executeNeutralize(pkg)} disabled={executingId === pkg.id || !shizukuState.granted} className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                  {executingId === pkg.id ? 'EXECUTING...' : '🔥 NUKE VIA SHIZUKU'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="shrink-0 mt-4 bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl shadow-xl space-y-3">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowDisclaimer(!showDisclaimer)}>
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <span>ℹ️</span> Shizuku Bridge & Security Disclaimers
          </h4>
          <span className="text-zinc-500 text-xs">{showDisclaimer ? '▼' : '▶'}</span>
        </div>
        
        {showDisclaimer && (
          <div className="space-y-3 animate-fadeIn pt-2 border-t border-zinc-800/50">
            <p className="text-[10px] text-zinc-300 font-mono leading-relaxed text-justify">
              <strong className="text-emerald-400">What is Shizuku?</strong> It is a background service that safely leverages Android's built-in Wireless Debugging protocol to grant Sovereign Tools elevated ADB (shell) permissions, entirely bypassing the need for a PC or root access.
            </p>
            <p className="text-[10px] text-zinc-300 font-mono leading-relaxed text-justify">
              <strong className="text-amber-400">How it Works:</strong> When connected, Sovereign Tools can execute direct system commands (like un-provisioning bloatware for user 0) directly on the hardware. Packages neutralized via this method are instantly stripped of background processing rights and permanently halt telemetry.
            </p>
            <p className="text-[10px] text-zinc-300 font-mono leading-relaxed text-justify">
              <strong className="text-red-400">Security Warning:</strong> Leaving Wireless Debugging active indefinitely creates a local attack vector on untrusted networks. It is highly recommended to disable "Wireless Debugging" in Android Developer Options once you have finished neutralizing target packages.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
