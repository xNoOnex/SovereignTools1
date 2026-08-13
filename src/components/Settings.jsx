import React, { useState } from 'react';
import { registerPlugin } from '@capacitor/core';
const ScreenshotShield = registerPlugin('ScreenshotShield');

export function Settings({ closeSettings, pin, setPin, passcode, setPasscode, accentColor, setAccentColor, textSize, setTextSize, onNavigate }) {
  const [devStatus, setDevStatus] = useState(localStorage.getItem('sovereign_dev_mode') === 'true');

  const toggleShield = async () => {
    const isCurrentlyOff = localStorage.getItem('sovereign_allow_screenshots') === 'true';
    if (isCurrentlyOff) {
      await ScreenshotShield.enable();
      localStorage.setItem('sovereign_allow_screenshots', 'false');
      alert("🛡️ Shields UP: Screenshots & screen recording blocked.");
    } else {
      await ScreenshotShield.disable();
      localStorage.setItem('sovereign_allow_screenshots', 'true');
      alert("⚠️ Shields DOWN: Screenshots allowed for debugging.");
    }
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] p-6 animate-fadeIn flex flex-col overflow-y-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-zinc-800 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
            <span>⚙️</span> System Settings
          </h2>
          <p className="text-xs font-mono text-zinc-500">Security & Environment Configuration</p>
        </div>
        <button 
          onClick={closeSettings}
          className="bg-zinc-900 border border-zinc-700 px-5 py-2 rounded-xl text-xs font-bold text-zinc-300 active:scale-95"
        >
          CLOSE
        </button>
      </div>

      <div className="flex flex-col gap-6 py-6 pb-20">
        
        {/* Screenshot Toggle */}
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-zinc-200">Screenshot Shield</h4>
            <p className="text-[10px] font-mono text-zinc-500">Block OS screen capture</p>
          </div>
          <button 
            onClick={toggleShield}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono ${localStorage.getItem('sovereign_allow_screenshots') === 'true' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}
          >
            {localStorage.getItem('sovereign_allow_screenshots') === 'true' ? 'DISABLED' : 'ACTIVE'}
          </button>
        </div>

        {/* Support Creator */}
        <button 
          onClick={() => onNavigate('support')}
          className="w-full py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-bold tracking-widest uppercase text-zinc-300 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>☕</span> Support The Creator
        </button>

      </div>
    </div>
  );
}

export default Settings;
