import React, { useState, useEffect, useRef } from 'react';
import { registerPlugin } from '@capacitor/core';

const AlarmIntentBridge = registerPlugin('AlarmIntentBridge');

export function WorldClock({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('CLOCK');

  // --- CLOCK STATE ---
  const [localTime, setLocalTime] = useState(new Date());
  const [selectedZone, setSelectedZone] = useState('America/Phoenix');
  const [worldTime, setWorldTime] = useState('');

  // --- STOPWATCH STATE ---
  const [swTime, setSwTime] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const swTimerRef = useRef(null);
  const swStartRef = useRef(0);

  // --- TIMER STATE ---
  const [tHours, setTHours] = useState(0);
  const [tMinutes, setTMinutes] = useState(0);
  const [tSeconds, setTSeconds] = useState(0);
  const [tRemaining, setTRemaining] = useState(0);
  const [tRunning, setTRunning] = useState(false);
  const timerTargetRef = useRef(0);
  const countdownRef = useRef(null);

  // --- ALARM STATE ---
  const [alarmTime, setAlarmTime] = useState('');
  const [alarmLabel, setAlarmLabel] = useState('');

  // --- CLOCK EFFECT ---
  useEffect(() => {
    if (activeTab !== 'CLOCK') return;
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
  }, [selectedZone, activeTab]);

  // --- STOPWATCH LOGIC ---
  const startStopwatch = () => {
    if (swRunning) {
      clearInterval(swTimerRef.current);
      setSwRunning(false);
    } else {
      setSwRunning(true);
      swStartRef.current = Date.now() - swTime;
      swTimerRef.current = setInterval(() => {
        setSwTime(Date.now() - swStartRef.current);
      }, 10);
    }
  };

  const resetStopwatch = () => {
    clearInterval(swTimerRef.current);
    setSwRunning(false);
    setSwTime(0);
    setLaps([]);
  };

  const addLap = () => {
    setLaps([swTime, ...laps]);
  };

  const formatStopwatch = (ms) => {
    const min = Math.floor((ms / 1000 / 60) % 60).toString().padStart(2, '0');
    const sec = Math.floor((ms / 1000) % 60).toString().padStart(2, '0');
    const milli = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    return `${min}:${sec}.${milli}`;
  };

  // --- TIMER LOGIC ---
  const handleStartTimer = () => {
    if (tRunning) {
      clearInterval(countdownRef.current);
      setTRunning(false);
      return;
    }
    
    let totalSeconds = tRemaining;
    if (totalSeconds === 0) {
      totalSeconds = (tHours * 3600) + (tMinutes * 60) + tSeconds;
      if (totalSeconds === 0) return;
      setTRemaining(totalSeconds);
    }

    setTRunning(true);
    timerTargetRef.current = Date.now() + (totalSeconds * 1000);
    
    countdownRef.current = setInterval(() => {
      const left = Math.round((timerTargetRef.current - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(countdownRef.current);
        setTRunning(false);
        setTRemaining(0);
        alert("⚠️ SOVEREIGN TIMER COMPLETE ⚠️");
      } else {
        setTRemaining(left);
      }
    }, 1000);
  };

  const resetTimer = () => {
    clearInterval(countdownRef.current);
    setTRunning(false);
    setTRemaining(0);
    setTHours(0);
    setTMinutes(0);
    setTSeconds(0);
  };

  const formatTimer = (totalSec) => {
    const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // --- ALARM LOGIC ---
  const handleSetAlarm = async () => {
    if (!alarmTime) return alert("Select a time.");
    const [hours, minutes] = alarmTime.split(':');
    let parsedHour = parseInt(hours, 10);
    const parsedMin = parseInt(minutes, 10);
    const label = alarmLabel || 'Sovereign Alarm';

    try {
      await AlarmIntentBridge.setNativeAlarm({
        hour: parsedHour,
        minute: parsedMin,
        message: label,
        skipUi: true
      });
      alert(`Native OS Alarm Set: ${label} at ${alarmTime}`);
    } catch (e) {
      console.warn("Native alarm bridge skipped.", e);
    }
    setAlarmTime('');
    setAlarmLabel('');
  };

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

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto pb-32 select-none font-sans text-white animate-fadeIn">
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <span className="text-3xl text-cyan-400">⏱️</span> Chronos Hub
        </h2>
        <p className="text-xs text-zinc-400 mt-2">Unified temporal matrix and native alarm synchronization.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
        {['CLOCK', 'STOPWATCH', 'TIMER', 'ALARM'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)} 
            className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all shrink-0 ${activeTab === tab ? 'bg-cyan-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* CLOCK TAB */}
      {activeTab === 'CLOCK' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl text-center shadow-xl relative overflow-hidden">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest relative z-10">Local System Time</span>
            <h3 className="text-5xl font-black text-white mt-4 tracking-tighter relative z-10">
              {localTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </h3>
            <span className="text-xs font-mono text-zinc-500 mt-2 relative z-10 block">
              {localTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-3xl shadow-lg">
             <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">World Clock Explorer</h4>
             <select 
                value={selectedZone} 
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-cyan-500 appearance-none mb-4"
             >
                {timezones.map(tz => (
                   <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
             </select>
             <div className="bg-black border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{timezones.find(t => t.value === selectedZone)?.label}</span>
                <span className="text-3xl font-black text-cyan-400 font-mono tracking-wider">{worldTime}</span>
             </div>
          </div>
        </div>
      )}

      {/* STOPWATCH TAB */}
      {activeTab === 'STOPWATCH' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl text-center shadow-xl">
            <h3 className="text-6xl font-black text-white font-mono tracking-tighter tabular-nums">
              {formatStopwatch(swTime)}
            </h3>
            <div className="flex gap-3 justify-center mt-6">
               <button onClick={resetStopwatch} className="w-14 h-14 rounded-full bg-zinc-800 text-white font-bold text-[10px] uppercase tracking-widest active:scale-95 shadow border border-zinc-700">Reset</button>
               <button onClick={startStopwatch} className={`w-14 h-14 rounded-full font-bold text-[10px] uppercase tracking-widest active:scale-95 shadow border ${swRunning ? 'bg-red-900/50 text-red-400 border-red-900' : 'bg-emerald-900/50 text-emerald-400 border-emerald-900'}`}>
                 {swRunning ? 'Stop' : 'Start'}
               </button>
               <button onClick={addLap} disabled={!swRunning} className="w-14 h-14 rounded-full bg-zinc-800 text-white font-bold text-[10px] uppercase tracking-widest active:scale-95 shadow border border-zinc-700 disabled:opacity-50">Lap</button>
            </div>
          </div>
          
          <div className="bg-black border border-zinc-800 p-4 rounded-3xl h-48 overflow-y-auto space-y-2 shadow-inner">
            {laps.length === 0 && <div className="text-center text-zinc-600 font-mono text-xs py-4">No laps recorded.</div>}
            {laps.map((lapMs, idx) => (
              <div key={idx} className="flex justify-between text-xs font-mono p-2 border-b border-zinc-900">
                <span className="text-zinc-500">Lap {laps.length - idx}</span>
                <span className="text-cyan-400">{formatStopwatch(lapMs)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIMER TAB */}
      {activeTab === 'TIMER' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl text-center shadow-xl">
            {tRunning || tRemaining > 0 ? (
              <h3 className="text-6xl font-black text-cyan-400 font-mono tracking-tighter tabular-nums">
                {formatTimer(tRemaining)}
              </h3>
            ) : (
              <div className="flex justify-center gap-2 items-center">
                <div className="flex flex-col items-center">
                  <input type="number" min="0" value={tHours} onChange={e => setTHours(Number(e.target.value))} className="w-16 h-16 bg-black border border-zinc-700 rounded-2xl text-2xl text-center text-white font-bold focus:outline-none focus:border-cyan-500 appearance-none" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase mt-2">Hours</span>
                </div>
                <span className="text-2xl text-zinc-600 pb-5">:</span>
                <div className="flex flex-col items-center">
                  <input type="number" min="0" max="59" value={tMinutes} onChange={e => setTMinutes(Number(e.target.value))} className="w-16 h-16 bg-black border border-zinc-700 rounded-2xl text-2xl text-center text-white font-bold focus:outline-none focus:border-cyan-500 appearance-none" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase mt-2">Mins</span>
                </div>
                <span className="text-2xl text-zinc-600 pb-5">:</span>
                <div className="flex flex-col items-center">
                  <input type="number" min="0" max="59" value={tSeconds} onChange={e => setTSeconds(Number(e.target.value))} className="w-16 h-16 bg-black border border-zinc-700 rounded-2xl text-2xl text-center text-white font-bold focus:outline-none focus:border-cyan-500 appearance-none" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase mt-2">Secs</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-4 justify-center mt-8">
               <button onClick={resetTimer} className="w-32 py-3 rounded-xl bg-zinc-800 text-white font-bold text-[10px] uppercase tracking-widest active:scale-95 shadow border border-zinc-700">Cancel</button>
               <button onClick={handleStartTimer} className={`w-32 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest active:scale-95 shadow border ${tRunning ? 'bg-amber-900/50 text-amber-400 border-amber-900' : 'bg-cyan-600 text-black border-cyan-500'}`}>
                 {tRunning ? 'Pause' : 'Start'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* ALARM TAB */}
      {activeTab === 'ALARM' && (
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-lg animate-fadeIn">
          <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-4">Set Native OS Alarm</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1 block mb-1">Target Time (24H)</label>
              <input type="time" value={alarmTime} onChange={e => setAlarmTime(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1 block mb-1">Alarm Label</label>
              <input type="text" value={alarmLabel} onChange={e => setAlarmLabel(e.target.value)} placeholder="e.g., Wake Up / Shift" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
          <button onClick={handleSetAlarm} className="w-full py-4 mt-4 bg-cyan-500 text-black font-black text-xs uppercase tracking-widest rounded-xl active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
            + Inject Alarm Intent
          </button>
          <p className="text-[9px] text-zinc-500 text-center mt-2 leading-relaxed">
            This module binds directly to Android's native AlarmClock API. Alarms created here will ring even if Sovereign Tools is terminated.
          </p>
        </div>
      )}

    </div>
  );
}
