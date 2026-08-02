import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';

export function LockScreen({ onUnlock }) {
  const { pin } = useSettings();
  const [inputPin, setInputPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleKeyPress = (val) => {
    if (val === 'CLEAR') {
      setInputPin('');
      setErrorMsg('');
      return;
    }

    if (val === 'DEL') {
      setInputPin(prev => prev.slice(0, -1));
      return;
    }

    const nextPin = inputPin + val;
    setInputPin(nextPin);

    // Check PIN match on complete input length
    if (nextPin.length === (pin ? pin.length : 4)) {
      if (nextPin === (pin || '1234')) {
        setInputPin('');
        setErrorMsg('');
        onUnlock();
      } else {
        setErrorMsg('❌ INVALID ACCESS KEY');
        setTimeout(() => {
          setInputPin('');
          setErrorMsg('');
        }, 1000);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between items-center p-6 font-sans text-white select-none">
      
      {/* HEADER */}
      <div className="text-center pt-8 space-y-2">
        <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-2xl">
          🔐
        </div>
        <h1 className="text-xl font-black tracking-wider text-white">SOVEREIGN TOOLS</h1>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          ENCLAVE ACCESS LOCKED
        </p>
      </div>

      {/* PIN DISPLAY DOTS */}
      <div className="space-y-3 w-full max-w-xs text-center">
        <div className="flex justify-center items-center gap-3 py-2">
          {Array.from({ length: Math.max(4, pin ? pin.length : 4) }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border transition-all ${
                i < inputPin.length
                  ? 'theme-accent-bg theme-accent-border scale-110 shadow-lg'
                  : 'bg-zinc-950 border-zinc-800'
              }`}
            />
          ))}
        </div>

        {errorMsg ? (
          <p className="text-xs font-mono font-bold text-red-500 animate-pulse">{errorMsg}</p>
        ) : (
          <p className="text-[10px] font-mono text-zinc-400">ENTER SECURITY PIN</p>
        )}
      </div>

      {/* NUMERIC KEYPAD */}
      <div className="w-full max-w-xs space-y-3 pb-8">
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="py-4 bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 text-white font-mono font-bold text-lg rounded-2xl border border-zinc-800 transition-all shadow-md"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleKeyPress('CLEAR')}
            className="py-4 bg-zinc-950 text-zinc-500 hover:text-white font-mono font-bold text-xs rounded-2xl border border-zinc-900"
          >
            CLR
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="py-4 bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 text-white font-mono font-bold text-lg rounded-2xl border border-zinc-800 transition-all shadow-md"
          >
            0
          </button>
          <button
            onClick={() => handleKeyPress('DEL')}
            className="py-4 bg-zinc-950 text-zinc-400 hover:text-white font-mono font-bold text-xs rounded-2xl border border-zinc-900"
          >
            ⌫
          </button>
        </div>
      </div>

    </div>
  );
}
