import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';

const ShizukuRunner = registerPlugin('ShizukuRunner');

export function TargetEradication({ onNavigate }) {
  const [packages, setPackages] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState('> System Eradication Module Initialized.\n> Fetching global package registry...');
  const [isLoading, setIsLoading] = useState(true);

  // Bulletproof Shizuku Execution Wrapper
  const exec = async (cmd) => {
    try {
      if (ShizukuRunner.executeCommand) return await ShizukuRunner.executeCommand({ command: cmd });
      if (ShizukuRunner.execute) return await ShizukuRunner.execute({ command: cmd });
      return { output: '', error: 'Execution method not found.' };
    } catch (e) {
      return { output: '', error: e.message };
    }
  };

  const log = (msg) => setLogs(prev => prev + '\n' + msg);

  const fetchPackages = async () => {
    setIsLoading(true);
    
    // 1. Fetch all packages (including uninstalled/kept-data)
    const allRes = await exec('pm list packages -u --user 0');
    // 2. Fetch only disabled packages
    const disRes = await exec('pm list packages -d --user 0');
    // 3. Fetch standard active packages
    const standardRes = await exec('pm list packages --user 0');
    
    if (allRes.error && !allRes.output) {
      log('> STDERR: ' + allRes.error);
      setIsLoading(false);
      return;
    }

    const allPkgs = (allRes.output || '').split('\n').filter(l => l.includes('package:')).map(l => l.replace('package:', '').trim());
    const disPkgs = (disRes.output || '').split('\n').filter(l => l.includes('package:')).map(l => l.replace('package:', '').trim());
    const standardPkgs = (standardRes.output || '').split('\n').filter(l => l.includes('package:')).map(l => l.replace('package:', '').trim());

    // Map states securely
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

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    setFiltered(packages.filter(p => p.pkg.toLowerCase().includes(search.toLowerCase())));
  }, [search, packages]);

  const handleAction = async (action, pkg) => {
    let cmd = '';
    // The --user 0 flag is strictly required here to prevent the AppOpsService NullPointerException
    if (action === 'disable') cmd = `pm disable-user --user 0 ${pkg}`;
    else if (action === 'enable') cmd = `pm enable --user 0 ${pkg}`;
    else if (action === 'uninstall') cmd = `pm uninstall -k --user 0 ${pkg}`;
    else if (action === 'reinstall') cmd = `cmd package install-existing --user 0 ${pkg}`;

    log(`> Executing: ${cmd}`);
    const res = await exec(cmd);
    
    if (res.output) log(`[Output]: ${res.output.trim()}`);
    if (res.error) log(`[Error]: ${res.error.trim()}`);

    // Force a UI refresh to confirm the package state actually changed
    fetchPackages();
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white p-4 pb-24">
      <div className="flex justify-between items-center mb-4">
         <div className="flex items-center gap-3">
             <span className="text-3xl">☣️</span>
             <div>
                 <h2 className="text-lg font-black tracking-widest text-orange-500 uppercase">Target Eradication</h2>
                 <span className="text-[10px] text-orange-500 font-bold bg-orange-950/40 px-2 py-0.5 rounded border border-orange-900/50 uppercase">Root Context</span>
             </div>
         </div>
         <button onClick={() => typeof onNavigate === 'function' ? onNavigate('home') : null} className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-700 active:scale-95 text-zinc-400 font-black">✕</button>
      </div>

      <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 mb-4 shrink-0">
          <p className="text-[10px] text-zinc-400 font-mono mb-2">Requires root. Modify package states at your own risk. System critical apps are not protected.</p>
          <input 
              type="text" 
              placeholder="Search packages (e.g. com.samsung...)" 
              className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-xs font-mono text-cyan-400 focus:outline-none focus:border-orange-500 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
          />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
          {isLoading ? (
              <div className="text-center text-orange-500 font-mono text-sm mt-10 animate-pulse">Scanning Registry...</div>
          ) : filtered.length === 0 ? (
              <div className="text-center text-zinc-600 font-mono text-sm mt-10">No packages found.</div>
          ) : (
              filtered.map(item => (
                  <div key={item.pkg} className="bg-black border border-zinc-800 p-3 rounded-xl flex flex-col gap-2 shadow-lg">
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

      <div className="h-32 bg-black border border-zinc-800 rounded-xl p-3 overflow-y-auto font-mono text-[9px] text-zinc-500 whitespace-pre-wrap flex flex-col-reverse shrink-0 shadow-inner">
          {logs}
      </div>
    </div>
  );
}

export default TargetEradication;
