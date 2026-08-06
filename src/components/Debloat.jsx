import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';

const ShizukuRunner = registerPlugin('ShizukuRunner');

export function Debloat({ onNavigate }) {
  const [packages, setPackages] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState('> System Registry Scanner Initialized.\n> Fetching package states via Shizuku...');
  const [isLoading, setIsLoading] = useState(true);

  const exec = async (cmd) => {
    try {
      if (ShizukuRunner.executeCommand) return await ShizukuRunner.executeCommand({ command: cmd });
      if (ShizukuRunner.execute) return await ShizukuRunner.execute({ command: cmd });
      return { output: '', error: 'Plugin method not found.' };
    } catch (e) {
      return { output: '', error: e.message || String(e) };
    }
  };

  const log = (msg) => setLogs(prev => prev + '\n' + msg);

  const fetchPackages = async () => {
    setIsLoading(true);
    
    // Explicit --user 0 bypasses AppOpsService NullPointer exceptions
    const allRes = await exec('pm list packages -u --user 0');
    const disRes = await exec('pm list packages -d --user 0');
    const standardRes = await exec('pm list packages --user 0');
    
    if (allRes.error && !allRes.output) {
      log('> STDERR: ' + allRes.error);
      setIsLoading(false);
      return;
    }

    const allPkgs = (allRes.output || '').split('\n').filter(l => l.includes('package:')).map(l => l.replace('package:', '').trim());
    const disPkgs = (disRes.output || '').split('\n').filter(l => l.includes('package:')).map(l => l.replace('package:', '').trim());
    const standardPkgs = (standardRes.output || '').split('\n').filter(l => l.includes('package:')).map(l => l.replace('package:', '').trim());

    const pkgObjects = allPkgs.map(pkg => {
        let state = 'enabled';
        if (disPkgs.includes(pkg)) state = 'disabled';
        else if (!standardPkgs.includes(pkg)) state = 'uninstalled';
        return { pkg, state };
    }).sort((a, b) => a.pkg.localeCompare(b.pkg));

    setPackages(pkgObjects);
    setFiltered(pkgObjects);
    log('> Successfully mapped ' + pkgObjects.length + ' packages.');
    setIsLoading(false);
  };

  useEffect(() => { fetchPackages(); }, []);

  useEffect(() => {
    setFiltered(packages.filter(p => p.pkg.toLowerCase().includes(search.toLowerCase())));
  }, [search, packages]);

  const handleAction = async (action, pkg) => {
    let cmd = '';
    // Safely enforce user profile to prevent crashing
    if (action === 'disable') cmd = `pm disable-user --user 0 ${pkg}`;
    else if (action === 'enable') cmd = `pm enable --user 0 ${pkg}`;
    else if (action === 'uninstall') cmd = `eradicate() { echo "> Bypassing Samsung NPE..."; pm clear $1 >/dev/null 2>&1; pm disable-user --user 0 $1; pm hide $1 >/dev/null 2>&1; echo "> System target neutralized."; }; eradicate ${pkg}`;
    else if (action === 'reinstall') cmd = `cmd package install-existing --user 0 ${pkg}`;

    log(`> Executing: ${cmd}`);
    const res = await exec(cmd);
    
    if (res.output) log(`[Output]: ${res.output.trim()}`);
    if (res.error) log(`[Error]: ${res.error.trim()}`);

    fetchPackages(); // Force UI refresh to confirm state change
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white p-4 pb-40">
      <div className="flex justify-between items-center mb-4 shrink-0 mt-2">
         <div className="flex items-center gap-3">
             <span className="text-3xl">☣️</span>
             <div>
                 <h2 className="text-lg font-black tracking-widest text-orange-500 uppercase">Target Eradication</h2>
                 <span className="text-[10px] text-orange-500 font-bold bg-orange-950/40 px-2 py-0.5 rounded border border-orange-900/50 uppercase">Root Context</span>
             </div>
         </div>
         <button onClick={() => typeof onNavigate === 'function' ? onNavigate('home') : null} className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-700 active:scale-95 text-zinc-400 font-black">✕</button>
      </div>

      <details className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl mb-3 shrink-0 shadow-lg z-10 group">
          <summary className="text-xs font-black text-cyan-400 uppercase tracking-widest cursor-pointer list-none flex justify-between items-center outline-none">
             <span>Info & Warnings</span>
             <span className="text-zinc-500 group-open:rotate-180 transition-transform duration-300">▼</span>
          </summary>
          <div className="pt-3 mt-3 border-t border-zinc-800/50">
              <p className="text-[11px] text-zinc-300 mb-4 leading-relaxed">Scans the system registry to map all installed packages. Allows you to safely disable telemetry daemons or permanently eradicate bloatware using Shizuku privileges.</p>
              <p className="text-[11px] text-orange-400/90 mb-4 leading-relaxed font-mono">NOTE: Due to a Samsung OneUI 6 AppOps bug, standard uninstalls via Shizuku UID 2000 crash with a NullPointerException. The UNINSTALL button now executes a custom bypass that forcefully clears data, disables, and completely hides the target package from the system registry instead.</p>
              <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-1 animate-pulse text-sm mt-2">⚠️ CRITICAL WARNING ⚠️</h3>
              <p className="text-[11px] text-red-400 bg-red-950/40 p-3 rounded-xl border border-red-900/80 font-bold shadow-inner leading-relaxed font-mono">Modifying package states at the root level bypasses standard Android safeguards. Eradicating critical system apps like System UI or Android Framework will IMMEDIATELY SOFT-BRICK YOUR DEVICE.</p>
          </div>
      </details>
      <input 
          type="text" 
          placeholder="Search packages (e.g. com.samsung...)" 
          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs font-mono text-cyan-400 focus:outline-none focus:border-orange-500 transition-colors mb-4 shrink-0 shadow-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1 relative z-0">
          {isLoading ? (
              <div className="text-center text-orange-500 font-mono text-xs mt-10 animate-pulse tracking-widest">SCANNING REGISTRY...</div>
          ) : filtered.length === 0 ? (
              <div className="text-center text-zinc-600 font-mono text-xs mt-10">NO PACKAGES MATCH QUERY</div>
          ) : (
              filtered.map(item => (
                  <div key={item.pkg} className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-2">
                          <span className="text-[11px] font-mono text-zinc-300 break-all">{item.pkg}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded shrink-0 tracking-wider ${item.state === 'enabled' ? 'bg-emerald-950/40 text-emerald-500 border border-emerald-900/50' : item.state === 'disabled' ? 'bg-amber-950/40 text-amber-500 border border-amber-900/50' : 'bg-rose-950/40 text-rose-500 border border-rose-900/50'}`}>
                              {item.state}
                          </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                          {item.state === 'enabled' && (
                              <>
                                  <button onClick={() => handleAction('disable', item.pkg)} className="flex-1 bg-amber-950/20 hover:bg-amber-950/40 text-amber-500 border border-amber-900/50 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Disable</button>
                                  <button onClick={() => handleAction('uninstall', item.pkg)} className="flex-1 bg-rose-950/20 hover:bg-rose-950/40 text-rose-500 border border-rose-900/50 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Uninstall</button>
                              </>
                          )}
                          {item.state === 'disabled' && (
                              <>
                                  <button onClick={() => handleAction('enable', item.pkg)} className="flex-1 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-500 border border-emerald-900/50 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Enable</button>
                                  <button onClick={() => handleAction('uninstall', item.pkg)} className="flex-1 bg-rose-950/20 hover:bg-rose-950/40 text-rose-500 border border-rose-900/50 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Uninstall</button>
                              </>
                          )}
                          {item.state === 'uninstalled' && (
                              <button onClick={() => handleAction('reinstall', item.pkg)} className="flex-1 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-500 border border-cyan-900/50 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Reinstall (Keep Data)</button>
                          )}
                      </div>
                  </div>
              ))
          )}
      </div>

      <div className="h-28 bg-black border border-zinc-800 rounded-xl p-3 overflow-y-auto font-mono text-[9px] text-zinc-500 whitespace-pre-wrap flex flex-col-reverse shrink-0 shadow-inner z-10 min-h-[250px]">
          {logs}
      </div>
    </div>
  );
}

export default Debloat;
