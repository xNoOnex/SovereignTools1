import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';

const ShizukuRunner = registerPlugin('ShizukuRunner');

export function Debloat({ onNavigate }) {
  const [packages, setPackages] = useState([]);
  const [shizukuActive, setShizukuActive] = useState(false);
  const [logs, setLogs] = useState('> Debloat Engine Ready...\n');
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [actionMenu, setActionMenu] = useState(false);

  useEffect(() => {
    checkEngine();
  }, []);

  const checkEngine = async () => {
    try {
      const res = await ShizukuRunner.checkStatus();
      setShizukuActive(res.granted || res.active);
      if (res.granted || res.active) scanPackages();
    } catch (e) {
      setShizukuActive(false);
    }
  };

  const scanPackages = async () => {
    setLogs(prev => prev + '> Scanning system blobs...\n');
    try {
      const res = await ShizukuRunner.executeCommand({ command: 'pm list packages -s' });
      if (res.output) {
        const pkgs = res.output.split('\n')
          .filter(line => line.includes('package:'))
          .map(line => line.replace('package:', '').trim())
          .filter(pkg => pkg.includes('samsung') || pkg.includes('facebook') || pkg.includes('microsoft') || pkg.includes('bixby') || pkg.includes('amazon') || pkg.includes('netflix'));
        setPackages(pkgs);
        setLogs(prev => prev + `> Indexed ${pkgs.length} high-risk targets.\n`);
      }
    } catch (e) {
      setLogs(prev => prev + `> Scan Failed: ${e.message}\n`);
    }
  };

  const executeAction = async (action) => {
    setActionMenu(false);
    if (!selectedPkg) return;
    
    let cmd = '';
    let label = '';
    if (action === 'DISABLE') {
      cmd = `pm disable-user --user 0 ${selectedPkg}`;
      label = `FREEZE`;
    } else if (action === 'NUKE') {
      cmd = `pm uninstall -k --user 0 ${selectedPkg}`;
      label = `ANNIHILATE`;
    }

    setLogs(prev => prev + `> Executing [${label}]: ${selectedPkg}...\n`);
    try {
      const res = await ShizukuRunner.executeCommand({ command: cmd });
      setLogs(prev => prev + (res.output || 'Command executed with no output.') + '\n');
      setTimeout(scanPackages, 1500); // Rescan after action
    } catch (e) {
      setLogs(prev => prev + `ERROR: ${e.message}\n`);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto pb-32 select-none font-sans text-white animate-fadeIn">
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-2xl font-black text-white flex items-center gap-3"><span className="text-3xl drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]">☣️</span> Target Eradication</h2>
        <p className="text-xs text-zinc-400 mt-2">Isolate, disable, or permanently destroy OEM telemetry and system bloatware.</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
           <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Shizuku Root Engine</h3>
           <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${shizukuActive ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-900' : 'bg-red-900/50 text-red-400 border border-red-900'}`}>
             {shizukuActive ? 'ACTIVE' : 'OFFLINE'}
           </span>
        </div>
      </div>

      <div className="space-y-3">
        {packages.map((pkg, idx) => (
          <div key={idx} onClick={() => { setSelectedPkg(pkg); setActionMenu(true); }} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center active:scale-95 transition-transform cursor-pointer shadow">
             <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-white truncate pr-4">{pkg}</span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase mt-1">Telemetry Risk</span>
             </div>
             <span className="text-[10px] font-bold text-amber-500 bg-amber-900/20 px-3 py-1 rounded-xl border border-amber-900/50 shrink-0">SELECT</span>
          </div>
        ))}
      </div>

      {actionMenu && selectedPkg && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
            <h3 className="text-lg font-black text-white mb-2 truncate max-w-full">{selectedPkg}</h3>
            <p className="text-xs text-zinc-400 mb-8 text-center">Select an eradication method for this target.</p>
            
            <div className="space-y-4 w-full max-w-xs">
               <button onClick={() => executeAction('DISABLE')} className="w-full py-4 bg-amber-600 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(217,119,6,0.3)] active:scale-95 transition-all">
                  🧊 Freeze (Disable)
               </button>
               <button onClick={() => executeAction('NUKE')} className="w-full py-4 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.3)] active:scale-95 transition-all">
                  🔥 Nuke (Uninstall)
               </button>
               <button onClick={() => setActionMenu(false)} className="w-full py-4 bg-zinc-900 border border-zinc-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl active:scale-95 transition-all mt-4">
                  Cancel Target
               </button>
            </div>
        </div>
      )}

      <div className="bg-black border border-zinc-800 rounded-3xl p-4 overflow-y-auto font-mono text-[9px] text-rose-400 whitespace-pre-wrap shadow-inner h-32">
        {logs}
      </div>
    </div>
  );
}
