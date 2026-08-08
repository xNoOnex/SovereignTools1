import React, { useState } from 'react';

export function Settings({ closeSettings, appMode, setAppMode, accentColor, setAccentColor, textSize, setTextSize, onNavigate }) {
  const [pin, setPin] = useState(localStorage.getItem('sovereign_pin') || '');
  const [saveStatus, setSaveStatus] = useState('');

  const handleSavePin = () => {
    if (pin.length < 4) {
      setSaveStatus('Too short');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }
    localStorage.setItem('sovereign_pin', pin);
    setSaveStatus('Saved!');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] p-6 animate-fadeIn overflow-y-auto">

          {/* Protocol Manual Button */}
          <div className="mb-6">
              <button 
                  onClick={() => onNavigate('mesh_protocol')} 
                  className="w-full bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 py-4 rounded-2xl flex items-center justify-center gap-3 font-black tracking-widest hover:bg-emerald-900/40 transition-all active:scale-95 shadow-lg">
                  <span>📖</span> MESH NETWORK PROTOCOL
              </button>
          </div>
        

      
      <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <span className="text-2xl text-zinc-400">⚙️</span> SETTINGS
        </h2>
        <button onClick={closeSettings} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-xl font-bold border border-zinc-700 active:scale-95 text-zinc-400 hover:text-white">✕</button>
      </div>
      
      <div className="space-y-6 pb-20">
        
        {/* APP OPERATION MODE */}
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Interface Mode</h3>
          <div className="flex gap-3">
            <button onClick={() => setAppMode('BASIC')} className={`flex-1 py-4 rounded-xl font-bold text-xs tracking-widest border transition-all flex justify-center items-center gap-2 ${appMode === 'BASIC' ? 'theme-accent-bg text-black shadow-lg border-transparent' : 'bg-black text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}>
              BASIC
            </button>
            <button onClick={() => setAppMode('EXPERT')} className={`flex-1 py-4 rounded-xl font-bold text-xs tracking-widest border transition-all flex justify-center items-center gap-2 ${appMode === 'EXPERT' ? 'theme-accent-bg text-black shadow-lg border-transparent' : 'bg-black text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}>
              EXPERT
            </button>
          </div>
        </div>

        {/* SECURITY ACCESS PIN */}
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Security Access PIN</h3>
          <div className="flex gap-3 relative">
            <input 
              type="password" 
              value={pin} 
              onChange={e => setPin(e.target.value)} 
              placeholder="••••" 
              className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-lg tracking-[0.5em] text-white font-mono focus:outline-none focus:border-[var(--accent-text)] shadow-inner" 
            />
            <button onClick={handleSavePin} className="px-6 shrink-0 bg-zinc-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow active:scale-95 border border-zinc-700 hover:border-zinc-500 transition-all">
              Update
            </button>
            {saveStatus && <span className="absolute -top-8 right-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-black px-3 py-1 rounded-full border border-emerald-900/50">{saveStatus}</span>}
          </div>
        </div>

        {/* ACCENT COLOR PROFILE */}
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Accent Color & Theme</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {[
              { id: 'cyan', label: 'CYBER' },
              { id: 'emerald', label: 'MATRIX' },
              { id: 'amber', label: 'HAZMAT' },
              { id: 'purple', label: 'STEALTH' },
              { id: 'rose', label: 'ALERT' }
            ].map(c => (
              <button 
                key={c.id} 
                onClick={() => setAccentColor(c.id)} 
                className={`px-5 py-4 rounded-xl font-bold text-[10px] tracking-widest transition-all shrink-0 ${accentColor === c.id ? 'bg-black text-white border-2 border-white shadow-lg' : 'bg-black text-zinc-500 border border-zinc-800 hover:border-zinc-600'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* TEXT SCALE */}
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global Text Scale</h3>
          <input type="range" min="0" max="2" step="1" value={textSize} onChange={e => setTextSize(parseInt(e.target.value, 10))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none accent-[var(--accent-text)] cursor-pointer" />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono font-bold">
            <span>Small</span>
            <span>Normal</span>
            <span>Large</span>
          </div>
        </div>

        {/* SUPPORT BUTTON */}
        <button onClick={() => { closeSettings(); onNavigate('support'); }} className="w-full py-5 bg-black border border-zinc-800 hover:border-zinc-600 rounded-3xl flex items-center justify-center gap-3 text-xs font-bold text-white uppercase tracking-widest active:scale-95 transition-all shadow-lg mt-8">
          <span className="text-xl">☕</span> Support The Creator
        </button>

      </div>
    </div>
  );
}
