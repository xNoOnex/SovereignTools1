import React, { useState } from 'react';

export function StealthCalc({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('Timesheet'); // Defaulting to Timesheet to verify it works
  
  // Basic & Scientific State
  const [display, setDisplay] = useState('');
  
  // Tax State
  const [taxMode, setTaxMode] = useState('Add');
  const [taxBaseInput, setTaxBaseInput] = useState('100.00');
  const [taxRateInput, setTaxRateInput] = useState('8.1');

  // Timesheet State
  const [clockIn, setClockIn] = useState('16:00'); // 4:00 PM default
  const [clockOut, setClockOut] = useState('22:00'); // 10:00 PM default
  const [hourlyRate, setHourlyRate] = useState('15.50');

  // Basic/Scientific Logic
  const handleCalcPress = (val) => setDisplay(prev => prev + val);
  const calculateBasic = () => {
    try { setDisplay(eval(display).toString()); } 
    catch { setDisplay('Error'); }
  };
  const calculateTrig = (func) => {
    try {
      const val = parseFloat(display);
      if (isNaN(val)) return setDisplay('Error');
      if (func === 'sin') setDisplay(Math.sin(val).toString());
      if (func === 'cos') setDisplay(Math.cos(val).toString());
      if (func === 'tan') setDisplay(Math.tan(val).toString());
      if (func === 'sqrt') setDisplay(Math.sqrt(val).toString());
      if (func === 'pow') setDisplay(Math.pow(val, 2).toString());
    } catch { setDisplay('Error'); }
  };

  // Tax Logic
  const tBase = parseFloat(taxBaseInput) || 0;
  const tPerc = parseFloat(taxRateInput) || 0;
  let calculatedTax = 0, calculatedTotal = 0, calculatedSubtotal = 0;

  if (taxMode === 'Add') {
    calculatedTax = tBase * (tPerc / 100);
    calculatedTotal = tBase + calculatedTax;
    calculatedSubtotal = tBase;
  } else {
    calculatedSubtotal = tBase / (1 + (tPerc / 100));
    calculatedTax = tBase - calculatedSubtotal;
    calculatedTotal = tBase;
  }

  // Timesheet Logic
  let hoursWorked = 0, grossPay = 0;
  if (clockIn && clockOut) {
    const dIn = new Date(`1970-01-01T${clockIn}:00`);
    let dOut = new Date(`1970-01-01T${clockOut}:00`);
    if (dOut < dIn) dOut.setDate(dOut.getDate() + 1); // Handle overnight shifts
    hoursWorked = (dOut - dIn) / 3600000;
    grossPay = hoursWorked * (parseFloat(hourlyRate) || 0);
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🧮 Stealth Calculator</h2>
        <p className="text-xs text-zinc-400 mt-1">Multi-function offline calculation enclave</p>
      </div>

      <div className="flex gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 overflow-x-auto no-scrollbar">
        {['Basic', 'Scientific', 'Timesheet', 'Tax'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === tab ? 'theme-accent-bg text-black shadow scale-105' : 'text-zinc-400 hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Tax' && (
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-5 shadow-xl animate-fadeIn">
          <div className="flex bg-black p-1 rounded-2xl border border-zinc-800 text-xs font-bold">
            <button onClick={() => setTaxMode('Add')} className={`flex-1 py-2 rounded-xl transition-all ${taxMode === 'Add' ? 'bg-zinc-800 text-emerald-400 shadow' : 'text-zinc-500'}`}>+ Add Tax</button>
            <button onClick={() => setTaxMode('Extract')} className={`flex-1 py-2 rounded-xl transition-all ${taxMode === 'Extract' ? 'bg-zinc-800 text-red-400 shadow' : 'text-zinc-500'}`}>- Extract Tax</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-zinc-400 font-bold ml-1 mb-1 block uppercase">
                {taxMode === 'Add' ? 'Subtotal Amount ($)' : 'Total Gross Amount ($)'}
              </label>
              <input type="number" value={taxBaseInput} onChange={(e) => setTaxBaseInput(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-bold ml-1 mb-1 block uppercase">Tax Percentage (%)</label>
              <input type="number" value={taxRateInput} onChange={(e) => setTaxRateInput(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none" />
            </div>
          </div>

          <div className="bg-black border border-zinc-800 rounded-2xl p-4 space-y-3 font-mono">
            <div className="flex justify-between text-xs text-zinc-400"><span>Subtotal:</span><span>${calculatedSubtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-3">
              <span>Tax Amount:</span>
              <span className={taxMode === 'Add' ? 'text-emerald-400' : 'text-red-400'}>{taxMode === 'Add' ? '+' : '-'}${calculatedTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold theme-accent-text pt-1">
              <span>{taxMode === 'Add' ? 'Total Out-of-Pocket:' : 'Extracted Subtotal:'}</span>
              <span>${taxMode === 'Add' ? calculatedTotal.toFixed(2) : calculatedSubtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Basic' && (
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl animate-fadeIn">
           <div className="bg-black border border-zinc-800 rounded-2xl p-4 text-right text-2xl font-mono text-white min-h-[70px] flex items-center justify-end break-all">
             {display || '0'}
           </div>
           <div className="grid grid-cols-4 gap-2 font-mono text-sm">
             {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(btn => (
               <button key={btn} onClick={() => btn === '=' ? calculateBasic() : handleCalcPress(btn)} className={`py-4 rounded-2xl font-bold active:scale-95 transition-transform ${['/','*','-','+','='].includes(btn) ? 'theme-accent-bg text-black' : 'bg-black border border-zinc-800 text-white'}`}>
                 {btn}
               </button>
             ))}
             <button onClick={() => setDisplay('')} className="col-span-4 bg-red-950/40 text-red-400 border border-red-900 py-3 rounded-2xl font-bold mt-2">CLEAR</button>
           </div>
        </div>
      )}

      {activeTab === 'Scientific' && (
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl animate-fadeIn">
           <div className="bg-black border border-zinc-800 rounded-2xl p-4 text-right text-2xl font-mono text-white min-h-[70px] flex items-center justify-end break-all">
             {display || '0'}
           </div>
           <div className="grid grid-cols-4 gap-2 font-mono text-sm mb-2">
             <button onClick={() => calculateTrig('sin')} className="py-3 bg-zinc-800 rounded-xl font-bold">sin</button>
             <button onClick={() => calculateTrig('cos')} className="py-3 bg-zinc-800 rounded-xl font-bold">cos</button>
             <button onClick={() => calculateTrig('tan')} className="py-3 bg-zinc-800 rounded-xl font-bold">tan</button>
             <button onClick={() => calculateTrig('sqrt')} className="py-3 bg-zinc-800 rounded-xl font-bold">√x</button>
           </div>
           <div className="grid grid-cols-4 gap-2 font-mono text-sm">
             {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(btn => (
               <button key={btn} onClick={() => btn === '=' ? calculateBasic() : handleCalcPress(btn)} className={`py-4 rounded-2xl font-bold active:scale-95 transition-transform ${['/','*','-','+','='].includes(btn) ? 'theme-accent-bg text-black' : 'bg-black border border-zinc-800 text-white'}`}>
                 {btn}
               </button>
             ))}
             <button onClick={() => setDisplay('')} className="col-span-4 bg-red-950/40 text-red-400 border border-red-900 py-3 rounded-2xl font-bold mt-2">CLEAR</button>
           </div>
        </div>
      )}

      {activeTab === 'Timesheet' && (
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-5 shadow-xl animate-fadeIn">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-zinc-400 font-bold ml-1 mb-1 block uppercase">Clock In</label>
              <input type="time" value={clockIn} onChange={(e) => setClockIn(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-3 text-sm text-white font-mono focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-bold ml-1 mb-1 block uppercase">Clock Out</label>
              <input type="time" value={clockOut} onChange={(e) => setClockOut(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-3 text-sm text-white font-mono focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 font-bold ml-1 mb-1 block uppercase">Hourly Rate ($)</label>
            <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none" />
          </div>
          
          <div className="bg-black border border-zinc-800 rounded-2xl p-4 space-y-3 font-mono">
            <div className="flex justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-3">
              <span>Shift Duration:</span>
              <span className="text-emerald-400 font-bold">{hoursWorked.toFixed(2)} Hours</span>
            </div>
            <div className="flex justify-between text-sm font-bold theme-accent-text pt-1">
              <span>Gross Pay (Est):</span>
              <span>${grossPay.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
