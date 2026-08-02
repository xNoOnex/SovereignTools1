import React, { useState } from 'react';

export function Debloat({ onNavigate }) {
  const [packages, setPackages] = useState([
    { id: 1, name: 'com.samsung.android.bixby.wakeup', status: 'Active', category: 'Telemetry', risk: 'HIGH', desc: 'Bixby voice wake-up service. Constantly listens to microphone inputs for voice activation.', cmd: 'adb shell pm uninstall -k --user 0 com.samsung.android.bixby.wakeup' },
    { id: 2, name: 'com.sec.android.app.samsungapps', status: 'Active', category: 'Store', risk: 'MEDIUM', desc: 'Samsung Galaxy Store. Executes background metrics and forced update telemetry pings.', cmd: 'adb shell pm uninstall -k --user 0 com.sec.android.app.samsungapps' },
    { id: 3, name: 'com.facebook.services', status: 'Active', category: 'Tracker', risk: 'HIGH', desc: 'Facebook background system service. Harvests cross-app usage data regardless of account status.', cmd: 'adb shell pm uninstall -k --user 0 com.facebook.services' },
    { id: 4, name: 'com.microsoft.office.outlook', status: 'Active', category: 'Bloatware', risk: 'LOW', desc: 'Pre-installed Microsoft Outlook mail client telemetry and background sync services.', cmd: 'adb shell pm uninstall -k --user 0 com.microsoft.office.outlook' }
  ]);
  const [expandedId, setExpandedId] = useState(null);

  const togglePackage = (id) => {
    setPackages(packages.map(p => p.id === id ? { ...p, status: p.status === 'Active' ? 'Disabled' : 'Active' } : p));
  };

  const copyCommand = (cmd) => {
    navigator.clipboard.writeText(cmd);
    alert('ADB Command Copied to Clipboard!');
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen flex flex-col animate-fadeIn">
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">⚡ System Debloater</h2>
        <p className="text-xs text-zinc-400 mt-1">Isolate and neutralize background telemetry packages.</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {packages.map(pkg => (
          <div key={pkg.id} className="bg-zinc-950/80 backdrop-blur border border-zinc-800 rounded-2xl overflow-hidden transition-all shadow-md">
            <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-zinc-900/50" onClick={() => setExpandedId(expandedId === pkg.id ? null : pkg.id)}>
              <div className="overflow-hidden pr-3">
                <h4 className="text-xs font-mono font-bold text-white truncate">{pkg.name}</h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-widest bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{pkg.category}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${pkg.risk === 'HIGH' ? 'bg-red-950/50 text-red-400 border-red-900/50' : pkg.risk === 'MEDIUM' ? 'bg-amber-950/50 text-amber-400 border-amber-900/50' : 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50'}`}>
                    {pkg.risk} RISK
                  </span>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); togglePackage(pkg.id); }} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-widest font-bold border transition-colors ${pkg.status === 'Active' ? 'bg-red-950/40 border-red-900 text-red-400' : 'bg-emerald-950/40 border-emerald-900 text-emerald-400'}`}>
                {pkg.status}
              </button>
            </div>
            
            {expandedId === pkg.id && (
              <div className="p-4 bg-black/60 border-t border-zinc-900 space-y-3 animate-fadeIn">
                <p className="text-[10px] text-zinc-300 font-mono leading-relaxed">{pkg.desc}</p>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">ADB Removal Command:</span>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={pkg.cmd} className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[9px] text-emerald-400 font-mono focus:outline-none" />
                    <button onClick={() => copyCommand(pkg.cmd)} className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-[10px] font-bold border border-zinc-700 active:scale-95 shadow">Copy</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="shrink-0 mt-4 bg-zinc-900/50 backdrop-blur border border-zinc-800 p-4 rounded-3xl shadow-lg">
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1"><span>ℹ️</span> Module Info & Disclaimers</h4>
        <p className="text-[9px] text-zinc-500 font-mono leading-relaxed text-justify">
          The Debloater module provides ADB shell commands to safely un-provision carrier and OEM bloatware for user 0 without requiring root access. Running these commands permanently halts telemetry from the targeted packages. Ensure USB Debugging is disabled after executing commands via local terminal to prevent unauthorized physical access.
        </p>
      </div>
    </div>
  );
}
