import React, { useState } from 'react';

export default function CryptoTools() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('SHA-256'); 

  const processData = async () => {
    if (!input) {
      setOutput('Awaiting input...');
      return;
    }
    
    try {
      if (mode === 'SHA-256') {
        // Native WebCrypto Hashing
        const msgUint8 = new TextEncoder().encode(input);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setOutput(hashHex);
      } else if (mode === 'ENCODE_B64') {
        // Native Base64 Encoding
        setOutput(btoa(input));
      } else if (mode === 'DECODE_B64') {
        // Native Base64 Decoding
        setOutput(atob(input));
      } else if (mode === 'HEX') {
        // Text to Hexadecimal
        const hex = input.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
        setOutput(hex);
      }
    } catch (error) {
      setOutput('ERR: Invalid payload for selected operation.');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4 text-zinc-300 animate-fadeIn">
      <div className="border-b border-rose-900 pb-2 shrink-0">
        <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-widest text-rose-500">
          <span className="text-2xl">🔐</span> Crypto Deck
        </h2>
        <p className="text-xs font-mono text-zinc-500">Zero-permission offline cryptography engine.</p>
      </div>

      <div className="flex gap-2 font-mono text-xs overflow-x-auto pb-2 shrink-0">
        {['SHA-256', 'ENCODE_B64', 'DECODE_B64', 'HEX'].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setOutput(''); }}
            className={`px-3 py-1.5 rounded-sm border transition-all whitespace-nowrap ${
              mode === m ? 'border-rose-500 text-rose-400 bg-rose-950/30' : 'border-zinc-800 text-zinc-500'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 shrink-0">
        <label className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Raw Payload</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter string to process..."
          className="w-full h-32 bg-black border border-zinc-800 rounded-md p-3 text-sm font-mono text-zinc-300 focus:border-rose-900 focus:outline-none resize-none shadow-inner"
        />
      </div>

      <button
        onClick={processData}
        className="w-full py-3 bg-rose-900/20 border border-rose-900/50 text-rose-500 rounded-md font-bold uppercase tracking-widest active:scale-[0.98] transition-transform shadow-md"
      >
        Execute ⚡
      </button>

      <div className="flex flex-col gap-2 flex-grow min-h-0">
        <label className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Generated Output</label>
        <textarea
          readOnly
          value={output}
          className="w-full flex-grow bg-zinc-950 border border-zinc-900 rounded-md p-3 text-sm font-mono text-emerald-500 focus:outline-none resize-none break-all"
        />
      </div>
    </div>
  );
}
