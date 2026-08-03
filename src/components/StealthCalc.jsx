import React, { useState } from 'react';

export function StealthCalc({ onNavigate }) {
  const [display, setDisplay] = useState('0');

  const handleNum = (n) => {      
    setDisplay(prev => prev === '0' ? n : prev + n);
  };

  const clear = () => setDisplay('0');

  const evalMath = () => {
    try {
      setDisplay(String(eval(display)));
    } catch {
      setDisplay('Error');
    }
  };

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen flex flex-col justify-between animate-fadeIn relative z-10">
      <div>
        <div className="flex justify-between items-center border-b border-zinc-900 pb-3 pt-2 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">🧮 Stealth Calculator</h2>
        </div>

        <div className="bg-black border border-zinc-800 p-6 rounded-3xl my-6 text-right font-mono text-3xl text-emerald-400 truncate shadow-inner">
          {display}
        </div>

        <div className="grid grid-cols-4 gap-3">
          {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'].map(btn => (
            <button key={btn} onClick={() => {
              if (btn === 'C') clear();
              else if (btn === '=') evalMath();
              else handleNum(btn);
            }} className="h-16 bg-zinc-900 border border-zinc-800 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all shadow">
              {btn}
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 mt-4 bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl shadow-xl">
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span>ℹ️</span> Module Info & Disclaimers</h4>
        <p className="text-[10px] text-zinc-500 font-mono leading-relaxed text-justify">
          The Stealth Calculator provides standard offline mathematical evaluations. Calculations execute in isolated local RAM and are purged upon exit.
        </p>
      </div>
    </div>
  );
}
