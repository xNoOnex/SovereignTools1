import { BleScout } from '../services/BleMeshEngine';

import { QRCodeSVG } from 'qrcode.react';
import React, { useState, useEffect, useRef } from 'react';
import { useComms } from '../context/CommsContext';

export function Comms({ onNavigate }) {
  const { 
    localSDP, status, messages, 
    createOffer, acceptRemoteSDP, sendMessage, disconnect 
  } = useComms();
  
  const [inputMsg, setInputMsg] = useState('');
  const [bleActive, setBleActive] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);
  const [meshConnected, setMeshConnected] = useState(false);
  const [qrSyncData, setQrSyncData] = useState('');
  const [apActive, setApActive] = useState(false);
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

  
    const logSync = (msg) => {
        setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-5));
    };

    const triggerGossipSync = (dataChannel) => {
        logSync("GOSSIP PROTOCOL INITIATED.");
        const ledgers = {};
        
        // Rummage through local storage for encrypted vaults
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('swarm_ledger_')) {
                ledgers[key] = localStorage.getItem(key);
            }
        }
        
        const payload = JSON.stringify({ type: 'SWARM_SYNC', data: ledgers });
        dataChannel.send(payload);
        logSync(`TRANSMITTED ${Object.keys(ledgers).length} ENCRYPTED BLOCKS.`);
    };

    const handleIncomingGossip = (event) => {
        try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'SWARM_SYNC') {
                logSync(`RECEIVED ${Object.keys(payload.data).length} ENCRYPTED BLOCKS.`);
                let updated = 0;
                
                Object.keys(payload.data).forEach(key => {
                    const localData = localStorage.getItem(key);
                    const incomingData = payload.data[key];
                    
                    // Basic length-based overwrite (assumes longer string = more messages)
                    // In a production environment, you'd decrypt and merge based on timestamps
                    if (!localData || incomingData.length > localData.length) {
                        localStorage.setItem(key, incomingData);
                        updated++;
                    }
                });
                
                if (updated > 0) logSync(`${updated} LOCAL VAULTS UPDATED.`);
                else logSync("LOCAL VAULTS ALREADY UP TO DATE.");
            }
        } catch (e) {
            console.log("Ignored non-gossip data packet.");
        }
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

            {/* Gossip Sync Terminal */}
            <div className="border border-indigo-900/50 bg-indigo-950/20 rounded-2xl p-4 shadow-lg shrink-0 mt-4">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                   <span className="flex items-center gap-2"><span>📡</span> Background Sync Engine</span>
                   {meshConnected ? <span className="text-emerald-500">LINKED</span> : <span className="text-zinc-500">IDLE</span>}
                </h3>
                <div className="bg-black border border-zinc-800 rounded-lg p-3 h-24 overflow-y-auto font-mono text-[9px] text-emerald-400 flex flex-col justify-end">
                    {syncLogs.length === 0 ? (
                        <span className="text-zinc-600">Awaiting WebRTC Peer Connection...</span>
                    ) : (
                        syncLogs.map((log, i) => <span key={i}>{log}</span>)
                    )}
                </div>
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

        {/* Layer 2: Wi-Fi Firehose */}

            {/* Layer 1: BLE Scout Engine */}
            <div className="border border-blue-900/50 bg-blue-950/20 rounded-2xl p-4 shadow-lg shrink-0 mb-4 mt-2">
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                   <span className="flex items-center gap-2"><span>📡</span> BLE Scout (Layer 1)</span>
                   {bleActive && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>}
                </h3>
                <p className="text-[11px] text-blue-200/70 mb-4 leading-relaxed font-sans">
                   Deploy a low-energy background scanner to silently ping nearby peers (30ft) and blindly swap encrypted Swarm ledgers without Wi-Fi.
                </p>
                <div className="flex gap-2 mt-3">
                   <button 
                      onClick={async () => { 
                          setBleActive(true); 
                          await BleScout.deployScout(logSync); 
                      }} 
                      className="flex-1 bg-blue-900/60 border border-blue-500/50 text-blue-400 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-blue-500 hover:text-black transition-all shadow-inner active:scale-95">
                      DEPLOY SCOUT
                   </button>
                   <button 
                      onClick={async () => { 
                          setBleActive(false); 
                          await BleScout.killScout(logSync); 
                      }} 
                      className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-400 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-zinc-800 transition-all active:scale-95">
                      RECALL
                   </button>
                </div>
            </div>
        
        <div className="mb-4 space-y-4">
            <div className="border border-emerald-900/50 bg-emerald-950/20 rounded-2xl p-4 shadow-lg shrink-0">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <span>📡</span> Hardware Mesh Engine {apActive && <span className="ml-auto flex h-2 w-2 relative mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                </h3>
                <p className="text-[11px] text-emerald-200/70 mb-4 leading-relaxed font-sans">
                   Force this device's WLAN hardware into Master mode to broadcast an isolated, off-grid network. Peers can join this darknet to perform WebRTC handshakes anywhere on Earth.
                </p>
                <div className="flex gap-2 mt-3">
                   <button 
                      onClick={() => { console.log("cmd connectivity start-tethering wifi"); setApActive(true); }} 
                      className="flex-1 bg-emerald-900/60 border border-emerald-500/50 text-emerald-400 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-emerald-500 hover:text-black transition-all shadow-inner active:scale-95">
                      START DARKNET A.P.
                   </button>
                   <button 
                      onClick={() => { console.log("cmd connectivity stop-tethering wifi"); setApActive(false); }} 
                      className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-400 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-zinc-800 transition-all active:scale-95">
                      KILL A.P.
                   </button>
                </div>
            </div>

            <div className="border border-indigo-900/50 bg-indigo-950/20 rounded-2xl p-4 shadow-lg shrink-0">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <span>📷</span> Optical Sync (QR)
                </h3>
                <p className="text-[11px] text-indigo-200/70 mb-3 leading-relaxed font-sans">
                   Paste your generated handshake code below to instantly convert it into a QR payload for optical transfer.
                </p>
                <textarea 
                    value={qrSyncData} 
                    onChange={(e) => setQrSyncData(e.target.value)}
                    placeholder="Paste bulky handshake here..."
                    className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[10px] text-zinc-400 font-mono focus:outline-none focus:border-indigo-500/50 mb-3"
                />
                {qrSyncData && (
                    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-inner mx-auto w-fit mt-2">
                        <QRCodeSVG value={qrSyncData} size={180} level="L" includeMargin={true} />
                        <span className="text-[9px] text-zinc-500 font-black tracking-widest mt-2 uppercase">Scan to Copy</span>
                    </div>
                )}
            </div>
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
