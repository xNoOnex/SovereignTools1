import React, { useState, useEffect } from 'react';

export function WorldClock({ onNavigate }) {
  const [localTime, setLocalTime] = useState(new Date());
  const [selectedZone, setSelectedZone] = useState('America/Phoenix'); // Defaults to MST/No-DST logic
  const [worldTime, setWorldTime] = useState('');

  const timezones = [
    { label: 'MST (Arizona)', value: 'America/Phoenix' },
    { label: 'UTC (Zulu)', value: 'UTC' },
    { label: 'EST (New York)', value: 'America/New_York' },
    { label: 'CST (Chicago)', value: 'America/Chicago' },
    { label: 'PST (Los Angeles)', value: 'America/Los_Angeles' },
    { label: 'GMT (London)', value: 'Europe/London' },
    { label: 'CET (Paris)', value: 'Europe/Paris' },
    { label: 'JST (Tokyo)', value: 'Asia/Tokyo' },
    { label: 'AEST (Sydney)', value: 'Australia/Sydney' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLocalTime(now);
      
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: selectedZone,
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        setWorldTime(formatter.format(now));
      } catch (e) {
        setWorldTime('Invalid Zone');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedZone]);

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto pb-32 select-none font-sans text-white animate-fadeIn">
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <span className="text-3xl text-cyan-400">🌍</span> Global Time
        </h2>
        <p className="text-xs text-zinc-400 mt-2">Local chronometer and global timezone tracker.</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl text-center shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full scale-150"></div>
        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest relative z-10">Local System Time</span>
        <h3 className="text-5xl font-black text-white mt-4 tracking-tighter relative z-10">
          {localTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
        </h3>
        <span className="text-xs font-mono text-zinc-500 mt-2 relative z-10">
          {localTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-lg">
         <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">World Clock Explorer</h4>
         <select 
            value={selectedZone} 
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-cyan-500 appearance-none"
         >
            {timezones.map(tz => (
               <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
         </select>
         
         <div className="bg-black border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center mt-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{timezones.find(t => t.value === selectedZone)?.label}</span>
            <span className="text-3xl font-black text-cyan-400 font-mono tracking-wider">{worldTime}</span>
         </div>
      </div>
    </div>
  );
}
