import React, { useState } from 'react';

export function LockScreen({ onUnlock }) {
  const [pinEntry, setPinEntry] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const savedPin = localStorage.getItem('sovereign_pin') || '0000';

  const handleKeyPress = (num) => {
    if (pinEntry.length < 4) {
      const newPin = pinEntry + num;
      setPinEntry(newPin);
      
      if (newPin.length === 4) {
        if (newPin === savedPin) {
          onUnlock();
        } else {
          setErrorShake(true);
          setTimeout(() => {
            setPinEntry('');
            setErrorShake(false);
          }, 400);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-between p-6 font-sans select-none relative overflow-hidden">
      
      {/* Background Watermark for Lock Screen */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('/Appicon.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>

      {/* Top Section: Logo & Disclaimers */}
      <div className="flex flex-col items-center mt-12 space-y-4 z-10 w-full">
        <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-zinc-900/50 border border-zinc-800">
          <img src="/Appicon.jpg" alt="Sovereign Logo" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span class="text-4xl w-full h-full flex items-center justify-center bg-zinc-900">🛡️</span>'; }} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-widest text-white uppercase">SOVEREIGN TOOLS</h1>
          <p className="text-[9px] font-mono theme-accent-text tracking-[0.3em] uppercase mt-2">
            Enclave Access Locked
          </p>
        </div>
      </div>

      {/* Middle Section: PIN Pad */}
      <div className="flex flex-col items-center z-10 w-full max-w-[280px]">
        <div className={`flex gap-4 mb-8 ${errorShake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-3.5 h-3.5 rounded-full border transition-colors duration-200 ${i < pinEntry.length ? 'theme-accent-bg border-transparent shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'border-zinc-700 bg-black/50'}`} />
          ))}
        </div>
        
        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} onClick={() => handleKeyPress(num.toString())} className="h-16 bg-zinc-900/60 backdrop-blur border border-zinc-800 hover:bg-zinc-800 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all shadow-sm">
              {num}
            </button>
          ))}
          <button onClick={() => setPinEntry('')} className="h-16 bg-zinc-900/30 backdrop-blur border border-zinc-800 hover:bg-zinc-800 rounded-2xl text-xs font-bold text-zinc-400 active:scale-95 transition-all uppercase tracking-wider">
            CLR
          </button>
          <button onClick={() => handleKeyPress('0')} className="h-16 bg-zinc-900/60 backdrop-blur border border-zinc-800 hover:bg-zinc-800 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all shadow-sm">
            0
          </button>
          <button onClick={() => setPinEntry(prev => prev.slice(0, -1))} className="h-16 bg-zinc-900/30 backdrop-blur border border-zinc-800 hover:bg-zinc-800 rounded-2xl text-lg font-bold text-zinc-400 active:scale-95 transition-all flex items-center justify-center">
            ⌫
          </button>
        </div>
      </div>

      {/* Bottom Section: Info Toggle */}
      <div className="z-10 w-full flex flex-col items-center pb-4">
        <button onClick={() => setShowInfo(!showInfo)} className="text-[10px] uppercase font-bold text-zinc-500 hover:text-zinc-300 border border-zinc-800 px-4 py-2 rounded-full backdrop-blur bg-black/50 transition-colors">
          {showInfo ? 'Close Info' : 'About Sovereign'}
        </button>
        
        {showInfo && (
          <div className="absolute bottom-20 left-4 right-4 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 p-6 rounded-3xl shadow-2xl animate-fadeIn space-y-4 text-center">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Privacy is Sovereignty</h3>
            <p className="text-[10px] text-zinc-400 font-mono leading-relaxed text-justify">
              Sovereign Tools is a 100% offline-first, decentralized utility suite. It operates exclusively on local device hardware to ensure absolute data sovereignty. No telemetry, no external databases, no centralized servers. All cryptographic keys and vaults are generated and stored strictly within the device enclave. 
            </p>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest pt-2 border-t border-zinc-900">
              Proceed with absolute local control.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
