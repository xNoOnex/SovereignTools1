import React, { useState } from 'react';

export function StealthCalc({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('Tax');
  
  // Basic State
  const [display, setDisplay] = useState('');
  
  // Tax State
  const [taxMode, setTaxMode] = useState('Add'); // 'Add' or 'Extract'
  const [taxBaseInput, setTaxBaseInput] = useState('100.00');
  const [taxRateInput, setTaxRateInput] = useState('8.1');

  // Timesheet State
  const [hourlyRate, setHourlyRate] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');

  const handleCalcPress = (val) => setDisplay(prev => prev + val);
  const calculateBasic = () => {
    try { setDisplay(eval(display).toString()); } 
    catch { setDisplay('Error'); }
  };

  // Tax Logic
  const tBase = parseFloat(taxBaseInput) || 0;
  const tPerc = parseFloat(taxRateInput) || 0;
  
  let calculatedTax = 0;
  let calculatedTotal = 0;
  let calculatedSubtotal = 0;

  if (taxMode === 'Add') {
    calculatedTax = tBase * (tPerc / 100);
    calculatedTotal = tBase + calculatedTax;
    calculatedSubtotal = tBase;
  } else {
    calculatedSubtotal = tBase / (1 + (tPerc / 100));
    calculatedTax = tBase - calculatedSubtotal;
    calculatedTotal = tBase;
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
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold theme-accent-text uppercase">SALES & TRANSACTION TAX</h3>
          </div>

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
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Subtotal:</span>
              <span>${calculatedSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-3">
              <span>Tax Amount:</span>
              <span className={taxMode === 'Add' ? 'text-emerald-400' : 'text-red-400'}>
                {taxMode === 'Add' ? '+' : '-'}${calculatedTax.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold theme-accent-text pt-1">
              <span>{taxMode === 'Add' ? 'Total Out-of-Pocket:' : 'Extracted Subtotal:'}</span>
              <span>${taxMode === 'Add' ? calculatedTotal.toFixed(2) : calculatedSubtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Basic Calc Fallback */}
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

      {activeTab === 'Timesheet' && (
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl animate-fadeIn text-center py-12">
          <span className="text-4xl block mb-2">⏱️</span>
          <p className="text-xs font-mono text-zinc-500">Hourly aggregation matrix.</p>
        </div>
      )}
      
      {activeTab === 'Scientific' && (
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl animate-fadeIn text-center py-12">
          <span className="text-4xl block mb-2">📐</span>
          <p className="text-xs font-mono text-zinc-500">Advanced trigonometry matrix.</p>
        </div>
      )}

    </div>
  );
}
