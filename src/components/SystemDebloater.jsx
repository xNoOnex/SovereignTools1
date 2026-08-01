import React, { useState } from 'react';

export function SystemDebloater() {
  const [packages, setPackages] = useState([
    { name: 'com.google.android.gms.location', label: 'Google Location Telemetry', active: true },
    { name: 'com.facebook.system', label: 'Meta App Installer Service', active: true },
    { name: 'com.samsung.android.analytics', label: 'Analytics Diagnostics Tracker', active: true }
  ]);

  const togglePackage = (pkgName) => {
    setPackages(packages.map(p => p.name === pkgName ? { ...p, active: !p.active } : p));
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">⚡ System Debloater</h2>
        <p className="text-xs text-zinc-400 mt-1">Local process manager & background service controls.</p>
      </div>

      <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-3">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Detected Background Telemetry Services</h3>
        <div className="space-y-2">
          {packages.map((pkg, i) => (
            <div key={i} className="bg-black/60 p-3 rounded-2xl border border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">{pkg.label}</p>
                <p className="text-[9px] text-zinc-500 font-mono">{pkg.name}</p>
              </div>
              <button
                onClick={() => togglePackage(pkg.name)}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg ${
                  pkg.active ? 'bg-red-600/80 text-white' : 'bg-emerald-600/80 text-white'
                }`}
              >
                {pkg.active ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
