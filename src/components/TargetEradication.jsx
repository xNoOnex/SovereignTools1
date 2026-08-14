import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';
const ShizukuRunner = registerPlugin('ShizukuRunner');

export function TargetEradication({ onNavigate }) {
  const [query, setQuery] = useState('');
  const [packages, setPackages] = useState([]);
  const [logs, setLogs] = useState(['> System Registry Scanner Initialized.']);
  const [showInfo, setShowInfo] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);

  const addLog = (msg) => {
    setLogs(prev => {
        const newLogs = [...prev, msg];
        // Keep terminal clean by only showing last 15 lines
        if (newLogs.length > 15) return newLogs.slice(newLogs.length - 15);
        return newLogs;
    });
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      addLog('> Fetching package states via Shizuku...');
      const res = await ShizukuRunner.execute({ command: 'pm list packages' });
      
      let parsed = [];
      // Bulletproof parsing: Handle different potential Android line breaks and remove 'package:' prefixes
      if (res && res.output) {
         parsed = res.output.split(/\r?\n/).map(p => p.replace('package:', '').trim()).filter(Boolean);
      } else if (typeof res === 'string') {
         parsed = res.split(/\r?\n/).map(p => p.replace('package:', '').trim()).filter(Boolean);
      }
      
      if (parsed.length > 0) {
        setPackages(parsed);
        addLog(`> Successfully mapped ${parsed.length} packages.`);
      } else {
        addLog('> WARNING: 0 packages mapped. Shizuku may lack permissions.');
      }
    } catch (e) {
      addLog(`> STDERR: ${e.message}`);
    }
  };

  const handleEradicate = async (pkg) => {
    addLog(`> Initiating Eradication Protocol for: ${pkg}`);
    try {
      // Step 1: Wipe all stored user data and cache
      addLog(`> Executing: pm clear ${pkg}`);
      await ShizukuRunner.execute({ command: `pm clear ${pkg}` });
      
      // Step 2: Freeze the app state at the kernel level
      addLog(`> Executing: pm disable-user --user 0 ${pkg}`);
      await ShizukuRunner.execute({ command: `pm disable-user --user 0 ${pkg}` });
      
      // Step 3: Rip it out of the visible registry and launcher
      addLog(`> Executing: pm hide ${pkg}`);
      await ShizukuRunner.execute({ command: `pm hide ${pkg}` });
      
      addLog(`> ✅ TARGET NEUTRALIZED: ${pkg}`);
      
      // Remove it from the active UI list
      setPackages(prev => prev.filter(p => p !== pkg));
      setSelectedPkg(null);
    } catch (e) {
      addLog(`> ❌ ERADICATION FAILED: ${e.message}`);
    }
  };

  // Safe substring matching (ignores case)
  const filtered = packages.filter(p => {
    if (!p) return false;
    return p.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-black text-zinc-300 animate-fadeIn relative p-4">
       
       <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-amber-900/30 p-2 rounded-full border border-amber-500/50 text-amber-500 text-2xl">☣️</div>
             <div>
                <h2 className="text-xl font-black text-amber-500 uppercase tracking-widest">Target Eradication</h2>
                <span className="text-[10px] font-bold text-amber-600 border border-amber-900 px-2 py-0.5 rounded-sm">ROOT CONTEXT</span>
             </div>
          </div>
          <button onClick={() => onNavigate('home')} className="bg-zinc-900 border border-zinc-700 w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 font-bold active:scale-95 transition-all">✕</button>
       </div>

       <div className="mt-4 flex flex-col gap-2 shrink-0">
          <button onClick={() => setShowInfo(!showInfo)} className="w-full flex items-center justify-between p-3 bg-cyan-900/10 border border-cyan-900/30 rounded-lg active:scale-95 transition-all">
             <span className="text-xs font-black text-cyan-500 tracking-widest uppercase">Info & Warnings</span>
             <span className="text-cyan-600 text-xs">{showInfo ? '▲' : '▼'}</span>
          </button>
          
          {showInfo && (
            <div className="p-4 border border-zinc-800 rounded-lg text-xs font-mono leading-relaxed text-zinc-400 bg-zinc-900/30 animate-fadeIn">
               <p className="mb-4">Scans the system registry to map all installed packages. Allows you to safely disable telemetry daemons or permanently eradicate bloatware using Shizuku privileges.</p>
               <p className="mb-4 text-amber-500">NOTE: Due to a Samsung OneUI 6 AppOps bug, standard uninstalls via Shizuku UID 2000 crash with a NullPointerException. The ERADICATE button now executes a custom bypass that forcefully clears data, disables, and completely hides the target package from the system registry instead.</p>
               <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-500">
                  <span className="font-black tracking-widest uppercase block mb-2">⚠️ Critical Warning ⚠️</span>
                  Modifying package states at the root level bypasses standard Android safeguards. Eradicating critical system apps like System UI or Android Framework will IMMEDIATELY SOFT-BRICK YOUR DEVICE.
               </div>
            </div>
          )}
       </div>

       <div className="mt-4 shrink-0">
          <input 
             type="text" 
             value={query} 
             onChange={(e) => setQuery(e.target.value)} 
             placeholder="Search packages (e.g. com.samsung...)" 
             className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-sm font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
          />
       </div>

       <div className="mt-4 flex-grow overflow-y-auto min-h-[150px] border border-zinc-800 rounded-lg bg-zinc-950/50 p-2">
          {filtered.length === 0 ? (
             <div className="flex items-center justify-center h-full text-xs font-mono text-zinc-600 uppercase tracking-widest">No Packages Match Query</div>
          ) : (
             filtered.map(pkg => (
                <div key={pkg} className="p-3 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50 transition-all flex flex-col gap-2">
                   <span className="text-xs font-mono text-zinc-300 break-all">{pkg}</span>
                   {selectedPkg === pkg ? (
                      <div className="flex gap-2 animate-fadeIn">
                         <button onClick={() => handleEradicate(pkg)} className="flex-1 bg-red-900/30 border border-red-800 text-red-400 py-2 rounded-md text-xs font-black tracking-widest uppercase active:scale-95 transition-all">CONFIRM ERADICATE</button>
                         <button onClick={() => setSelectedPkg(null)} className="px-4 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-md text-xs font-black active:scale-95 transition-all">CANCEL</button>
                      </div>
                   ) : (
                      <button onClick={() => setSelectedPkg(pkg)} className="self-end px-3 py-1 bg-zinc-900 border border-zinc-700 rounded text-[10px] font-bold text-zinc-400 tracking-widest hover:text-red-400 hover:border-red-900/50 transition-all">TARGET</button>
                   )}
                </div>
             ))
          )}
       </div>

       <div className="mt-4 h-32 bg-black border border-zinc-800 rounded-xl p-3 overflow-y-auto shrink-0 shadow-inner flex flex-col-reverse">
          <div>
            {logs.map((log, i) => (
               <div key={i} className={`text-[10px] font-mono leading-relaxed pb-1 ${log.includes('ERROR') || log.includes('STDERR') || log.includes('FAILED') ? 'text-red-500' : log.includes('SUCCESS') || log.includes('✅') ? 'text-emerald-500' : 'text-zinc-500'}`}>
                  {log}
               </div>
            ))}
          </div>
       </div>
       
       <div className="h-10 shrink-0"></div>
    </div>
  );
}

export default TargetEradication;
