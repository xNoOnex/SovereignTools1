import React, { useState } from 'react';

export function Debloat({ onNavigate }) {
  const [packages, setPackages] = useState([
    { id: 1, name: 'com.samsung.android.bixby.wakeup', status: 'Active', category: 'Bloatware' },
    { id: 2, name: 'com.sec.android.app.samsungapps', status: 'Active', category: 'Store' },
    { id: 3, name: 'com.facebook.services', status: 'Active', category: 'Tracker' },
    { id: 4, name: 'com.microsoft.office.outlook', status: 'Active', category: 'Bloatware' }
  ]);

  const togglePackage = (id) => {
    setPackages(packages.map(p => p.id === id ? { ...p, status: p.status === 'Active' ? 'Disabled' : 'Active' } : p));
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen flex flex-col">
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">⚡ System Debloater</h2>
        <p className="text-xs text-zinc-400 mt-1">Isolate and neutralize background telemetry packages.</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {packages.map(pkg => (
          <div key={pkg.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <h4 className="text-xs font-mono font-bold text-white truncate">{pkg.name}</h4>
              <span className="text-[9px] text-zinc-500 font-mono uppercase">{pkg.category}</span>
            </div>
            <button 
              onClick={() => togglePackage(pkg.id)} 
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${pkg.status === 'Active' ? 'bg-red-950/40 border-red-900 text-red-400' : 'bg-emerald-950/40 border-emerald-900 text-emerald-400'}`}
            >
              {pkg.status}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
