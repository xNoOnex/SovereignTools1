import React, { useState, useEffect, useRef } from 'react';

export function EncryptedComms({ onNavigate }) {
  const [topMode, setTopMode] = useState('Decentralized P2P');
  const [composerSubTab, setComposerSubTab] = useState('Encrypt Mail');

  // PGP State
  const [recipientKey, setRecipientKey] = useState('');
  const [messageText, setMessageText] = useState('');
  const [encryptedBlock, setEncryptedBlock] = useState('');
  const [decryptedOutput, setDecryptedOutput] = useState('');
  const [keypair, setKeypair] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  // REAL WEBRTC STATE
  const [p2pRole, setP2pRole] = useState(null); // 'HOST' | 'JOIN'
  const [localSdp, setLocalSdp] = useState('');
  const [remoteSdp, setRemoteSdp] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  const [p2pMessages, setP2pMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [p2pMessages]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setStatusMsg(`📋 Copied ${label} to clipboard!`);
    setTimeout(() => setStatusMsg(''), 2500);
  };

  // ----------------------------------------------------
  // REAL WEBRTC LOGIC (MANUAL SIGNALING)
  // ----------------------------------------------------
  const initPeerConnection = () => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    
    pc.onicecandidate = (e) => {
      if (e.candidate) setLocalSdp(btoa(JSON.stringify(pc.localDescription)));
    };

    pc.ondatachannel = (e) => {
      dcRef.current = e.channel;
      setupDataChannel(dcRef.current);
    };

    pcRef.current = pc;
    return pc;
  };

  const setupDataChannel = (dc) => {
    dc.onopen = () => {
      setConnectionStatus('CONNECTED');
      setP2pMessages(prev => [...prev, { sender: 'system', text: '🔒 True Peer-to-Peer Socket Established!' }]);
    };
    dc.onclose = () => setConnectionStatus('DISCONNECTED');
    dc.onmessage = (e) => {
      setP2pMessages(prev => [...prev, { sender: 'peer', text: e.data, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    };
  };

  const createHostOffer = async () => {
    setP2pRole('HOST');
    const pc = initPeerConnection();
    const dc = pc.createDataChannel('sovereign_secure_channel');
    setupDataChannel(dc);
    dcRef.current = dc;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    // onicecandidate will update localSdp
  };

  const acceptHostOffer = async () => {
    if (!remoteSdp.trim()) return;
    setP2pRole('JOIN');
    const pc = initPeerConnection();
    
    const offerDesc = new RTCSessionDescription(JSON.parse(atob(remoteSdp)));
    await pc.setRemoteDescription(offerDesc);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    // onicecandidate will update localSdp with the answer block
  };

  const finalizeHostConnection = async () => {
    if (!remoteSdp.trim() || !pcRef.current) return;
    const answerDesc = new RTCSessionDescription(JSON.parse(atob(remoteSdp)));
    await pcRef.current.setRemoteDescription(answerDesc);
  };

  const sendP2pMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !dcRef.current || dcRef.current.readyState !== 'open') return;
    
    const msg = chatInput.trim();
    dcRef.current.send(msg);
    setP2pMessages(prev => [...prev, { sender: 'self', text: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setChatInput('');
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">📡 Encrypted Comms</h2>
        <p className="text-xs text-zinc-400 mt-1">True serverless P2P Sockets & PGP.</p>
      </div>

      {statusMsg && <div className="theme-accent-badge p-2 rounded-xl text-xs font-bold text-center shadow">{statusMsg}</div>}

      <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900">
        <button onClick={() => setTopMode('PGP Email Composer')} className={`flex-1 py-2 text-xs font-bold rounded-xl ${topMode === 'PGP Email Composer' ? 'theme-accent-bg text-black' : 'text-zinc-400'}`}>📧 PGP Email</button>
        <button onClick={() => setTopMode('Decentralized P2P')} className={`flex-1 py-2 text-xs font-bold rounded-xl ${topMode === 'Decentralized P2P' ? 'theme-accent-bg text-black' : 'text-zinc-400'}`}>📡 True P2P</button>
      </div>

      {/* DECENTRALIZED P2P MODE */}
      {topMode === 'Decentralized P2P' && (
        <div className="space-y-4">
          
          <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-2 text-xs text-zinc-300">
            <h3 className="font-bold theme-accent-text uppercase tracking-wider text-xs">📖 Manual Socket Handshake</h3>
            <p className="text-[11px] leading-relaxed text-zinc-400">Because this app uses zero central servers, you must manually exchange connection blocks to establish the socket.</p>
          </div>

          {connectionStatus === 'DISCONNECTED' && (
            <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
              
              {!p2pRole && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={createHostOffer} className="theme-accent-bg text-black font-bold py-3 rounded-xl shadow">1. Host Channel</button>
                  <button onClick={() => setP2pRole('JOIN')} className="bg-zinc-800 text-white border border-zinc-700 font-bold py-3 rounded-xl">2. Join Channel</button>
                </div>
              )}

              {p2pRole === 'HOST' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold theme-accent-text uppercase">HOSTING: Send Offer to Peer</h4>
                  <textarea readOnly value={localSdp} className="w-full bg-black border border-zinc-800 text-[10px] text-zinc-400 font-mono rounded-xl p-2 h-20" placeholder="Generating cryptographic offer block..." />
                  <button onClick={() => copyToClipboard(localSdp, 'Connection Offer')} className="w-full theme-accent-bg text-black font-bold text-xs py-2 rounded-xl">📋 Copy & Send to Peer</button>
                  
                  <h4 className="text-xs font-bold theme-accent-text uppercase pt-2">Paste Peer's Answer</h4>
                  <textarea value={remoteSdp} onChange={(e) => setRemoteSdp(e.target.value)} className="w-full bg-black border border-zinc-800 text-[10px] text-white font-mono rounded-xl p-2 h-20 focus:outline-none" placeholder="Paste their Answer Block here..." />
                  <button onClick={finalizeHostConnection} className="w-full bg-emerald-600 text-white font-bold text-xs py-2 rounded-xl shadow">🔌 Connect Sockets</button>
                </div>
              )}

              {p2pRole === 'JOIN' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold theme-accent-text uppercase">JOINING: Paste Host Offer</h4>
                  <textarea value={remoteSdp} onChange={(e) => setRemoteSdp(e.target.value)} className="w-full bg-black border border-zinc-800 text-[10px] text-white font-mono rounded-xl p-2 h-20 focus:outline-none" placeholder="Paste Host's Offer Block here..." />
                  <button onClick={acceptHostOffer} className="w-full bg-amber-500 text-black font-bold text-xs py-2 rounded-xl shadow">✅ Accept Offer</button>

                  {localSdp && (
                    <div className="space-y-2 pt-2 animate-fadeIn">
                      <h4 className="text-xs font-bold theme-accent-text uppercase">Send Answer Back</h4>
                      <textarea readOnly value={localSdp} className="w-full bg-black border border-zinc-800 text-[10px] text-zinc-400 font-mono rounded-xl p-2 h-20" />
                      <button onClick={() => copyToClipboard(localSdp, 'Connection Answer')} className="w-full theme-accent-bg text-black font-bold text-xs py-2 rounded-xl">📋 Copy & Send Back</button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ACTIVE CHAT ROOM */}
          {connectionStatus === 'CONNECTED' && (
            <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-3 shadow-xl animate-fadeIn">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold theme-accent-text uppercase">ENCRYPTED P2P SOCKET</h4>
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold font-mono uppercase"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>Connected</span>
              </div>
              
              <div className="bg-black/90 border border-zinc-800 rounded-2xl p-3 h-64 overflow-y-auto space-y-2">
                {p2pMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'self' ? 'justify-end' : msg.sender === 'system' ? 'justify-center' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-2.5 rounded-xl text-xs font-mono ${msg.sender === 'self' ? 'theme-accent-bg text-black font-bold' : msg.sender === 'system' ? 'bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px]' : 'bg-zinc-800 text-white'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={sendP2pMessage} className="flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type socket message..." className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none" />
                <button type="submit" disabled={!chatInput.trim()} className="theme-accent-bg text-black font-bold text-xs px-4 py-2 rounded-xl shadow disabled:opacity-40">Send</button>
              </form>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
