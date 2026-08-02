import React, { useState, useEffect } from 'react';

export function LocalCalendar({ onNavigate }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDateStr, setSelectedDateStr] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  );

  // Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('9:00 AM');
  const [eventNotes, setEventNotes] = useState('');
  const [recurrence, setRecurrence] = useState('One-time Event');
  const [setPhoneAlarm, setSetPhoneAlarm] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  // Local Storage for Scheduled Events
  const [events, setEvents] = useState(() => {
    try {
      const stored = localStorage.getItem('sovereign_calendar_events');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sovereign_calendar_events', JSON.stringify(events));
    } catch (e) {}
  }, [events]);

  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  // Calendar Days Calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const saveEvent = (e) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      setStatusMsg('❌ Event title is required.');
      setTimeout(() => setStatusMsg(''), 3000);
      return;
    }

    const newEvent = {
      id: Date.now(),
      date: selectedDateStr,
      title: eventTitle.trim(),
      time: eventTime,
      notes: eventNotes.trim(),
      recurrence,
      alarm: setPhoneAlarm
    };

    setEvents([newEvent, ...events]);
    setEventTitle('');
    setEventNotes('');
    setStatusMsg(`💾 Event saved for ${selectedDateStr}!`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(ev => ev.id !== id));
  };

  const selectedDateEvents = events.filter(ev => ev.date === selectedDateStr);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* HEADER */}
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          📅 Sovereign Calendar
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Zero-telemetry planner with native alarms & notes
        </p>
      </div>

      {/* TOAST NOTIFICATION */}
      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg animate-fadeIn">
          {statusMsg}
        </div>
      )}

      {/* MONTH GRID CARD */}
      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
        <div className="flex justify-between items-center px-1">
          <button
            onClick={handlePrevMonth}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-xs font-bold rounded-xl border border-zinc-700"
          >
            ‹ Prev
          </button>
          <span className="text-sm font-black text-white font-mono tracking-wider">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-xs font-bold rounded-xl border border-zinc-700"
          >
            Next ›
          </button>
        </div>

        {/* DAY HEADERS */}
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-zinc-500 font-mono">
          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
        </div>

        {/* DAYS GRID */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDateStr;
            const hasEvent = events.some(e => e.date === dateStr);

            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`h-9 rounded-xl font-mono text-xs font-bold flex flex-col items-center justify-center relative transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-black shadow-lg scale-105'
                    : 'bg-black/60 text-white border border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <span>{dayNum}</span>
                {hasEvent && !isSelected && (
                  <span className="w-1 h-1 bg-cyan-400 rounded-full absolute bottom-1"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* NEW EVENT FORM ENCLAVE */}
      <form onSubmit={saveEvent} className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
          NEW EVENT FOR {selectedDateStr}
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="Event Title..."
            className="col-span-2 bg-black border border-zinc-800 rounded-2xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          />
          <select
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            className="bg-black border border-zinc-800 rounded-2xl px-2 py-2.5 text-xs text-cyan-400 font-mono focus:outline-none"
          >
            {['8:00 AM', '9:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM', '10:00 PM'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <textarea
          value={eventNotes}
          onChange={(e) => setEventNotes(e.target.value)}
          placeholder="Detailed notes or reminders..."
          className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-xs text-white font-mono h-20 focus:outline-none focus:border-cyan-500 resize-none"
        />

        <div className="grid grid-cols-2 gap-2 items-center">
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
            className="bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none"
          >
            <option value="One-time Event">One-time Event</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>

          <label className="flex items-center gap-2 bg-black border border-zinc-800 p-2.5 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={setPhoneAlarm}
              onChange={(e) => setSetPhoneAlarm(e.target.checked)}
              className="accent-cyan-400"
            />
            <span className="text-xs font-bold text-white font-mono">Set Phone Alarm</span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-2xl shadow active:scale-95 transition-transform flex items-center justify-center gap-1.5"
        >
          💾 Save to Calendar Vault
        </button>
      </form>

      {/* SCHEDULE LIST */}
      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-2">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
          SCHEDULE FOR {selectedDateStr} ({selectedDateEvents.length})
        </h3>

        {selectedDateEvents.length === 0 ? (
          <p className="text-xs text-zinc-500 font-mono text-center py-6">
            No events scheduled for this date.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedDateEvents.map((ev) => (
              <div key={ev.id} className="bg-black/80 p-3 rounded-2xl border border-zinc-800 flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{ev.title}</span>
                    <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded font-mono">
                      {ev.time}
                    </span>
                  </div>
                  {ev.notes && <p className="text-[10px] text-zinc-400 font-mono">{ev.notes}</p>}
                </div>
                <button
                  onClick={() => deleteEvent(ev.id)}
                  className="text-red-400 text-xs font-bold hover:bg-red-950/50 px-2 py-1 rounded-lg"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
