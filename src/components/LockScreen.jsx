import React, { useState } from 'react';

export function LockScreen({ onUnlock }) {
  const [pinEntry, setPinEntry] = useState('');
  const [errorShake, setErrorShake] = useState(false);

  // Read stored PIN from settings, default to 0000 if none set
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

  const handleClear = () => setPinEntry('');
  
  const handleBackspace = () => setPinEntry(prev => prev.slice(0, -1));

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4 font-sans select-none">
      
      <div className="flex flex-col items-center mb-12 space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/20">
          <span className="text-4xl">🔐</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-widest text-white">SOVEREIGN TOOLS</h1>
          <p className="text-[10px] font-mono text-zinc-500 tracking-[0.3em] uppercase mt-1">
            Enclave Access Locked
          </p>
        </div>
      </div>

      <div className={`flex gap-4 mb-8 ${errorShake ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 transition-colors duration-200 ${i < pinEntry.length ? 'bg-amber-400 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'border-zinc-800'}`} />
        ))}
      </div>
      
      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-10">
        Enter Security PIN
      </p>

      <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button 
            key={num} 
            onClick={() => handleKeyPress(num.toString())} 
            className="h-16 bg-zinc-900/50 hover:bg-zinc-800 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all shadow-sm"
          >
            {num}
          </button>
        ))}
        <button 
          onClick={handleClear} 
          className="h-16 bg-zinc-900/30 hover:bg-zinc-800 rounded-2xl text-xs font-bold text-zinc-400 active:scale-95 transition-all uppercase tracking-wider"
        >
          CLR
        </button>
        <button 
          onClick={() => handleKeyPress('0')} 
          className="h-16 bg-zinc-900/50 hover:bg-zinc-800 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all shadow-sm"
        >
          0
        </button>
        <button 
          onClick={handleBackspace} 
          className="h-16 bg-zinc-900/30 hover:bg-zinc-800 rounded-2xl text-lg font-bold text-zinc-400 active:scale-95 transition-all flex items-center justify-center"
        >
          ⌫
        </button>
      </div>

    </div>
  );
}
