import React, { useState } from 'react';

export function EncryptedComms() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), text: input, sender: 'Local Node' }]);
    setInput('');
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">📡 Encrypted Comms</h2>
        <p className="text-xs text-zinc-400 mt-1">Local offline peer-to-peer messaging channel.</p>
      </div>

      <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 h-64 overflow-y-auto space-y-2">
        {messages.length === 0 ? (
          <p className="text-xs text-zinc-500 font-mono text-center py-20">No active mesh transmissions.</p>
        ) : (
          messages.map(m => (
            <div key={m.id} className="bg-black/60 p-2.5 rounded-2xl border border-zinc-800">
              <span className="text-[9px] text-cyan-400 font-bold block">{m.sender}</span>
              <p className="text-xs text-white font-mono mt-0.5">{m.text}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Transmit encrypted payload..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
        />
        <button type="submit" className="bg-cyan-600 text-black font-bold text-xs px-4 rounded-2xl shadow">
          Send
        </button>
      </form>
    </div>
  );
}
