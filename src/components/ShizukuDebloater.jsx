import React, { useState } from 'react';
import { ToolFooter } from './ToolFooter';

// Catalog of common Android/OEM packages with risk ratings
const COMMON_PACKAGES = [
  {
    name: 'Facebook App Installer',
    packageId: 'com.facebook.system',
    risk: 'SAFE',
    category: 'Bloatware / Telemetry',
    description: 'Background installer for Facebook services. Zero impact on core system if removed.'
  },
  {
    name: 'Facebook App Manager',
    packageId: 'com.facebook.appmanager',
    risk: 'SAFE',
    category: 'Bloatware / Telemetry',
    description: 'Background updates for Meta apps. Safe to purge.'
  },
  {
    name: 'Bixby Voice / Agent',
    packageId: 'com.samsung.android.bixby.agent',
    risk: 'SAFE',
    category: 'OEM Assistant',
    description: 'Samsung voice assistant agent. Safe to remove if using local AI or alternative tools.'
  },
  {
    name: 'Google Duo / Meet',
    packageId: 'com.google.android.apps.tachyon',
    risk: 'SAFE',
    category: 'Pre-installed App',
    description: 'Pre-installed video call client. Safe to remove.'
  },
  {
    name: 'Samsung Internet Browser',
    packageId: 'com.sec.android.app.sbrowser',
    risk: 'CAUTION',
    category: 'System Browser',
    description: 'Default browser. Safe if you use Brave/Firefox, but ensure another browser is installed first!'
  },
  {
    name: 'Stock Gallery App',
    packageId: 'com.sec.android.gallery3d',
    risk: 'CAUTION',
    category: 'Media Handler',
    description: 'Default media viewer. Installing an open-source gallery alternative is recommended before removal.'
  },
  {
    name: 'Android System UI',
    packageId: 'com.android.systemui',
    risk: 'HIGH_RISK',
    category: 'Core OS',
    description: 'Handles navigation bar, status bar, and home screen rendering. CRITICAL: DO NOT REMOVE.'
  },
  {
    name: 'Package Installer',
    packageId: 'com.google.android.packageinstaller',
    risk: 'HIGH_RISK',
    category: 'Core Framework',
    description: 'Responsible for installing .apk files on Android. DO NOT REMOVE.'
  }
];

export function ShizukuDebloater() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [copiedCode, setCopiedCode] = useState(null);

  // Filter packages based on search and risk filter
  const filteredPackages = COMMON_PACKAGES.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          pkg.packageId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = selectedFilter === 'ALL' || pkg.risk === selectedFilter;
    return matchesSearch && matchesRisk;
  });

  // Generate ADB / Shizuku shell command
  const getDebloatCommand = (packageId) => {
    return `adb shell pm uninstall -k --user 0 ${packageId}`;
  };

  const copyToClipboard = (cmd, packageId) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCode(packageId);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          ⚡ Shizuku Package Inspector & Debloater
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Look up system package names, assess removal risk, and generate clean removal strings.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search app name or package ID (e.g. bixby, facebook)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Risk Filter Buttons */}
      <div className="flex gap-2 text-xs font-bold">
        {['ALL', 'SAFE', 'CAUTION', 'HIGH_RISK'].map(risk => (
          <button
            key={risk}
            onClick={() => setSelectedFilter(risk)}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedFilter === risk 
                ? 'bg-zinc-100 text-black' 
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {risk === 'ALL' ? 'ALL' : risk === 'SAFE' ? '🟢 SAFE' : risk === 'CAUTION' ? '🟡 CAUTION' : '🔴 HIGH RISK'}
          </button>
        ))}
      </div>

      {/* Package List */}
      <div className="space-y-3 mt-4">
        {filteredPackages.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">
            No matching packages found in database.
          </div>
        ) : (
          filteredPackages.map((pkg) => {
            const command = getDebloatCommand(pkg.packageId);
            const isCopied = copiedCode === pkg.packageId;

            return (
              <div 
                key={pkg.packageId}
                className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-4 space-y-3"
              >
                {/* Title & Risk Badge */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm">{pkg.name}</h3>
                    <p className="text-xs font-mono text-zinc-400">{pkg.packageId}</p>
                  </div>
                  
                  {/* Risk Badge */}
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    pkg.risk === 'SAFE' 
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50' 
                      : pkg.risk === 'CAUTION' 
                      ? 'bg-amber-950/60 text-amber-400 border-amber-800/50' 
                      : 'bg-red-950/60 text-red-400 border-red-800/50'
                  }`}>
                    {pkg.risk === 'SAFE' ? '🟢 SAFE TO REMOVE' : pkg.risk === 'CAUTION' ? '🟡 CAUTION' : '🔴 HIGH RISK'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-300 bg-black/40 p-2 rounded border border-zinc-800/50">
                  {pkg.description}
                </p>

                {/* Command & Copy Box */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Debloat Shell Command
                  </label>
                  <div className="flex items-center justify-between bg-black rounded p-2 border border-zinc-800 text-xs font-mono text-emerald-400">
                    <span className="truncate pr-2">{command}</span>
                    <button
                      onClick={() => copyToClipboard(command, pkg.packageId)}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[10px] font-sans font-bold whitespace-nowrap"
                    >
                      {isCopied ? '✓ Copied!' : '📋 Copy Code'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tool Footer */}
      <ToolFooter
        title="Shizuku Debloater & Package Inspector"
        details="Provides risk-classified package details and formats execution strings for Shizuku or local ADB shells without requiring full root access."
        disclaimer="Removing packages classified as HIGH RISK can break Android system capabilities or cause boot failures. Always verify target package functions before executing uninstall commands."
      />

    </div>
  );
}
