import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';

const ShizukuRunner = registerPlugin('ShizukuRunner');

const BLOAT_DATABASE = [
  { pkg: 'com.samsung.android.bixby.agent', name: 'Bixby Voice Agent', category: 'OEM Voice AI', risk: 'LOW', info: 'Samsung voice assistant. Safe to nuke if using another assistant.' },
  { pkg: 'com.sec.android.app.samsungapps', name: 'Galaxy Store', category: 'OEM Store', risk: 'MEDIUM', info: 'Samsung app store. Required only for updating Samsung system modules.' },
  { pkg: 'com.facebook.services', name: 'Facebook Telemetry', category: 'Tracker', risk: 'LOW', info: 'Background Facebook tracking daemon pre-installed on vendor ROMs.' },
  { pkg: 'com.facebook.system', name: 'Facebook App Installer', category: 'Installer', risk: 'LOW', info: 'Allows Facebook to background-update its suite without Play Store.' },
  { pkg: 'com.microsoft.office.outlook', name: 'Outlook Bloatware', category: 'Preload', risk: 'LOW', info: 'Pre-installed Microsoft email client.' },
  { pkg: 'com.samsung.android.game.gametools', name: 'Game Launcher / Tools', category: 'OEM Utility', risk: 'LOW', info: 'Samsung gaming overlay and performance telemetry collector.' },
  { pkg: 'com.samsung.android.arzone', name: 'AR Zone', category: 'OEM Camera', risk: 'LOW', info: 'Augmented reality doodles and emoji modules.' },
  { pkg: 'com.sec.android.autodoodle.service', name: 'Auto Doodle Service', category: 'OEM Utility', risk: 'LOW', info: 'S-Pen doodle background daemon.' },
  { pkg: 'com.google.android.projection.gearhead', name: 'Android Auto', category: 'Google System', risk: 'MEDIUM', info: 'Car display mirror system. Safe to remove if you do not use vehicle USB mirroring.' },
  { pkg: 'com.samsung.android.ipsgeofence', name: 'Geofence Service', category: 'Telemetry', risk: 'LOW', info: 'OEM location profiling and indoor positioning daemon.' }
];

export function Debloat({ onNavigate }) {
  const [shizukuActive, setShizukuActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState('> Debloat Intelligence Engine Online...\n');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    checkShizuku();
  }, []);

  const checkShizuku = async () => {
    try {
      const res = await ShizukuRunner.checkStatus();
      setShizukuActive(res.granted || res.active);
    } catch (e) {
      setShizukuActive(false);
    }
  };

  const executeAction = async (action) => {
    if (!selectedItem) return;
    const pkg = selectedItem.pkg;
    setSelectedItem(null);

    let cmd = action === 'DISABLE' ? `pm disable-user --user 0 ${pkg}` : `pm uninstall -k --user 0 ${pkg}`;
    let label = action === 'DISABLE' ? 'FREEZE' : 'ANNIHILATE';

    setLogs(prev => prev + `\n> Executing [${label}]: ${pkg}...\n`);
    try {
      const res = await ShizukuRunner.executeCommand({ command: cmd });
      setLogs(prev => prev + (res.output || 'Action executed successfully.') + '\n');
    } catch (e) {
      setLogs(prev => prev + `ERROR: ${e.message}\n`);
    }
  };

  const filteredBloat = BLOAT_DATABASE.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.pkg.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-32 select-none font-sans text-white animate-fadeIn">
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <span className="text-3xl text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]">☣️</span> Target Eradication
        </h2>
        <p className="text-xs text-zinc-400 mt-2">Isolate, disable, or permanently destroy OEM telemetry and system bloatware.</p>
      </div>

      <div className={`p-4 rounded-3xl flex justify-between items-center shadow-xl ${shizukuActive ? 'bg-emerald-950/30 border border-emerald-900/50' : 'bg-red-950/30 border border-red-900/50'}`}>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-white">Shizuku Root Broker</h4>
          <p className="text-[10px] font-mono text-zinc-400 mt-0.5">Required for silent package modification</p>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl ${shizukuActive ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {shizukuActive ? 'CONNECTED' : 'OFFLINE'}
        </span>
      </div>

      <input 
        type="text" 
        value={searchTerm} 
        onChange={e => setSearchTerm(e.target.value)} 
        placeholder="🔍 Search package, name, or risk category..." 
        className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-rose-500/50 shadow-inner"
      />

      <div className="space-y-3">
        {filteredBloat.map((item, idx) => (
          <div key={idx} onClick={() => setSelectedItem(item)} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-3xl flex justify-between items-center cursor-pointer hover:border-rose-500/40 active:scale-95 transition-all shadow-lg">
            <div className="space-y-1 max-w-[70%]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{item.name}</span>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${item.risk === 'LOW' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-amber-950 text-amber-400 border border-amber-900'}`}>
                  Risk: {item.risk}
                </span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 block truncate">{item.pkg}</span>
              <p className="text-[9px] text-zinc-400 leading-tight">{item.info}</p>
            </div>
            <button className="bg-rose-600/20 text-rose-400 border border-rose-600/40 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shrink-0">
              TARGET
            </button>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl max-w-sm w-full space-y-4 text-center shadow-2xl">
            <span className="text-4xl">🎯</span>
            <h3 className="text-base font-black text-white">{selectedItem.name}</h3>
            <p className="text-[10px] font-mono text-zinc-400 bg-black p-2 rounded-xl break-all">{selectedItem.pkg}</p>
            <p className="text-xs text-zinc-300 leading-relaxed">{selectedItem.info}</p>
            
            <div className="space-y-2 pt-2">
              <button onClick={() => executeAction('DISABLE')} className="w-full py-3.5 bg-amber-600 text-black font-black text-xs uppercase tracking-widest rounded-xl active:scale-95 shadow">
                🧊 Freeze Package (Disable)
              </button>
              <button onClick={() => executeAction('NUKE')} className="w-full py-3.5 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-xl active:scale-95 shadow">
                🔥 Nuke Package (Uninstall)
              </button>
              <button onClick={() => setSelectedItem(null)} className="w-full py-3 bg-zinc-800 text-zinc-400 font-bold text-[10px] uppercase tracking-widest rounded-xl active:scale-95">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-black border border-zinc-800 rounded-3xl p-4 overflow-y-auto font-mono text-[9px] text-rose-400 whitespace-pre-wrap shadow-inner h-32">
        {logs}
      </div>
    </div>
  );
}
