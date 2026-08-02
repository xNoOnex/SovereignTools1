import React, { useState } from 'react';

export function Settings({ closeSettings, appMode, setAppMode, accentColor, setAccentColor, textSize, setTextSize }) {
  const [pin, setPin] = useState(localStorage.getItem('sovereign_pin') || '');
  const [pinSaved, setPinSaved] = useState(false);

  const savePin = () => {
    if (pin.length === 4) {
      localStorage.setItem('sovereign_pin', pin);
      setPinSaved(true);
      setTimeout(() => setPinSaved(false), 2000);
    } else {
      alert('PIN must be exactly 4 digits.');
    }
  };

  const handleAppMode = (mode) => {
    setAppMode(mode);
    localStorage.setItem('sovereign_mode', mode);
  };

  const handleAccent = (color) => {
    setAccentColor(color);
    localStorage.setItem('sovereign_accent', color);
  };

  const handleTextSize = (size) => {
    setTextSize(size);
    localStorage.setItem('sovereign_text', size);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      <div className="p-4 border-b border-zinc-900 flex justify-between items-center sticky top-0 bg-black/90 backdrop-blur z-10">
        <h2 className="text-xl font-black tracking-widest text-white flex items-center gap-2">
          <span className="text-2xl text-zinc-400">⚙️</span> SOVEREIGN SETTINGS
        </h2>
        <button onClick={closeSettings} className="text-zinc-500 hover:text-white p-2">✕</button>
      </div>

      <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
        
        {/* APP OPERATION MODE */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-4">
          <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest flex items-center gap-2">
            ⚙️ APP OPERATION MODE
          </h3>
          <p className="text-xs text-zinc-400">Easy mode hides advanced security tools (Debloat, Comms, Shredder, NetSec, AES).</p>
          <div className="flex gap-2">
            <button onClick={() => handleAppMode('EXPERT')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${appMode === 'EXPERT' ? 'theme-accent-bg text-black shadow' : 'bg-black text-zinc-400 border border-zinc-800'}`}>⚡ EXPERT MODE</button>
            <button onClick={() => handleAppMode('EASY')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${appMode === 'EASY' ? 'bg-emerald-500 text-black shadow' : 'bg-black text-zinc-400 border border-zinc-800'}`}>🌿 EASY MODE</button>
          </div>
        </div>

        {/* SECURITY ACCESS PIN */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-4">
          <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest flex items-center gap-2">
            🔒 SECURITY ACCESS PIN
          </h3>
          <div className="flex gap-2">
            <input type="password" maxLength="4" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="Enter numerical PIN" className="flex-1 bg-black border border-zinc-800 rounded-xl px-5 py-4 text-lg text-white font-mono tracking-widest focus:outline-none" />
            <button onClick={savePin} className={`px-5 rounded-xl text-xs font-bold transition-all ${pinSaved ? 'bg-emerald-500 text-black' : 'theme-accent-bg text-black'}`}>
              {pinSaved ? 'Saved!' : 'Save PIN'}
            </button>
          </div>
        </div>

        {/* TEXT SCALE - RESTORED */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-4">
          <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest flex items-center gap-2">
            🔤 TEXT SCALE
          </h3>
          <div className="flex gap-2">
            {['Small', 'Medium', 'Large'].map(size => (
              <button 
                key={size}
                onClick={() => handleTextSize(size)}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${textSize === size ? 'theme-accent-bg text-black shadow' : 'bg-black text-zinc-400 border border-zinc-800'}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* ACCENT COLOR PROFILE */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-4">
          <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest flex items-center gap-2">
            🎨 ACCENT COLOR PROFILE
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {['cyan', 'amber', 'matrix', 'onion'].map(color => (
              <button 
                key={color}
                onClick={() => handleAccent(color)}
                className={`py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${accentColor === color ? 'border-2 border-white text-white' : 'bg-black text-zinc-500 border border-zinc-800'}`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* OFFLINE AI MODEL STATUS */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-4">
          <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest flex items-center gap-2">
            🤖 OFFLINE AI MODEL STATUS
          </h3>
          <div className="flex justify-between items-center bg-black border border-zinc-800 rounded-xl p-4">
            <span className="text-xs font-mono text-zinc-300">Cached Local 3B LLM:</span>
            <span className="text-xs font-bold text-zinc-500 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-zinc-600"></div> Not Downloaded
            </span>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/95 backdrop-blur border-t border-zinc-900 z-50">
        <button onClick={closeSettings} className="w-full py-4 theme-accent-bg text-black font-extrabold text-sm rounded-xl shadow active:scale-95 transition-transform">
          Close Settings
        </button>
      </div>
    </div>
  );
}
