import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';

export function SovereignClock({ onNavigate }) {
  const { currentTheme } = useSettings();
  const [activeTab, setActiveTab] = useState('Clock'); // 'Clock' | 'Timer' | 'Stopwatch' | 'Alarms'

  // 1. WORLD CLOCK STATE
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. STOPWATCH STATE
  const [swTime, setSwTime] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [swLaps, setSwLaps] = useState([]);

  useEffect(() => {
    let interval;
    if (swRunning) {
      interval = setInterval(() => setSwTime(prev => prev + 10), 10);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [swRunning]);

  const handleLap = () => {
    if (swRunning) {
      setSwLaps([swTime, ...swLaps]);
    }
  };

  const resetStopwatch = () => {
    setSwRunning(false);
    setSwTime(0);
    setSwLaps([]);
  };

  const formatStopwatch = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}.${hundredths < 10 ? '0' : ''}${hundredths}`;
  };

  // 3. COUNTDOWN TIMER STATE
  const [timerDuration, setTimerDuration] = useState(300); // 5 mins default
  const [timerRemaining, setTimerDurationRemaining] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    let interval;
    if (timerRunning && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerDurationRemaining(prev => prev - 1);
      }, 1000);
    } else if (timerRemaining === 0 && timerRunning) {
      setTimerRunning(false);
      setStatusMsg('🔔 TIMER COMPLETE!');
      try {
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audio.play();
      } catch (e) {}
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerRemaining]);

  const startPresetTimer = (secs) => {
    setTimerRunning(false);
    setTimerDuration(secs);
    setTimerDurationRemaining(secs);
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 4. ALARMS STATE
  const [alarms, setAlarms] = useState(() => {
    try {
      const saved = localStorage.getItem('sovereign_alarms');
      return saved ? JSON.parse(saved) : [
        { id: 1, time: '06:00', label: 'Morning Enclave Check', enabled: true },
        { id: 2, time: '15:30', label: 'Shift Transition', enabled: false }
      ];
    } catch {
      return [];
    }
  });

  const [newAlarmTime, setNewAlarmTime] = useState('08:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('sovereign_alarms', JSON.stringify(alarms));
    } catch (e) {}
  }, [alarms]);

  const addAlarm = () => {
    if (!newAlarmTime) return;
    const newEntry = {
      id: Date.now(),
      time: newAlarmTime,
      label: newAlarmLabel.trim() || 'Alarm',
      enabled: true
    };
    setAlarms([...alarms, newEntry]);
    setNewAlarmLabel('');
    setStatusMsg(`⏰ Alarm set for ${newAlarmTime}`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const toggleAlarm = (id) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAlarm = (id) => {
    setAlarms(alarms.filter(a => a.id !== id));
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* HEADER */}
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          ⏰ Sovereign Clock Hub
        </h2>
        <p className="text-xs text-zinc-400 mt-1">Zero-telemetry clock, precision stopwatch, alarms, and timers.</p>
      </div>

      {statusMsg && (
        <div className="theme-accent-badge p-2.5 rounded-xl text-xs font-bold text-center shadow animate-fadeIn">
          {statusMsg}
        </div>
      )}

      {/* NAVIGATION SUBTABS */}
      <div className="flex gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 overflow-x-auto no-scrollbar">
        {['Clock', 'Timer', 'Stopwatch', 'Alarms'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              activeTab === tab ? 'theme-accent-bg text-black shadow scale-105' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 1. CLOCK / OLED NIGHT STAND TAB */}
      {activeTab === 'Clock' && (
        <div className="space-y-4">
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 text-center space-y-2 shadow-2xl">
            <span className="text-[10px] font-mono theme-accent-text tracking-widest uppercase block font-bold">
              LOCAL ENCLAVE TIME
            </span>
            <h1 className="text-5xl font-black font-mono tracking-tight text-white">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h1>
            <p className="text-xs font-mono text-zinc-500">
              {time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* WORLD CLOCK GRID */}
          <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold theme-accent-text uppercase tracking-wider">
              🌐 GLOBAL TIME ZONES
            </h3>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              {[
                { city: 'UTC / GMT', tz: 'UTC' },
                { city: 'New York (EST)', tz: 'America/New_York' },
                { city: 'London (BST)', tz: 'Europe/London' },
                { city: 'Tokyo (JST)', tz: 'Asia/Tokyo' }
              ].map(zone => (
                <div key={zone.city} className="bg-black p-3 rounded-2xl border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-500 block truncate">{zone.city}</span>
                  <span className="text-sm font-bold text-white block">
                    {time.toLocaleTimeString([], { timeZone: zone.tz, hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. COUNTDOWN TIMER TAB */}
      {activeTab === 'Timer' && (
        <div className="bg-zinc-900/90 p-6 rounded-3xl border border-zinc-800 space-y-5 text-center shadow-xl">
          <h3 className="text-xs font-bold theme-accent-text uppercase tracking-wider">
            ⏳ COUNTDOWN TIMER
          </h3>

          <div className="bg-black border border-zinc-800 rounded-3xl p-6 font-mono">
            <span className="text-5xl font-black text-white tracking-tight">
              {formatTimer(timerRemaining)}
            </span>
          </div>

          {/* QUICK PRESETS */}
          <div className="grid grid-cols-5 gap-1.5">
            {[60, 300, 600, 900, 1800].map(secs => (
              <button
                key={secs}
                onClick={() => startPresetTimer(secs)}
                className="bg-black border border-zinc-800 hover:border-zinc-700 text-zinc-300 py-2 rounded-xl text-[10px] font-mono font-bold"
              >
                {secs / 60}m
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className={`flex-1 py-3.5 rounded-2xl font-extrabold text-xs shadow-lg transition-transform active:scale-95 ${
                timerRunning ? 'bg-amber-500 text-black' : 'theme-accent-bg text-black'
              }`}
            >
              {timerRunning ? '⏸ Pause Timer' : '▶ Start Timer'}
            </button>
            <button
              onClick={() => { setTimerRunning(false); setTimerDurationRemaining(timerDuration); }}
              className="px-5 bg-zinc-800 text-zinc-300 font-bold text-xs rounded-2xl border border-zinc-700"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* 3. STOPWATCH TAB */}
      {activeTab === 'Stopwatch' && (
        <div className="bg-zinc-900/90 p-6 rounded-3xl border border-zinc-800 space-y-5 text-center shadow-xl">
          <h3 className="text-xs font-bold theme-accent-text uppercase tracking-wider">
            ⏱️ PRECISION STOPWATCH
          </h3>

          <div className="bg-black border border-zinc-800 rounded-3xl p-6 font-mono">
            <span className="text-4xl font-black text-white tracking-tight">
              {formatStopwatch(swTime)}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSwRunning(!swRunning)}
              className={`flex-1 py-3.5 rounded-2xl font-extrabold text-xs shadow-lg transition-transform active:scale-95 ${
                swRunning ? 'bg-amber-500 text-black' : 'theme-accent-bg text-black'
              }`}
            >
              {swRunning ? '⏸ Pause' : '▶ Start'}
            </button>
            <button
              onClick={handleLap}
              disabled={!swRunning}
              className="px-4 bg-zinc-800 text-white font-bold text-xs rounded-2xl border border-zinc-700 disabled:opacity-40"
            >
              Lap
            </button>
            <button
              onClick={resetStopwatch}
              className="px-4 bg-zinc-800 text-zinc-400 font-bold text-xs rounded-2xl border border-zinc-700"
            >
              Reset
            </button>
          </div>

          {/* LAPS LIST */}
          {swLaps.length > 0 && (
            <div className="bg-black border border-zinc-800 rounded-2xl p-3 max-h-40 overflow-y-auto space-y-1 font-mono text-xs">
              {swLaps.map((lap, i) => (
                <div key={i} className="flex justify-between border-b border-zinc-900 pb-1 text-zinc-400">
                  <span>Lap {swLaps.length - i}</span>
                  <span className="text-white font-bold">{formatStopwatch(lap)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. ALARMS TAB */}
      {activeTab === 'Alarms' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold theme-accent-text uppercase tracking-wider">
              ⏰ SET NEW LOCAL ALARM
            </h3>

            <div className="flex gap-2">
              <input
                type="time"
                value={newAlarmTime}
                onChange={(e) => setNewAlarmTime(e.target.value)}
                className="bg-black border border-zinc-800 text-white font-mono text-xs rounded-2xl px-3 py-2.5 focus:outline-none"
              />
              <input
                type="text"
                value={newAlarmLabel}
                onChange={(e) => setNewAlarmLabel(e.target.value)}
                placeholder="Alarm Label..."
                className="flex-1 bg-black border border-zinc-800 text-white font-mono text-xs rounded-2xl px-3 py-2.5 focus:outline-none"
              />
              <button
                onClick={addAlarm}
                className="theme-accent-bg text-black font-bold text-xs px-4 rounded-2xl shadow"
              >
                Add
              </button>
            </div>
          </div>

          {/* ACTIVE ALARMS LIST */}
          <div className="space-y-2">
            {alarms.map(alarm => (
              <div key={alarm.id} className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 flex justify-between items-center shadow-lg">
                <div>
                  <span className="text-xl font-mono font-bold text-white block">{alarm.time}</span>
                  <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">{alarm.label}</span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={alarm.enabled}
                    onChange={() => toggleAlarm(alarm.id)}
                    className="accent-cyan-400 w-5 h-5 cursor-pointer"
                  />
                  <button onClick={() => deleteAlarm(alarm.id)} className="text-xs text-red-400 font-bold hover:underline">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER & BATTERY DOZE DISCLAIMER */}
      <div className="space-y-2 pt-2">
        <p className="text-[10px] text-zinc-400 flex items-start gap-1.5 px-1 leading-relaxed">
          <span className="theme-accent-text">ℹ️</span>
          <span>
            <strong>About Sovereign Clock & Alarm Engine:</strong> Operates entirely on local device hardware. Ensure Android battery optimization is set to "Unrestricted" for Sovereign Tools so background Doze mode does not defer alarm triggers.
          </span>
        </p>
      </div>

    </div>
  );
}
