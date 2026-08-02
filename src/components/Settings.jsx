import React, { useState } from 'react';

export function Settings({ closeSettings, appMode, setAppMode, accentColor, setAccentColor }) {
  const [pin, setPin] = useState(localStorage.getItem('sovereign_pin') || '');
  const [saveMsg, setSaveMsg] = useState('');

  // Fetch true WASM Engine status
  const aiCached = localStorage.getItem('sovereign_ai_cached') === 'true';
  const aiModel = localStorage.getItem('sovereign_ai_model') || 'None';

  const handleSavePin = () => {
    if (pin.length < 4) {
      setSaveMsg('❌ PIN must be at least 4 chars.');
    } else {
      localStorage.setItem('sovereign_pin', pin);
      setSaveMsg('✅ PIN Saved');
    }
    setTimeout(() => setSaveMsg(''), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col font-sans select-none overflow-y-auto pb-8">
      
      <div className="flex justify-between items-center p-4 border-b border-zinc-900 bg-black sticky top-0 z-10">
        <h2 className="text-lg font-black tracking-widest text-white flex items-center gap-2">
          ⚙️ SOVEREIGN SETTINGS
        </h2>
        <button onClick={closeSettings} className="p-2 text-zinc-400 hover:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div className="p-5 space-y-6">
        
        {/* APP OPERATION MODE */}
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest flex items-center gap-2">
            ⚙️ APP OPERATION MODE
          </h3>
          <p className="text-xs text-zinc-400">Easy mode hides advanced security tools (Debloat, Comms, Shredder, NetSec, AES).</p>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => { setAppMode('EXPERT'); localStorage.setItem('sovereign_mode', 'EXPERT'); }}
              className={`py-3 rounded-2xl text-xs font-black tracking-wide shadow ${appMode === 'EXPERT' ? 'theme-accent-bg text-black' : 'bg-black border border-zinc-800 text-zinc-500'}`}
            >
              ⚡ EXPERT MODE
            </button>
            <button 
              onClick={() => { setAppMode('EASY'); localStorage.setItem('sovereign_mode', 'EASY'); }}
              className={`py-3 rounded-2xl text-xs font-black tracking-wide shadow ${appMode === 'EASY' ? 'bg-emerald-500 text-black' : 'bg-black border border-zinc-800 text-zinc-500'}`}
            >
              🌿 EASY MODE
            </button>
          </div>
        </div>

        {/* SECURITY PIN */}
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
          <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest flex items-center gap-2">
            🔒 SECURITY ACCESS PIN
          </h3>
          <div className="flex gap-2">
            <input 
              type="password" 
              value={pin} 
              onChange={(e) => setPin(e.target.value)} 
              placeholder="Enter numerical PIN..."
              className="flex-1 bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-lg tracking-widest text-white font-mono focus:outline-none focus:border-zinc-600"
            />
            <button onClick={handleSavePin} className="theme-accent-bg text-black font-bold px-4 py-3 rounded-2xl text-sm shadow">
              Save PIN
            </button>
          </div>
          {saveMsg && <p className={`text-xs font-bold ${saveMsg.includes('❌') ? 'text-red-400' : 'text-emerald-400'}`}>{saveMsg}</p>}
        </div>

        {/* ACCENT COLOR */}
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest flex items-center gap-2">
            🎨 ACCENT COLOR PROFILE
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {['cyan', 'amber', 'matrix', 'onion'].map(color => (
              <button 
                key={color}
                onClick={() => { setAccentColor(color); localStorage.setItem('sovereign_accent', color); }}
                className={`py-3 rounded-2xl text-[10px] font-bold uppercase transition-all ${accentColor === color ? 'bg-zinc-800 text-white border-2 border-white' : 'bg-black text-zinc-500 border border-zinc-800'}`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* OFFLINE AI STATUS */}
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
          <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest flex items-center gap-2">
            🤖 OFFLINE AI MODEL STATUS
          </h3>
          <div className="bg-black border border-zinc-800 p-4 rounded-2xl flex justify-between items-center">
            <span className="text-xs font-mono text-zinc-300 w-32 truncate">{aiModel.split('/').pop()}</span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
              <div className={`w-2.5 h-2.5 rounded-full ${aiCached ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`}></div>
              <span className="text-[10px] font-bold text-zinc-400 tracking-wide">{aiCached ? 'Active in IndexedDB' : 'Not Downloaded'}</span>
            </div>
          </div>
        </div>

      </div>
      
      <div className="px-5 mt-auto">
        <button onClick={closeSettings} className="w-full theme-accent-bg text-black font-extrabold py-4 rounded-3xl text-sm shadow-xl">
          Close Settings
        </button>
      </div>
    </div>
  );
}
