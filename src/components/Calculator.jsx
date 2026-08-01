import React, { useState } from 'react';
import { ToolFooter } from './ToolFooter';

export function Calculator() {
  const [activeTab, setActiveTab] = useState('basic'); // basic, scientific, timesheet, tax

  // --- MATH CALCULATOR STATE (Basic & Sci) ---
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');

  const handleMathInput = (val) => {
    setExpression((prev) => prev + val);
  };

  const handleClear = () => {
    setExpression('');
    setResult('');
  };

  const handleDelete = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const calculateMath = () => {
    try {
      // Safe replacement for basic math evaluation
      let sanitized = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E');
      
      const evalResult = new Function('return ' + sanitized)();
      setResult(Number.isFinite(evalResult) ? parseFloat(evalResult.toFixed(8)).toString() : 'Error');
    } catch (err) {
      setResult('Error');
    }
  };

  // --- TIMESHEET STATE ---
  const [hourlyRate, setHourlyRate] = useState('');
  const [timeRows, setTimeRows] = useState([
    { id: 1, start: '16:00', end: '22:00', breakMins: 0 }
  ]);

  const addTimeRow = () => {
    setTimeRows([...timeRows, { id: Date.now(), start: '', end: '', breakMins: 0 }]);
  };

  const updateTimeRow = (id, field, value) => {
    setTimeRows(timeRows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const removeTimeRow = (id) => {
    setTimeRows(timeRows.filter(row => row.id !== id));
  };

  const calculateTimesheet = () => {
    let totalHours = 0;
    timeRows.forEach(row => {
      if (row.start && row.end) {
        const [startH, startM] = row.start.split(':').map(Number);
        const [endH, endM] = row.end.split(':').map(Number);
        let startTotal = startH + startM / 60;
        let endTotal = endH + endM / 60;
        if (endTotal < startTotal) endTotal += 24; // Handle overnight shifts
        let hours = endTotal - startTotal - (row.breakMins / 60);
        if (hours > 0) totalHours += hours;
      }
    });
    const grossPay = totalHours * (parseFloat(hourlyRate) || 0);
    return { hours: totalHours.toFixed(2), pay: grossPay.toFixed(2) };
  };

  const timesheetTotals = calculateTimesheet();

  // --- TAX STATE ---
  const [grossIncome, setGrossIncome] = useState('');
  const [filingStatus, setFilingStatus] = useState('single');
  const [stateTaxRate, setStateTaxRate] = useState('2.5'); // Default flat rate percentage

  const calculateTaxes = () => {
    const gross = parseFloat(grossIncome) || 0;
    const stdDeduction = filingStatus === 'single' ? 14600 : 29200;
    const taxable = Math.max(0, gross - stdDeduction);
    
    // Simplified 2024/2026 Fed Brackets
    let fedTax = 0;
    if (filingStatus === 'single') {
      if (taxable > 11600) fedTax += 1160;
      else fedTax += taxable * 0.10;
      if (taxable > 47150) fedTax += (47150 - 11600) * 0.12;
      else if (taxable > 11600) fedTax += (taxable - 11600) * 0.12;
      if (taxable > 100525) fedTax += (100525 - 47150) * 0.22;
      else if (taxable > 47150) fedTax += (taxable - 47150) * 0.22;
    } else {
      if (taxable > 23200) fedTax += 2320;
      else fedTax += taxable * 0.10;
      if (taxable > 94300) fedTax += (94300 - 23200) * 0.12;
      else if (taxable > 23200) fedTax += (taxable - 23200) * 0.12;
    }

    const ficaTax = gross * 0.0765; // Social Security + Medicare
    const stateTax = gross * ((parseFloat(stateTaxRate) || 0) / 100);
    const netPay = gross - fedTax - ficaTax - stateTax;

    return {
      fed: fedTax.toFixed(2),
      fica: ficaTax.toFixed(2),
      state: stateTax.toFixed(2),
      net: netPay.toFixed(2)
    };
  };

  const taxTotals = calculateTaxes();

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🧮 Multi-Calc Engine</h2>
        <p className="text-xs text-zinc-400 mt-1">Four localized calculators for everyday tasks.</p>
      </div>

      {/* SUB-TABS */}
      <div className="flex space-x-1 overflow-x-auto text-xs font-bold bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 no-scrollbar">
        {['basic', 'scientific', 'timesheet', 'tax'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 rounded-xl transition-all capitalize whitespace-nowrap ${
              activeTab === tab ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* BASIC & SCIENTIFIC CALCULATORS */}
      {(activeTab === 'basic' || activeTab === 'scientific') && (
        <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
          <div className="bg-black p-4 rounded-2xl border border-zinc-800 h-24 flex flex-col justify-end items-end overflow-hidden relative shadow-inner">
            <div className="text-zinc-400 text-xs font-mono mb-1">{expression || '0'}</div>
            <div className="text-3xl text-cyan-300 font-bold font-mono tracking-wider">{result || '='}</div>
          </div>

          {activeTab === 'scientific' && (
            <div className="grid grid-cols-4 gap-2 mb-2">
              {['sin(', 'cos(', 'tan(', 'log(', 'ln(', 'sqrt(', '^', 'π', 'e'].map(op => (
                <button key={op} onClick={() => handleMathInput(op)} className="bg-zinc-800 py-2 rounded-xl text-cyan-400 font-mono text-xs hover:bg-zinc-700">{op}</button>
              ))}
              <button onClick={() => handleMathInput('(')} className="bg-zinc-800 py-2 rounded-xl text-cyan-400 font-mono text-xs hover:bg-zinc-700">(</button>
              <button onClick={() => handleMathInput(')')} className="bg-zinc-800 py-2 rounded-xl text-cyan-400 font-mono text-xs hover:bg-zinc-700">)</button>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            <button onClick={handleClear} className="bg-red-950/50 text-red-400 py-4 rounded-xl font-bold text-lg hover:bg-red-900/50">AC</button>
            <button onClick={handleDelete} className="bg-zinc-800 text-cyan-400 py-4 rounded-xl font-bold text-lg hover:bg-zinc-700">⌫</button>
            <button onClick={() => handleMathInput('÷')} className="bg-zinc-800 text-cyan-400 py-4 rounded-xl font-bold text-xl hover:bg-zinc-700">÷</button>
            <button onClick={() => handleMathInput('×')} className="bg-zinc-800 text-cyan-400 py-4 rounded-xl font-bold text-xl hover:bg-zinc-700">×</button>

            {['7', '8', '9', '-'].map(btn => (
              <button key={btn} onClick={() => handleMathInput(btn)} className={`py-4 rounded-xl font-bold text-xl hover:bg-zinc-700 ${btn === '-' ? 'bg-zinc-800 text-cyan-400' : 'bg-zinc-900 border border-zinc-800 text-white'}`}>{btn}</button>
            ))}
            {['4', '5', '6', '+'].map(btn => (
              <button key={btn} onClick={() => handleMathInput(btn)} className={`py-4 rounded-xl font-bold text-xl hover:bg-zinc-700 ${btn === '+' ? 'bg-zinc-800 text-cyan-400' : 'bg-zinc-900 border border-zinc-800 text-white'}`}>{btn}</button>
            ))}
            
            <button onClick={() => handleMathInput('1')} className="bg-zinc-900 border border-zinc-800 text-white py-4 rounded-xl font-bold text-xl hover:bg-zinc-700">1</button>
            <button onClick={() => handleMathInput('2')} className="bg-zinc-900 border border-zinc-800 text-white py-4 rounded-xl font-bold text-xl hover:bg-zinc-700">2</button>
            <button onClick={() => handleMathInput('3')} className="bg-zinc-900 border border-zinc-800 text-white py-4 rounded-xl font-bold text-xl hover:bg-zinc-700">3</button>
            <button onClick={calculateMath} className="row-span-2 bg-cyan-500 text-black py-4 rounded-xl font-bold text-2xl shadow-lg hover:bg-cyan-400">=</button>

            <button onClick={() => handleMathInput('0')} className="col-span-2 bg-zinc-900 border border-zinc-800 text-white py-4 rounded-xl font-bold text-xl hover:bg-zinc-700">0</button>
            <button onClick={() => handleMathInput('.')} className="bg-zinc-900 border border-zinc-800 text-white py-4 rounded-xl font-bold text-xl hover:bg-zinc-700">.</button>
          </div>
        </div>
      )}

      {/* TIMESHEET CALCULATOR */}
      {activeTab === 'timesheet' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Hourly Rate ($)</label>
            <input type="number" placeholder="e.g. 15.50" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white text-sm font-mono mt-1 focus:outline-none focus:border-cyan-500" />
          </div>

          <div className="space-y-2">
            {timeRows.map((row, idx) => (
              <div key={row.id} className="bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800 flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[30%]">
                  <label className="text-[9px] text-zinc-500 uppercase">Start Time</label>
                  <input type="time" value={row.start} onChange={e => updateTimeRow(row.id, 'start', e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-white text-xs mt-1" />
                </div>
                <div className="flex-1 min-w-[30%]">
                  <label className="text-[9px] text-zinc-500 uppercase">End Time</label>
                  <input type="time" value={row.end} onChange={e => updateTimeRow(row.id, 'end', e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-white text-xs mt-1" />
                </div>
                <div className="w-20">
                  <label className="text-[9px] text-zinc-500 uppercase">Break (m)</label>
                  <input type="number" value={row.breakMins} onChange={e => updateTimeRow(row.id, 'breakMins', Number(e.target.value))} className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-white text-xs mt-1" />
                </div>
                {timeRows.length > 1 && (
                  <button onClick={() => removeTimeRow(row.id)} className="p-2 bg-red-950/50 text-red-400 rounded-lg border border-red-900/50 mb-0.5">✕</button>
                )}
              </div>
            ))}
            <button onClick={addTimeRow} className="w-full py-2 bg-zinc-800 border border-zinc-700 text-cyan-400 font-bold text-xs rounded-xl hover:bg-zinc-700">+ Add Shift Row</button>
          </div>

          <div className="bg-black p-4 rounded-2xl border border-emerald-500/50 flex justify-between items-center shadow-lg">
            <div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Total Hours</div>
              <div className="text-xl font-mono text-white">{timesheetTotals.hours}h</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Gross Pay</div>
              <div className="text-2xl font-mono text-emerald-400 font-bold">${timesheetTotals.pay}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAX CALCULATOR */}
      {activeTab === 'tax' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <div>
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Gross Annual Income ($)</label>
              <input type="number" placeholder="50000" value={grossIncome} onChange={e => setGrossIncome(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white text-sm font-mono mt-1 focus:outline-none focus:border-cyan-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Filing Status</label>
                <select value={filingStatus} onChange={e => setFilingStatus(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-cyan-300 text-xs mt-1 focus:outline-none">
                  <option value="single">Single</option>
                  <option value="married">Married (Joint)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">State Tax Rate (%)</label>
                <input type="number" step="0.1" value={stateTaxRate} onChange={e => setStateTaxRate(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white text-xs font-mono mt-1 focus:outline-none focus:border-cyan-500" />
              </div>
            </div>
          </div>

          <div className="bg-black p-4 rounded-2xl border border-zinc-800 space-y-3 shadow-lg">
            <h3 className="text-[10px] font-bold text-cyan-400 uppercase border-b border-zinc-800 pb-2">Estimated Breakdown</h3>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">Gross Income:</span>
              <span className="text-white">${parseFloat(grossIncome || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">Federal Tax (Est):</span>
              <span className="text-red-400">-${taxTotals.fed}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">FICA (SS & Med):</span>
              <span className="text-red-400">-${taxTotals.fica}</span>
            </div>
            <div className="flex justify-between text-xs font-mono border-b border-zinc-800 pb-2">
              <span className="text-zinc-400">State Tax:</span>
              <span className="text-red-400">-${taxTotals.state}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[12px] font-bold text-emerald-400 uppercase">Estimated Take Home:</span>
              <span className="text-xl font-bold font-mono text-emerald-400">${taxTotals.net}</span>
            </div>
          </div>
        </div>
      )}

      <ToolFooter title="Offline Calculator Engine" details="All mathematical evaluations and tax bracket estimations occur strictly locally on the device." disclaimer="Tax engine uses simplified brackets for estimation purposes only." />
    </div>
  );
}
