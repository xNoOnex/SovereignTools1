import React, { useState } from 'react';

export function SystemDebloater({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL RISKS');
  const [copiedCmd, setCopiedCmd] = useState('');

  // Bloatware Package Database
  const packages = [
    {
      name: 'Bixby Voice & Agent',
      id: 'com.samsung.android.bixby.agent',
      brand: 'Samsung',
      risk: 'SAFE',
      description: 'Samsung voice assistant background listener. Safe to remove if using local AI or alternative assistants.'
    },
    {
      name: 'Samsung Pay Framework',
      id: 'com.samsung.android.spay',
      brand: 'Samsung',
      risk: 'SAFE',
      description: 'Samsung proprietary payment framework and background telemetry sync.'
    },
    {
      name: 'Android Settings Host',
      id: 'com.android.settings',
      brand: 'Google',
      risk: 'HIGH RISK',
      description: 'Main system settings menu. CRITICAL: DO NOT REMOVE.'
    },
    {
      name: 'Google Play Services',
      id: 'com.google.android.gms',
      brand: 'Google',
      risk: 'CAUTION',
      description: 'Core Google services framework. Disabling breaks Play Store apps and push notifications.'
    },
    {
      name: 'Meta App Installer & Services',
      id: 'com.facebook.system',
      brand: 'Meta',
      risk: 'SAFE',
      description: 'Pre-installed Facebook background app manager and update tracker.'
    },
    {
      name: 'Microsoft OneDrive Sync',
      id: 'com.microsoft.skydrive',
      brand: 'Microsoft',
      risk: 'SAFE',
      description: 'Microsoft cloud gallery backup daemon. Safe to remove.'
    }
  ];

  const copyCommand = (type, pkgId) => {
    let cmd = '';
    if (type === 'disable') {
      cmd = `adb shell pm disable-user --user 0 ${pkgId}`;
    } else {
      cmd = `adb shell pm uninstall -k --user 0 ${pkgId}`;
    }

    navigator.clipboard.writeText(cmd);
    setCopiedCmd(`${type === 'disable' ? 'Disable' : 'Uninstall'} command for ${pkgId}`);
    setTimeout(() => setCopiedCmd(''), 3000);
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pkg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pkg.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = brandFilter === 'ALL' || pkg.brand === brandFilter;
    const matchesRisk = riskFilter === 'ALL RISKS' || pkg.risk === riskFilter.replace('🟢 ', '').replace('🟠 ', '').replace('🔴 ', '');
    return matchesSearch && matchesBrand && matchesRisk;
  });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* HEADER */}
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          ⚡ System Package & Debloat Inspector
        </h2>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          Inspect Android package risk levels, review background descriptions, and copy clean terminal strings.
        </p>
      </div>

      {/* TOAST NOTIFICATION */}
      {copiedCmd && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg animate-fadeIn">
          📋 Copied {copiedCmd} to clipboard!
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="bg-black border border-zinc-800 rounded-2xl px-3 py-2.5 flex items-center gap-2">
        <span className="text-xs text-zinc-500">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search package name, ID, or keyword (e.g. bixby, te..."
          className="w-full bg-transparent text-xs text-white font-mono focus:outline-none placeholder-zinc-600"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-zinc-500 font-bold">✕</button>
        )}
      </div>

      {/* BRAND FILTER PILLS */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {['ALL', 'Samsung', 'Google', 'Meta', 'Microsoft'].map(b => (
          <button
            key={b}
            onClick={() => setBrandFilter(b)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              brandFilter === b
                ? 'bg-cyan-500 text-black shadow'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* RISK LEVEL FILTER PILLS */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {[
          { label: 'ALL RISKS', color: 'bg-zinc-900 text-zinc-300' },
          { label: '🟢 SAFE', color: 'bg-emerald-950/80 text-emerald-400 border-emerald-800' },
          { label: '🟠 CAUTION', color: 'bg-amber-950/80 text-amber-400 border-amber-800' },
          { label: '🔴 HIGH RISK', color: 'bg-red-950/80 text-red-400 border-red-800' }
        ].map(r => (
          <button
            key={r.label}
            onClick={() => setRiskFilter(r.label)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 ${
              riskFilter === r.label
                ? 'bg-cyan-500 text-black border-cyan-400 font-extrabold shadow'
                : `${r.color} border-zinc-800`
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* PACKAGE LIST CARDS */}
      <div className="space-y-3">
        {filteredPackages.length === 0 ? (
          <div className="bg-zinc-900/60 p-8 text-center text-xs text-zinc-500 font-mono rounded-3xl border border-zinc-800">
            No system packages match current filters.
          </div>
        ) : (
          filteredPackages.map((pkg) => {
            let badgeBg = 'bg-emerald-950 border-emerald-600 text-emerald-400';
            if (pkg.risk === 'CAUTION') badgeBg = 'bg-amber-950 border-amber-600 text-amber-400';
            if (pkg.risk === 'HIGH RISK') badgeBg = 'bg-red-950 border-red-600 text-red-400';

            return (
              <div key={pkg.id} className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-white">{pkg.name}</h3>
                    <p className="text-[10px] font-mono text-cyan-400 mt-0.5">{pkg.id}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border font-mono ${badgeBg}`}>
                    {pkg.risk === 'SAFE' && '🟢 '}
                    {pkg.risk === 'CAUTION' && '🟠 '}
                    {pkg.risk === 'HIGH RISK' && '🔴 '}
                    {pkg.risk}
                  </span>
                </div>

                <div className="bg-black p-3 rounded-2xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed font-sans">
                  {pkg.description}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => copyCommand('disable', pkg.id)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold py-2 px-2 rounded-xl border border-zinc-700 truncate"
                  >
                    🚫 Copy Disable Co...
                  </button>
                  <button
                    onClick={() => copyCommand('uninstall', pkg.id)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-[10px] font-bold py-2 px-2 rounded-xl border border-zinc-700 truncate"
                  >
                    🗑️ Copy Uninstall ...
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER & DISCLAIMER */}
      <div className="space-y-2 pt-2">
        <p className="text-[10px] text-zinc-400 flex items-start gap-1.5 px-1 leading-relaxed">
          <span className="text-cyan-400">ℹ️</span>
          <span>
            <strong>About Package & Debloat Inspector:</strong> Provides risk assessments, package IDs, and descriptions for Android system bloatware. Formats reversible disable commands and full removal commands for execution in Termux, Shizuku, or ADB.
          </span>
        </p>

        <div className="bg-amber-950/40 border border-amber-600/30 p-3 rounded-2xl text-[10px] text-amber-300 space-y-1">
          <p className="font-bold flex items-center gap-1 text-amber-400">
            <span>⚠️</span> Disclaimer: Always prefer disabling packages over uninstalling them first. Never disable or uninstall packages flagged as HIGH RISK.
          </p>
        </div>
      </div>

    </div>
  );
}
