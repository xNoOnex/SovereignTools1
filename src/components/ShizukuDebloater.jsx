import React, { useState } from 'react';
import { ToolFooter } from './ToolFooter';

const COMMON_PACKAGES = [
  { name: 'Facebook App Installer', packageId: 'com.facebook.system', risk: 'SAFE', description: 'Background Meta service. Safe to remove.' },
  { name: 'Facebook App Manager', packageId: 'com.facebook.appmanager', risk: 'SAFE', description: 'Background update daemon for Meta.' },
  { name: 'Bixby Voice / Agent', packageId: 'com.samsung.android.bixby.agent', risk: 'SAFE', description: 'Samsung voice assistant agent.' },
  { name: 'Google Duo / Meet', packageId: 'com.google.android.apps.tachyon', risk: 'SAFE', description: 'Pre-installed video call client.' },
  { name: 'Stock Gallery App', packageId: 'com.sec.android.gallery3d', risk: 'CAUTION', description: 'Default viewer. Install alternative first.' },
  { name: 'Package Installer', packageId: 'com.google.android.packageinstaller', risk: 'HIGH_RISK', description: 'Core framework for APKs. DO NOT REMOVE.' }
];

export function ShizukuDebloater() {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  const filtered = COMMON_PACKAGES.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.packageId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyCmd = (pkgId) => {
    const cmd = `adb shell pm uninstall -k --user 0 ${pkgId}`;
    navigator.clipboard.writeText(cmd);
    setCopiedCode(pkgId);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24 select-none">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white">⚡ Shizuku & ADB Package Debloater</h2>
        <p className="text-xs text-zinc-400 mt-1">Look up bloatware package names and generate safe removal shell commands.</p>
      </div>

      <input
        type="text"
        placeholder="Search app or package (e.g. bixby, facebook)..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
      />

      <div className="space-y-3">
        {filtered.map(pkg => (
          <div key={pkg.packageId} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-white">{pkg.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                pkg.risk === 'SAFE' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
              }`}>{pkg.risk}</span>
            </div>
            <p className="text-[11px] font-mono text-zinc-400">{pkg.packageId}</p>
            <button
              onClick={() => copyCmd(pkg.packageId)}
              className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-[10px] rounded font-bold"
            >
              {copiedCode === pkg.packageId ? '✓ Command Copied!' : `📋 adb shell pm uninstall -k --user 0 ${pkg.packageId}`}
            </button>
          </div>
        ))}
      </div>

      <ToolFooter
        title="Shizuku & ADB Debloater"
        details="Generates non-root user removal strings executed via Shizuku shell or local ADB terminal connection."
        disclaimer="Uninstalling HIGH RISK core OS packages can break system UI stability or require a factory reset."
      />
    </div>
  );
}
