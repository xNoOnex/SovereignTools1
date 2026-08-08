import React, { useState } from 'react';

export function StealthCalc({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('STANDARD');
  const [payMultiplier, setPayMultiplier] = useState(1);

  // Standard & Scientific State
  const [display, setDisplay] = useState('0');

  // Timesheet State
  const [shifts, setShifts] = useState([{ id: Date.now(), start: '16:00', end: '22:00' }]);
  const [hourlyRate, setHourlyRate] = useState('');

  // Tax State
  const [taxMode, setTaxMode] = useState('INCOME'); // 'INCOME' or 'FLAT'
  const [income, setIncome] = useState('');
  const [fedRate, setFedRate] = useState('12.0'); 
  const [stateRate, setStateRate] = useState('2.5');
  
  const [basicAmount, setBasicAmount] = useState('');
  const [basicRate, setBasicRate] = useState('');

  // --- MATH LOGIC ---
  const handleNum = (n) => {      
    setDisplay(prev => prev === '0' && n !== '.' ? n : prev + n);
  };
  const clear = () => setDisplay('0');
  
  const evalMath = () => {
    try {
      let eq = display
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/\^/g, '**');
      
      const result = new Function('return ' + eq)();
      if (!isFinite(result) || isNaN(result)) throw new Error('Math Error');
      setDisplay(String(Math.round(result * 1000000) / 1000000));
    } catch {
      setDisplay('Error');
      setTimeout(() => setDisplay('0'), 1500);
    }
  };

  // --- TIMESHEET LOGIC ---
  const addShift = () => {
    setShifts([...shifts, { id: Date.now(), start: '16:00', end: '22:00' }]);
  };

  const updateShift = (id, field, value) => {
    setShifts(shifts.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeShift = (id) => {
    if (shifts.length > 1) {
      setShifts(shifts.filter(s => s.id !== id));
    }
  };

  const calculateTimesheetData = () => {
    let totalMinutes = 0;
    shifts.forEach(shift => {
      if (shift.start && shift.end) {
        const [startH, startM] = shift.start.split(':').map(Number);
        const [endH, endM] = shift.end.split(':').map(Number);
        let diff = (endH * 60 + endM) - (startH * 60 + startM);
        if (diff < 0) diff += 24 * 60; // handle overnight
        totalMinutes += diff;
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeString = `${hours}h ${mins}m`;
    
    const rate = parseFloat(hourlyRate) || 0;
    const grossPay = (totalMinutes / 60) * rate;
    
    return { timeString, grossPay };
  };
  const timesheetData = calculateTimesheetData();

  // --- TAX LOGIC ---
  const calculateIncomeTaxes = () => {
    const gross = parseFloat(income) || 0;
    const fed = gross * ((parseFloat(fedRate) || 0) / 100);
    const state = gross * ((parseFloat(stateRate) || 0) / 100);
    const net = gross - fed - state;
    return { gross, fed, state, net };
  };
  const incomeTaxData = calculateIncomeTaxes();

  const calculateFlatTax = () => {
    const base = parseFloat(basicAmount) || 0;
    const rate = parseFloat(basicRate) || 0;
    const taxAmount = base * (rate / 100);
    return {
      taxAmount,
      plusTax: base + taxAmount,
      minusTax: base - taxAmount
    };
  };
  const flatTaxData = calculateFlatTax();

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen flex flex-col relative z-10 animate-fadeIn">
      
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-2xl font-black text-white flex items-center gap-3"><span className="text-3xl drop-shadow">🧮</span> Stealth Calculator</h2>
        <p className="text-xs text-zinc-400 mt-2">Isolated, multi-engine mathematical processor.</p>
      </div>

      {/* MULTI-CALC TABS */}
      <div className="flex gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 shrink-0 overflow-x-auto no-scrollbar shadow-inner">
        {['STANDARD', 'SCIENTIFIC', 'TIMESHEET', 'TAX'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all shrink-0 ${activeTab === tab ? 'theme-accent-bg text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* STANDARD & SCIENTIFIC MODULE */}
      {(activeTab === 'STANDARD' || activeTab === 'SCIENTIFIC') && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="bg-black/60 border border-zinc-800 p-6 rounded-3xl my-4 text-right font-mono text-4xl theme-accent-text truncate shadow-inner overflow-x-auto">
            {display}
          </div>

          <div className="grid grid-cols-4 gap-3">
            {activeTab === 'SCIENTIFIC' && (
              <>
                <button onClick={() => handleNum('sin(')} className="h-14 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 active:scale-95 shadow">sin</button>
                <button onClick={() => handleNum('cos(')} className="h-14 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 active:scale-95 shadow">cos</button>
                <button onClick={() => handleNum('tan(')} className="h-14 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 active:scale-95 shadow">tan</button>
                <button onClick={() => handleNum('log(')} className="h-14 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 active:scale-95 shadow">log</button>
                
                <button onClick={() => handleNum('sqrt(')} className="h-14 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 active:scale-95 shadow">√</button>
                <button onClick={() => handleNum('^')} className="h-14 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 active:scale-95 shadow">^</button>
                <button onClick={() => handleNum('(')} className="h-14 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 active:scale-95 shadow">(</button>
                <button onClick={() => handleNum(')')} className="h-14 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 active:scale-95 shadow">)</button>
              </>
            )}

            {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','.','+'].map(btn => (
              <button key={btn} onClick={() => {
                if (btn === 'C') clear();
                else handleNum(btn);
              }} className={`h-16 rounded-2xl text-xl font-bold active:scale-95 transition-all shadow ${['/','*','-','+'].includes(btn) ? 'bg-zinc-800 text-white border border-zinc-700' : btn === 'C' ? 'bg-red-950/40 text-red-500 border border-red-900/50' : 'theme-glass-panel text-white hover:bg-[var(--glass-border)]'}`}>
                {btn}
              </button>
            ))}
            <button onClick={evalMath} className="col-span-4 h-16 theme-accent-bg text-black font-black text-xl rounded-2xl active:scale-95 shadow-lg tracking-widest">=</button>
          </div>
        </div>
      )}

      {/* TIMESHEET MODULE */}
      {activeTab === 'TIMESHEET' && (
        <div className="flex-1 flex flex-col space-y-4 animate-fadeIn">
          
          <div className="flex gap-3 shrink-0">
            <div className="flex-1 bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-3xl shadow-xl flex flex-col justify-between">
              <h3 className="text-[10px] font-bold theme-accent-text uppercase tracking-widest">Total Hours</h3>
              <span className="text-2xl font-mono font-bold text-white mt-1">{timesheetData.timeString}</span>
            </div>
            
            <div className="flex-1 bg-black/60 border border-zinc-800 p-4 rounded-3xl shadow-inner flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Est. Gross</h3>
                <input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="Wage/hr" className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-[10px] text-white font-mono focus:outline-none" />
              </div>
              <span className="text-2xl font-mono font-bold text-emerald-400">${timesheetData.grossPay.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pb-4">
            {shifts.map((shift, idx) => (
              <div key={shift.id} className="bg-black/60 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-inner">
                <span className="text-[10px] font-bold text-zinc-500 uppercase w-12">Day {idx + 1}</span>
                <input type="time" value={shift.start} onChange={(e) => updateShift(shift.id, 'start', e.target.value)} className="bg-zinc-900 text-white text-xs font-mono p-2 rounded-lg border border-zinc-700 focus:outline-none" />
                <span className="text-zinc-500 text-xs">➔</span>
                <input type="time" value={shift.end} onChange={(e) => updateShift(shift.id, 'end', e.target.value)} className="bg-zinc-900 text-white text-xs font-mono p-2 rounded-lg border border-zinc-700 focus:outline-none" />
                <button onClick={() => removeShift(shift.id)} className="w-8 h-8 flex items-center justify-center bg-red-950/30 text-red-500 border border-red-900/50 rounded-lg active:scale-95">✕</button>
              </div>
            ))}
            <button onClick={addShift} className="w-full py-4 bg-zinc-800 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow active:scale-95 border border-zinc-700">
              + Add Work Day
            </button>
          </div>
        </div>
      )}

      {/* TAX AUDITOR MODULE */}
      {activeTab === 'TAX' && (
        <div className="flex-1 flex flex-col space-y-4 animate-fadeIn overflow-y-auto">
          
          <div className="flex gap-2 bg-black border border-zinc-800 p-1 rounded-2xl shrink-0 shadow-inner">
            <button onClick={() => setTaxMode('INCOME')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${taxMode === 'INCOME' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>Income Auditor</button>
            <button onClick={() => setTaxMode('FLAT')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${taxMode === 'FLAT' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>Flat / Sales</button>
          </div>

          {taxMode === 'INCOME' ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl shadow-xl space-y-4">
                <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest">Gross Income</h3>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-zinc-500 font-mono font-bold">$</span>
                  <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="0.00" className="w-full bg-black border border-zinc-800 rounded-xl pl-8 pr-4 py-4 text-sm text-white font-mono focus:outline-none shadow-inner" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Est. Federal (%)</span>
                    <input type="number" value={fedRate} onChange={(e) => setFedRate(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none shadow-inner" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Est. State (%)</span>
                    <input type="number" value={stateRate} onChange={(e) => setStateRate(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none shadow-inner" />
                  </div>
                </div>
              </div>

              <div className="bg-black/80 border border-zinc-800 p-6 rounded-3xl space-y-4 shadow-inner">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Net Take-Home Yield</h3>
                <div className="flex justify-between font-mono text-xs"><span className="text-zinc-500">Gross:</span><span className="text-zinc-300">${incomeTaxData.gross.toFixed(2)}</span></div>
                <div className="flex justify-between font-mono text-xs"><span className="text-red-400">Fed Deduction:</span><span className="text-red-400">-${incomeTaxData.fed.toFixed(2)}</span></div>
                <div className="flex justify-between font-mono text-xs"><span className="text-red-400">State Deduction:</span><span className="text-red-400">-${incomeTaxData.state.toFixed(2)}</span></div>
                <div className="flex justify-between font-mono text-lg font-bold border-t border-zinc-800 pt-3"><span className="theme-accent-text">Net Income:</span><span className="text-white">${incomeTaxData.net.toFixed(2)}</span></div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl shadow-xl space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Base Amount</h3>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-zinc-500 font-mono font-bold">$</span>
                      <input type="number" value={basicAmount} onChange={(e) => setBasicAmount(e.target.value)} placeholder="0.00" className="w-full bg-black border border-zinc-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white font-mono focus:outline-none shadow-inner" />
                    </div>
                  </div>
                  <div className="col-span-1">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Rate (%)</h3>
                    <div className="relative">
                      <input type="number" value={basicRate} onChange={(e) => setBasicRate(e.target.value)} placeholder="0.0" className="w-full bg-black border border-zinc-800 rounded-xl pr-6 pl-3 py-3 text-sm text-white font-mono focus:outline-none shadow-inner text-right" />
                      <span className="absolute right-3 top-3.5 text-zinc-500 font-mono font-bold">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black/80 border border-zinc-800 p-6 rounded-3xl space-y-4 shadow-inner">
                <div className="flex justify-between font-mono text-xs border-b border-zinc-800 pb-3"><span className="text-zinc-500">Calculated Tax Amount:</span><span className="text-zinc-300">${flatTaxData.taxAmount.toFixed(2)}</span></div>
                <div className="flex justify-between font-mono text-sm font-bold items-center">
                  <span className="text-emerald-400 uppercase tracking-widest text-[10px]">Add (+)</span>
                  <span className="text-white">${flatTaxData.plusTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-mono text-sm font-bold items-center">
                  <span className="text-red-400 uppercase tracking-widest text-[10px]">Subtract (-)</span>
                  <span className="text-white">${flatTaxData.minusTax.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab !== 'TAX' && (
        <div className="shrink-0 mt-4 theme-glass-panel backdrop-blur border border-[var(--glass-border)] p-4 rounded-3xl shadow-lg">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-2"><span>ℹ️</span> Module Info & Disclaimers</h4>
          <p className="text-[9px] text-zinc-500 font-mono leading-relaxed text-justify">
            The Stealth Calculator provides standard offline mathematical evaluations. Calculations and timesheet data execute in isolated local RAM and are not retained in persistent storage.
          </p>
        </div>
      )}
    </div>
  );
}
