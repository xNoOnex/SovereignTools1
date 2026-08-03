import React, { useState, useEffect, useRef } from 'react';
import { useComms } from '../context/CommsContext';

export function Comms({ onNavigate }) {
  const { 
    localSDP, status, messages, 
    createOffer, acceptRemoteSDP, sendMessage, disconnect 
  } = useComms();
  
  const [inputMsg, setInputMsg] = useState('');
  const [tempRemoteSDP, setTempRemoteSDP] = useState('');
  const scrollRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    sendMessage(inputMsg);
    setInputMsg('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(localSDP);
    alert('Local handshake copied to clipboard.');
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white min-h-screen flex flex-col relative z-10 animate-fadeIn">
      
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2"><span className="text-2xl drop-shadow">📡</span> Encrypted Comms</h2>
          <p className="text-xs text-zinc-400 mt-1">True serverless WebRTC local mesh.</p>
        </div>
        {status === 'CONNECTED' && (
          <button onClick={disconnect} className="bg-red-950/40 border border-red-900/50 text-red-400 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 shadow">
            Sever Mesh
          </button>
        )}
      </div>

      <div className="flex justify-center shrink-0">
        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-inner border ${
          status === 'CONNECTED' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' : 
          status.includes('GENERATING') ? 'bg-amber-950/40 text-amber-400 border-amber-900/50 animate-pulse' : 
          'bg-zinc-900/80 text-zinc-500 border-zinc-800'
        }`}>
          STATUS: {status}
        </span>
      </div>

      {status !== 'CONNECTED' ? (
        <div className="flex-1 space-y-5 overflow-y-auto pt-2">
          
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest flex items-center gap-2"><span>1️⃣</span> INITIALIZE</h3>
            <p className="text-[10px] text-zinc-400 font-mono">Generate a local Session Description Protocol (SDP) block to act as the host for this mesh session.</p>
            <button onClick={createOffer} className="w-full py-4 theme-accent-bg text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-transform">
              Generate Local Host Offer
            </button>
            
            {localSDP && (
              <div className="space-y-2 animate-fadeIn pt-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Your Handshake Payload</span>
                  <button onClick={copyToClipboard} className="text-[9px] bg-zinc-800 text-white px-3 py-1 rounded-lg shadow active:scale-95">COPY</button>
                </div>
                <textarea readOnly value={localSDP} className="w-full bg-black/60 border border-zinc-800 rounded-xl p-3 text-[8px] text-zinc-400 font-mono h-20 focus:outline-none shadow-inner" />
              </div>
            )}
          </div>

          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-5 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold theme-accent-text uppercase tracking-widest flex items-center gap-2"><span>2️⃣</span> CONNECT</h3>
            <p className="text-[10px] text-zinc-400 font-mono">Paste the remote peer's SDP handshake payload below to establish the encrypted tunnel.</p>
            <textarea value={tempRemoteSDP} onChange={(e) => setTempRemoteSDP(e.target.value)} placeholder="Paste remote SDP block here..." className="w-full bg-black/60 border border-zinc-800 rounded-xl p-3 text-[8px] text-emerald-400 font-mono h-24 focus:outline-none shadow-inner placeholder-zinc-700" />
            <button onClick={() => acceptRemoteSDP(tempRemoteSDP)} className="w-full py-4 bg-zinc-800 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-transform border border-zinc-700 hover:bg-zinc-700">
              Accept Remote Handshake
            </button>
          </div>

        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-3xl p-5 overflow-y-auto space-y-4 shadow-inner flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 space-y-3">
                <span className="text-4xl">🔐</span>
                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">P2P Mesh Established<br/>End-to-End Encrypted</p>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed shadow-md ${
                    m.sender === 'user' 
                      ? 'theme-accent-bg text-black font-bold rounded-br-sm' 
                      : 'bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono rounded-bl-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={handleSend} className="flex gap-2 shrink-0 pt-2">
            <input type="text" value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} placeholder="Type P2P payload..." className="flex-1 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-2xl px-5 py-4 text-xs text-white font-mono focus:outline-none shadow-inner placeholder-zinc-600" />
            <button type="submit" disabled={!inputMsg.trim()} className="theme-accent-bg text-black font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50">
              SEND
            </button>
          </form>
        </>
      )}

      <div className="shrink-0 mt-4 bg-zinc-900/50 backdrop-blur border border-zinc-800 p-4 rounded-3xl shadow-lg">
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-2"><span>ℹ️</span> Module Info & Disclaimers</h4>
        <p className="text-[9px] text-zinc-500 font-mono leading-relaxed text-justify">
          Encrypted Comms operates via manual WebRTC Session Description Protocol (SDP) exchanges. It bypasses external signaling servers entirely, requiring manual out-of-band exchange of SDP blocks to initiate a direct, peer-to-peer local mesh network.
        </p>
      </div>

    </div>
  );
}
