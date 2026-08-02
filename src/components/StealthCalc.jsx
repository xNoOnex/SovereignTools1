import React, { useState } from 'react';

export function StealthCalc({ onNavigate }) {
  const [activeSubTab, setActiveSubTab] = useState('Basic'); // 'Basic' | 'Scientific' | 'Timesheet' | 'Tax'
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  // Timesheet Calculator State
  const [hourlyRate, setHourlyRate] = useState('15.00');
  const [hoursWorked, setHoursWorked] = useState('40');
  const [overtimeHours, setOvertimeHours] = useState('0');

  // Tax Calculator State
  const [grossAmount, setGrossAmount] = useState('100.00');
  const [taxRate, setTaxRate] = useState('8.1'); // Arizona default estimate

  // Calculator Logic
  const handleKey = (val) => {
    if (val === 'AC') {
      setDisplay('0');
      setEquation('');
      return;
    }

    if (val === '⌫') {
      if (display.length <= 1) setDisplay('0');
      else setDisplay(display.slice(0, -1));
      return;
    }

    if (val === '=') {
      try {
        const sanitized = display.replace(/×/g, '*').replace(/÷/g, '/');
        const evalResult = Function(`'use strict'; return (${sanitized})`)();
        setEquation(display + ' =');
        setDisplay(String(Number(evalResult.toFixed(8))));
      } catch {
        setDisplay('Error');
      }
      return;
    }

    if (display === '0' || display === 'Error') {
      setDisplay(val);
    } else {
      setDisplay(display + val);
    }
  };

  const handleSciMath = (fn) => {
    try {
      const num = parseFloat(display);
      let res = 0;
      if (fn === 'sin') res = Math.sin(num);
      if (fn === 'cos') res = Math.cos(num);
      if (fn === 'tan') res = Math.tan(num);
      if (fn === 'sqrt') res = Math.sqrt(num);
      if (fn === 'log') res = Math.log10(num);
      if (fn === 'ln') res = Math.log(num);
      setDisplay(String(Number(res.toFixed(8))));
      setEquation(`${fn}(${num}) =`);
    } catch {
      setDisplay('Error');
    }
  };

  // Timesheet Calculation
  const regPay = (parseFloat(hourlyRate) || 0) * (parseFloat(hoursWorked) || 0);
  const otPay = (parseFloat(hourlyRate) || 0) * 1.5 * (parseFloat(overtimeHours) || 0);
  const totalPay = regPay + otPay;

  // Tax Calculation
  const gross = parseFloat(grossAmount) || 0;
  const rate = parseFloat(taxRate) || 0;
  const taxVal = gross * (rate / 100);
  const totalWithTax = gross + taxVal;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* HEADER */}
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🧮 Stealth Calculator
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Multi-function offline calculation enclave
        </p>
      </div>

      {/* MODE SUBTABS */}
      <div className="flex gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 overflow-x-auto no-scrollbar">
        {['Basic', 'Scientific', 'Timesheet', 'Tax'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === tab 
                ? 'bg-cyan-500 text-black shadow-md scale-105' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* SUBTAB 1 & 2: BASIC & SCIENTIFIC DISPLAY & KEYPAD */}
      {(activeSubTab === 'Basic' || activeSubTab === 'Scientific') && (
        <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-2xl">
          
          {/* DISPLAY SCREEN */}
          <div className="bg-black border border-zinc-800 rounded-2xl p-4 text-right min-h-[84px] flex flex-col justify-between">
            <span className="text-[10px] font-mono text-zinc-500 block h-4">{equation}</span>
            <span className="text-3xl font-mono text-cyan-400 font-bold block truncate tracking-wider">{display}</span>
          </div>

          {/* SCIENTIFIC FUNCTION BAR */}
          {activeSubTab === 'Scientific' && (
            <div className="grid grid-cols-4 gap-2 border-b border-zinc-800 pb-3">
              {[
                { label: 'sin', fn: 'sin' },
                { label: 'cos', fn: 'cos' },
                { label: 'tan', fn: 'tan' },
                { label: '√', fn: 'sqrt' },
                { label: 'log', fn: 'log' },
                { label: 'ln', fn: 'ln' },
                { label: 'π', val: '3.14159' },
                { label: 'e', val: '2.71828' }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => item.fn ? handleSciMath(item.fn) : handleKey(item.val)}
                  className="py-2 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 font-mono text-xs font-bold rounded-xl border border-zinc-700"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* MAIN KEYPAD (1:1 Screenshot Layout) */}
          <div className="grid grid-cols-4 gap-2.5">
            {/* ROW 1 */}
            <button onClick={() => handleKey('AC')} className="py-4 bg-red-950/80 hover:bg-red-900 text-red-400 font-bold text-sm rounded-2xl border border-red-800/50">AC</button>
            <button onClick={() => handleKey('⌫')} className="py-4 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 font-bold text-sm rounded-2xl border border-zinc-700">⌫</button>
            <button onClick={() => handleKey('÷')} className="py-4 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 font-bold text-sm rounded-2xl border border-zinc-700">÷</button>
            <button onClick={() => handleKey('×')} className="py-4 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 font-bold text-sm rounded-2xl border border-zinc-700">×</button>

            {/* ROW 2 */}
            <button onClick={() => handleKey('7')} className="py-4 bg-black hover:bg-zinc-800 text-white font-bold text-base rounded-2xl border border-zinc-800">7</button>
            <button onClick={() => handleKey('8')} className="py-4 bg-black hover:bg-zinc-800 text-white font-bold text-base rounded-2xl border border-zinc-800">8</button>
            <button onClick={() => handleKey('9')} className="py-4 bg-black hover:bg-zinc-800 text-white font-bold text-base rounded-2xl border border-zinc-800">9</button>
            <button onClick={() => handleKey('-')} className="py-4 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 font-bold text-sm rounded-2xl border border-zinc-700">-</button>

            {/* ROW 3 */}
            <button onClick={() => handleKey('4')} className="py-4 bg-black hover:bg-zinc-800 text-white font-bold text-base rounded-2xl border border-zinc-800">4</button>
            <button onClick={() => handleKey('5')} className="py-4 bg-black hover:bg-zinc-800 text-white font-bold text-base rounded-2xl border border-zinc-800">5</button>
            <button onClick={() => handleKey('6')} className="py-4 bg-black hover:bg-zinc-800 text-white font-bold text-base rounded-2xl border border-zinc-800">6</button>
            <button onClick={() => handleKey('+')} className="py-4 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 font-bold text-sm rounded-2xl border border-zinc-700">+</button>

            {/* ROW 4 & 5 (Includes vertical double-height = key) */}
            <div className="col-span-3 grid grid-cols-3 gap-2.5">
              <button onClick={() => handleKey('1')} className="py-4 bg-black hover:bg-zinc-800 text-white font-bold text-base rounded-2xl border border-zinc-800">1</button>
              <button onClick={() => handleKey('2')} className="py-4 bg-black hover:bg-zinc-800 text-white font-bold text-base rounded-2xl border border-zinc-800">2</button>
              <button onClick={() => handleKey('3')} className="py-4 bg-black hover:bg-zinc-800 text-white font-bold text-base rounded-2xl border border-zinc-800">3</button>
              
              <button onClick={() => handleKey('0')} className="col-span-2 py-4 bg-black hover:bg-zinc-800 text-white font-bold text-base rounded-2xl border border-zinc-800">0</button>
              <button onClick={() => handleKey('.')} className="py-4 bg-black hover:bg-zinc-800 text-white font-bold text-base rounded-2xl border border-zinc-800">.</button>
            </div>

            <button onClick={() => handleKey('=')} className="row-span-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-2xl rounded-2xl shadow-lg border border-cyan-400 flex items-center justify-center">
              =
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 3: TIMESHEET CALCULATOR */}
      {activeSubTab === 'Timesheet' && (
        <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-2xl">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            Shift Pay & Hours Estimator
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-zinc-400 font-mono block mb-1">Hourly Pay Rate ($)</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-400 font-mono block mb-1">Regular Hours</label>
                <input
                  type="number"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 font-mono block mb-1">Overtime Hours (1.5x)</label>
                <input
                  type="number"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-black p-4 rounded-2xl border border-zinc-800 space-y-2 pt-3">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">Regular Pay:</span>
              <span className="text-white">${regPay.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">Overtime Pay:</span>
              <span className="text-white">${otPay.toFixed(2)}</span>
            </div>
            <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm font-bold font-mono">
              <span className="text-cyan-400">Estimated Gross Pay:</span>
              <span className="text-cyan-400">${totalPay.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: TAX CALCULATOR */}
      {activeSubTab === 'Tax' && (
        <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-2xl">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            Sales & Transaction Tax Estimator
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-zinc-400 font-mono block mb-1">Subtotal Amount ($)</label>
              <input
                type="number"
                value={grossAmount}
                onChange={(e) => setGrossAmount(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-mono block mb-1">Tax Percentage (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="bg-black p-4 rounded-2xl border border-zinc-800 space-y-2 pt-3">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">Tax Amount:</span>
              <span className="text-amber-400">+${taxVal.toFixed(2)}</span>
            </div>
            <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm font-bold font-mono">
              <span className="text-cyan-400">Total Out-of-Pocket:</span>
              <span className="text-cyan-400">${totalWithTax.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
