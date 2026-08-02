import React, { useState, useEffect } from 'react';

export function Calendar({ onNavigate }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [alarmTime, setAlarmTime] = useState('16:00');
  const [alarmTitle, setAlarmTitle] = useState('');
  const [alarms, setAlarms] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('sovereign_alarms') || '[]');
    setAlarms(saved);
  }, []);

  const saveAlarm = () => {
    if (!alarmTitle || !alarmTime) return;
    const newAlarm = { id: Date.now(), date: selectedDate, time: alarmTime, title: alarmTitle };
    const updated = [...alarms, newAlarm].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    setAlarms(updated);
    localStorage.setItem('sovereign_alarms', JSON.stringify(updated));
    setAlarmTitle('');
  };

  const deleteAlarm = (id) => {
    const updated = alarms.filter(a => a.id !== id);
    setAlarms(updated);
    localStorage.setItem('sovereign_alarms', JSON.stringify(updated));
  };

  const formatTime = (time24) => {
    const [h, m] = time24.split(':');
    const hours = parseInt(h, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const standard = hours % 12 || 12;
    return `${standard}:${m} ${suffix}`;
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">📅 Sovereign Calendar</h2>
        <p className="text-xs text-zinc-400 mt-1">Local scheduling and offline alarms.</p>
      </div>

      <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
        <h3 className="text-xs font-bold theme-accent-text uppercase">SET NEW ALARM</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-zinc-400 font-bold ml-1 mb-1 block uppercase">Select Date</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none block" style={{ WebkitAppearance: 'none' }} />
          </div>
          
          <div>
            <label className="text-[10px] text-zinc-400 font-bold ml-1 mb-1 block uppercase">Select Time</label>
            <input type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none block" style={{ WebkitAppearance: 'none' }} />
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 font-bold ml-1 mb-1 block uppercase">Alarm Label</label>
            <input type="text" value={alarmTitle} onChange={(e) => setAlarmTitle(e.target.value)} placeholder="e.g., Begin Shift" className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none" />
          </div>

          <button onClick={saveAlarm} className="w-full py-3 theme-accent-bg text-black font-extrabold text-xs rounded-2xl shadow active:scale-95 mt-2">
            + Lock In Schedule
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
         <h3 className="text-xs font-bold theme-accent-text uppercase">ACTIVE AGENDA</h3>
         {alarms.length === 0 ? (
           <div className="text-center text-zinc-500 font-mono text-xs py-6">No schedules active.</div>
         ) : (
           <div className="space-y-2">
             {alarms.map(alarm => (
               <div key={alarm.id} className="bg-black border border-zinc-800 rounded-2xl p-4 flex justify-between items-center">
                 <div>
                   <span className="text-white font-bold block text-sm">{alarm.title}</span>
                   <span className="text-[10px] text-zinc-400 font-mono block mt-1">{alarm.date} • {formatTime(alarm.time)}</span>
                 </div>
                 <button onClick={() => deleteAlarm(alarm.id)} className="bg-red-950/40 text-red-400 border border-red-900 px-3 py-1.5 rounded-xl text-xs font-bold">
                   Clear
                 </button>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
}
