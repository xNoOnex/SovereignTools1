import React, { useState } from 'react';

export function Comms({ onNavigate }) {
  const [messages, setMessages] = useState([
    { sender: 'system', text: 'Secure P2P Enclave initialized. Ready for encrypted local mesh relay.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userText = input.trim();
    setInput('');
    setMessages(prev => [
      ...prev, 
      { sender: 'user', text: userText },
      { sender: 'peer', text: `[AES-256 ACK] Encrypted relay received: "${userText}"` }
    ]);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen flex flex-col">
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">📡 Encrypted Comms</h2>
        <p className="text-xs text-zinc-400 mt-1">P2P decentralized local mesh relay simulator.</p>
      </div>

      <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-3xl p-4 overflow-y-auto space-y-3 min-h-[300px] max-h-[450px]">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : m.sender === 'peer' ? 'justify-start' : 'justify-center'}`}>
            <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${m.sender === 'user' ? 'theme-accent-bg text-black font-semibold' : m.sender === 'peer' ? 'bg-zinc-900 text-zinc-200 border border-zinc-800 font-mono' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-500 font-mono text-[10px]'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 shrink-0 pt-1">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Type encrypted payload..." 
          className="flex-1 bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none"
        />
        <button type="submit" className="theme-accent-bg text-black font-extrabold text-xs px-5 py-3 rounded-2xl shadow">TRANSMIT</button>
      </form>
    </div>
  );
}
