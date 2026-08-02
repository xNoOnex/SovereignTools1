import React, { useState } from 'react';

export function Debloat({ onNavigate }) {
  const [packages, setPackages] = useState([
    { id: 1, name: 'com.samsung.android.bixby.wakeup', status: 'Active', category: 'BLOATWARE', risk: 'HIGH', cmd: 'adb shell pm uninstall -k --user 0 com.samsung.android.bixby.wakeup' },
    { id: 2, name: 'com.sec.android.app.samsungapps', status: 'Active', category: 'STORE', risk: 'MEDIUM', cmd: 'adb shell pm uninstall -k --user 0 com.sec.android.app.samsungapps' },
    { id: 3, name: 'com.facebook.services', status: 'Active', category: 'TRACKER', risk: 'HIGH', cmd: 'adb shell pm uninstall -k --user 0 com.facebook.services' },
    { id: 4, name: 'com.microsoft.office.outlook', status: 'Active', category: 'BLOATWARE', risk: 'LOW', cmd: 'adb shell pm uninstall -k --user 0 com.microsoft.office.outlook' }
  ]);
  const [expandedId, setExpandedId] = useState(null);

  const togglePackage = (id) => {
    setPackages(packages.map(p => p.id === id ? { ...p, status: p.status === 'Active' ? 'Disabled' : 'Active' } : p));
  };

  const copyCommand = (cmd) => {
    navigator.clipboard.writeText(cmd);
    alert('ADB Command Copied!');
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen flex flex-col animate-fadeIn relative z-10">
      
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-2xl font-black text-white flex items-center gap-3"><span className="text-3xl text-amber-500">⚡</span> System Debloater</h2>
        <p className="text-xs text-zinc-400 mt-2">Isolate and neutralize background telemetry packages.</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pt-2">
        {packages.map(pkg => (
          <div key={pkg.id} className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl overflow-hidden shadow-lg transition-all">
            
            {/* Exactly matching the 5638.jpg layout */}
            <div className="p-5 flex justify-between items-center cursor-pointer hover:bg-zinc-800" onClick={() => setExpandedId(expandedId === pkg.id ? null : pkg.id)}>
              <div className="overflow-hidden pr-4">
                <h4 className="text-[13px] font-mono font-bold text-white truncate">{pkg.name}</h4>
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-2 block">{pkg.category}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); togglePackage(pkg.id); }} className={`shrink-0 px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold border transition-colors ${pkg.status === 'Active' ? 'bg-red-950/40 border-red-900/50 text-red-400' : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400'}`}>
                {pkg.status}
              </button>
            </div>
            
            {/* The hidden ADB info block */}
            {expandedId === pkg.id && (
              <div className="p-5 bg-black/60 border-t border-zinc-800 space-y-4 animate-fadeIn shadow-inner">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Risk Level:</span>
                   <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border ${pkg.risk === 'HIGH' ? 'bg-red-950/50 text-red-400 border-red-900' : pkg.risk === 'MEDIUM' ? 'bg-amber-950/50 text-amber-400 border-amber-900' : 'bg-emerald-950/50 text-emerald-400 border-emerald-900'}`}>{pkg.risk}</span>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ADB Removal Command:</span>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={pkg.cmd} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-[10px] text-emerald-400 font-mono focus:outline-none shadow-inner" />
                    <button onClick={() => copyCommand(pkg.cmd)} className="bg-zinc-800 text-white px-5 py-3 rounded-xl text-[10px] uppercase font-bold border border-zinc-600 active:scale-95 shadow">Copy</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

      <div className="shrink-0 mt-4 bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl shadow-xl">
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span>ℹ️</span> Module Info & Disclaimers</h4>
        <p className="text-[10px] text-zinc-500 font-mono leading-relaxed text-justify">
          The Debloater provides ADB shell commands to un-provision OEM bloatware for user 0 without root. Running these permanently halts telemetry. Ensure USB Debugging is disabled after executing commands via terminal to prevent unauthorized physical access.
        </p>
      </div>

    </div>
  );
}
