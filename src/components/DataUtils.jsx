import React, { useState } from 'react';

export function DataUtils({ onNavigate }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('SHA-256'); 

  const processData = async () => {
    if (mode === 'UUID') {
      setOutput(crypto.randomUUID());
      return;
    }
    if (!input) {
      setOutput('Awaiting input...');
      return;
    }
    
    try {
      if (mode === 'SHA-256') {
        const msgUint8 = new TextEncoder().encode(input);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setOutput(hashHex);
      } else if (mode === 'BASE64_ENC') {
        setOutput(btoa(input));
      } else if (mode === 'BASE64_DEC') {
        setOutput(atob(input));
      } else if (mode === 'HEX_ENC') {
        setOutput(input.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
      }
    } catch (error) {
      setOutput('ERR: Invalid payload for selected operation.');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4 text-zinc-300 animate-fadeIn bg-black">
      
      {/* Header matching your Cryptographic Engine */}
      <div className="flex items-center justify-between pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2 text-zinc-100">
            <span className="text-2xl">🧰</span> Data Utilities
          </h2>
          <p className="text-xs font-mono text-zinc-500">Offline Hash & Encoding Engine</p>
        </div>
        <button 
          onClick={() => onNavigate('home')} 
          className="text-zinc-300 bg-zinc-900 px-4 py-1.5 rounded-full text-xs font-bold border border-zinc-800 active:scale-95 hover:text-cyan-400 transition-all"
        >
          Exit
        </button>
      </div>

      {/* Mode Selectors */}
      <div className="flex gap-2 font-mono text-xs overflow-x-auto pb-2 shrink-0">
        {['SHA-256', 'BASE64_ENC', 'BASE64_DEC', 'HEX_ENC', 'UUID'].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setOutput(''); if (m === 'UUID') processData(); }}
            className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap font-bold uppercase tracking-wide ${
              mode === m 
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
            }`}
          >
            {m.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2 shrink-0">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Raw Payload</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter string to process..."
          className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm font-mono text-zinc-300 focus:border-cyan-500 focus:outline-none resize-none shadow-inner"
        />
      </div>

      {/* Execute Button */}
      <button
        onClick={processData}
        className="w-full py-4 bg-cyan-500 text-black rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
      >
        <span>⚡</span> Execute Operation
      </button>

      {/* Output */}
      <div className="flex flex-col gap-2 flex-grow min-h-0">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Generated Output</label>
        <textarea
          readOnly
          value={output}
          className="w-full flex-grow bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm font-mono text-cyan-500 focus:outline-none resize-none break-all"
        />
      </div>
    </div>
  );
}
