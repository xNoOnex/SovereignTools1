import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';

const AlarmIntentBridge = registerPlugin('AlarmIntentBridge');

export function Calendar({ onNavigate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [alarmTime, setAlarmTime] = useState('');
  const [alarmLabel, setAlarmLabel] = useState('');
  const [recurrence, setRecurrence] = useState('None');
  const [agenda, setAgenda] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('sovereign_agenda');
    if (saved) setAgenda(JSON.parse(saved));
  }, []);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleSetAlarm = async () => {
    if (!alarmTime) return alert("Select a time.");
    
    const [hours, minutes] = alarmTime.split(':');
    let parsedHour = parseInt(hours, 10);
    const parsedMin = parseInt(minutes, 10);

    const newAgendaItem = {
      id: Date.now(),
      date: selectedDate.toLocaleDateString(),
      time: alarmTime,
      label: alarmLabel || 'Sovereign Alarm',
      recurrence
    };

    const updatedAgenda = [...agenda, newAgendaItem];
    setAgenda(updatedAgenda);
    localStorage.setItem('sovereign_agenda', JSON.stringify(updatedAgenda));

    try {
      // Fire Native OS Alarm Intent
      await AlarmIntentBridge.setNativeAlarm({
        hour: parsedHour,
        minute: parsedMin,
        message: newAgendaItem.label,
        skipUi: true // Set silently in background
      });
    } catch (e) {
      console.warn("Native alarm bridge skipped (web context).", e);
    }

    setAlarmTime('');
    setAlarmLabel('');
  };

  const deleteAgendaItem = (id) => {
    const updated = agenda.filter(item => item.id !== id);
    setAgenda(updated);
    localStorage.setItem('sovereign_agenda', JSON.stringify(updated));
  };

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty slots before 1st day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(year, month, d);
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
      const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;

      days.push(
        <div 
          key={d} 
          onClick={() => setSelectedDate(thisDate)}
          className={`aspect-square flex items-center justify-center text-xs font-bold rounded-full cursor-pointer transition-all ${isSelected ? 'bg-cyan-500 text-black shadow-lg scale-110' : isToday ? 'border border-cyan-500/50 text-cyan-400' : 'text-zinc-300 hover:bg-zinc-800'}`}
        >
          {d}
        </div>
      );
    }
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto pb-32 select-none font-sans text-white animate-fadeIn">
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <span className="text-3xl">📅</span> Sovereign Calendar
        </h2>
        <p className="text-xs text-zinc-400 mt-2">Local scheduling and native offline OS alarms.</p>
      </div>

      {/* INTERACTIVE CALENDAR GRID */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-3xl shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center bg-black rounded-full border border-zinc-700 text-zinc-400 active:scale-95">◀</button>
          <span className="text-sm font-black tracking-widest uppercase">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center bg-black rounded-full border border-zinc-700 text-zinc-400 active:scale-95">▶</button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day, i) => (
            <div key={i} className="text-center text-[9px] font-bold text-zinc-500">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarGrid()}
        </div>
      </div>

      {/* ALARM BINDING TOOL */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-lg">
        <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-4">Set Native OS Alarm</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1 block mb-1">Target Date</label>
            <div className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-zinc-300">{selectedDate.toLocaleDateString()}</div>
          </div>
          
          <div>
            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1 block mb-1">Target Time (24H)</label>
            <input type="time" value={alarmTime} onChange={e => setAlarmTime(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500" />
          </div>

          <div>
            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1 block mb-1">Recurrence Schedule</label>
            <select value={recurrence} onChange={e => setRecurrence(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-cyan-500 appearance-none">
              <option>None (One-time)</option>
              <option>Daily</option>
              <option>Weekly</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1 block mb-1">Alarm Label</label>
            <input type="text" value={alarmLabel} onChange={e => setAlarmLabel(e.target.value)} placeholder="e.g., Begin Shift" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500" />
          </div>
        </div>

        <button onClick={handleSetAlarm} className="w-full py-4 mt-4 bg-cyan-500 text-black font-black text-xs uppercase tracking-widest rounded-xl active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
          + Lock In Schedule
        </button>
      </div>

      {/* AGENDA VIEW */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-3xl shadow-lg">
        <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-4">Active Agenda</h3>
        
        {agenda.length === 0 ? (
          <div className="text-center text-zinc-600 font-mono text-xs py-4">No schedules active.</div>
        ) : (
          <div className="space-y-2">
            {agenda.map(item => (
              <div key={item.id} className="bg-black border border-zinc-800 p-3 rounded-xl flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{item.label}</span>
                  <span className="text-[9px] font-mono text-zinc-500">{item.date} • {item.time} ({item.recurrence})</span>
                </div>
                <button onClick={() => deleteAgendaItem(item.id)} className="w-8 h-8 bg-red-950/40 text-red-400 rounded-full flex items-center justify-center text-xs border border-red-900/50 active:scale-95">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
