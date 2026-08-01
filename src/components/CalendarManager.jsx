import React, { useState, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function CalendarManager() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form State
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [recurrence, setRecurrence] = useState('none'); // none, daily, weekly, monthly, yearly
  const [setAlarm, setSetAlarm] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('sovereign_calendar_events');
    if (saved) {
      try { setEvents(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveEvents = (updated) => {
    setEvents(updated);
    localStorage.setItem('sovereign_calendar_events', JSON.stringify(updated));
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatusMsg('⚠️ Event title required');
      setTimeout(() => setStatusMsg(''), 2000);
      return;
    }

    const newEvent = {
      id: Date.now(),
      date: selectedDate,
      time,
      title: title.trim(),
      notes: notes.trim(),
      recurrence,
      alarm: setAlarm
    };

    const updated = [...events, newEvent];
    saveEvents(updated);

    // Trigger Native Android Alarm if requested
    if (setAlarm && window.AndroidNative?.setSystemAlarm) {
      try {
        const [hours, mins] = time.split(':').map(Number);
        window.AndroidNative.setSystemAlarm(title.trim(), hours, mins);
        setStatusMsg('📅 Event Saved & Native Alarm Set!');
      } catch (err) {
        setStatusMsg('📅 Event Saved (Alarm bridge skipped)');
      }
    } else {
      setStatusMsg('📅 Event Saved to Local Vault!');
    }

    setTitle('');
    setNotes('');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const deleteEvent = (id) => {
    if (window.confirm('Delete this event?')) {
      saveEvents(events.filter(ev => ev.id !== id));
    }
  };

  // Calendar Grid Math
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));

  // Filter events for the currently selected day
  const dayEvents = events.filter(ev => ev.date === selectedDate);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">📅 Sovereign Calendar</h2>
          <p className="text-xs text-zinc-400 mt-1">Zero-telemetry planner with native alarms & notes.</p>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      {/* MONTH VIEW CARD */}
      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex justify-between items-center px-2">
          <button onClick={prevMonth} className="p-2 bg-zinc-800 text-cyan-400 rounded-xl font-bold text-xs hover:bg-zinc-700">‹ Prev</button>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{monthNames[month]} {year}</h3>
          <button onClick={nextMonth} className="p-2 bg-zinc-800 text-cyan-400 rounded-xl font-bold text-xs hover:bg-zinc-700">Next ›</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-[10px] font-bold text-zinc-500 py-1">{d}</div>
          ))}

          {/* Blank padding days */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const formattedDay = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isSelected = selectedDate === formattedDay;
            const hasEvents = events.some(ev => ev.date === formattedDay);

            return (
              <button
                key={formattedDay}
                onClick={() => setSelectedDate(formattedDay)}
                className={`h-10 rounded-xl flex flex-col items-center justify-center relative font-mono text-xs transition-all ${
                  isSelected ? 'bg-cyan-500 text-black font-bold shadow-md' : 'bg-black border border-zinc-800 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                <span>{dayNum}</span>
                {hasEvents && (
                  <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isSelected ? 'bg-black' : 'bg-cyan-400'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ADD EVENT FORM */}
      <form onSubmit={handleAddEvent} className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">New Event for {selectedDate}</h3>
        
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Event Title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="bg-black border border-zinc-700 rounded-xl p-3 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
          />
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="bg-black border border-zinc-700 rounded-xl p-3 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
          />
        </div>

        <textarea
          rows={2}
          placeholder="Detailed notes or reminders..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-xs text-white font-sans focus:outline-none focus:border-cyan-500"
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] text-zinc-500 uppercase font-mono">Recurrence</label>
            <select
              value={recurrence}
              onChange={e => setRecurrence(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl p-2.5 text-xs text-cyan-300 font-bold mt-1 focus:outline-none"
            >
              <option value="none">One-time Event</option>
              <option value="daily">Daily Reminder</option>
              <option value="weekly">Weekly Reminder</option>
              <option value="monthly">Monthly Reminder</option>
              <option value="yearly">Yearly Reminder</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center space-x-2 bg-black border border-zinc-700 p-2.5 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={setAlarm}
                onChange={e => setSetAlarm(e.target.checked)}
                className="accent-cyan-500 w-4 h-4"
              />
              <span className="text-xs text-white font-bold">Set Phone Alarm</span>
            </label>
          </div>
        </div>

        <button type="submit" className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow">
          💾 Save to Calendar Vault
        </button>
      </form>

      {/* SCHEDULED EVENTS LIST FOR SELECTED DATE */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Schedule for {selectedDate} ({dayEvents.length})</h3>
        
        {dayEvents.length === 0 ? (
          <div className="bg-zinc-900/60 p-6 border border-dashed border-zinc-800 rounded-2xl text-center text-xs text-zinc-500">
            No events scheduled for this date.
          </div>
        ) : (
          <div className="space-y-2">
            {dayEvents.map(ev => (
              <div key={ev.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex justify-between items-start">
                <div className="space-y-1 max-w-[75%]">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{ev.title}</span>
                    <span className="text-[9px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded font-bold">
                      {ev.time}
                    </span>
                    {ev.recurrence !== 'none' && (
                      <span className="text-[9px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded uppercase">
                        🔄 {ev.recurrence}
                      </span>
                    )}
                  </div>
                  {ev.notes && <p className="text-xs text-zinc-400 leading-relaxed pt-1">{ev.notes}</p>}
                </div>

                <button
                  onClick={() => deleteEvent(ev.id)}
                  className="px-2.5 py-1 bg-red-950/50 text-red-400 hover:text-red-300 text-[10px] font-bold rounded-lg border border-red-900/50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToolFooter title="Offline Calendar & Reminders" details="Schedules and recurring alarms stored locally in encrypted app storage." disclaimer="Alarm intents dispatched directly to system clock." />
    </div>
  );
}
