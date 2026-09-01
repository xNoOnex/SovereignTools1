import React, { useState, useRef, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { QRCodeSVG } from 'qrcode.react';
import { SovereignCamera } from './SovereignCamera';

export function EncryptedComms({ onNavigate }) {
  const [pzpRole, setPzpRole] = useState(null);
  const [localSdp, setLocalSdp] = useState('');
  const [remoteSdp, setRemoteSdp] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  const [pzpMessages, setPzpMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [sessionPin, setSessionPin] = useState(''); 
  
  const [qrPayload, setQrPayload] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pzpMessages]);

  const triggerStatus = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    triggerStatus('📋 Payload copied to clipboard!');
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRemoteSdp(text);
      triggerStatus('📥 Payload pasted from clipboard!');
    } catch (err) {
      triggerStatus('⚠️ Clipboard read failed. Paste manually.');
    }
  };

  const initPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun1.voiceeclipse.net:3478' }
      ]
    });

    pc.onicecandidate = (e) => {
      if (e.candidate === null) {
        setLocalSdp(btoa(JSON.stringify(pc.localDescription)));
      }
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
      setQrPayload(null); 
      setIsScanning(false);
      setPzpMessages(prev => [...prev, { sender: 'system', text: '🔒 AES-256 Socket Established. Commencing secure tunnel.' }]);
    };
    dc.onclose = () => setConnectionStatus('DISCONNECTED');
    
    dc.onmessage = (e) => {
      try {
        const bytes = CryptoJS.AES.decrypt(e.data, sessionPin);
        const decryptedMsg = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedMsg) throw new Error("Decryption failed");
        setPzpMessages(prev => [...prev, { sender: 'peer', text: decryptedMsg }]);
      } catch (err) {
        setPzpMessages(prev => [...prev, { sender: 'system', text: '⚠️ BLOCKED: Unverified packet received.' }]);
      }
    };
  };

  const createHostOffer = async () => {
    if (!sessionPin.trim()) return triggerStatus('⚠️ Session PIN required.');
    setPzpRole('HOST');
    const pc = initPeerConnection();
    const dc = pc.createDataChannel('sovereign_secure_channel');
    setupDataChannel(dc);
    dcRef.current = dc;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
  };

  const acceptHostOffer = async () => {
    if (!remoteSdp.trim() || !sessionPin.trim()) return triggerStatus('⚠️ PIN and Payload required.');
    setPzpRole('JOIN');
    const pc = initPeerConnection();
    try {
      const offerDesc = new RTCSessionDescription(JSON.parse(atob(remoteSdp)));
      await pc.setRemoteDescription(offerDesc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
    } catch (e) {
      triggerStatus('⚠️ Invalid Handshake Payload.');
    }
  };

  const finalizeHostConnection = async () => {
    if (!remoteSdp.trim() || !pcRef.current) return;
    try {
      const answerDesc = new RTCSessionDescription(JSON.parse(atob(remoteSdp)));
      await pcRef.current.setRemoteDescription(answerDesc);
    } catch (e) {
      triggerStatus('⚠️ Invalid Answer Payload.');
    }
  };

  const sendPzpMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !dcRef.current || dcRef.current.readyState !== 'open') return;
    const encryptedPayload = CryptoJS.AES.encrypt(chatInput.trim(), sessionPin).toString();
    dcRef.current.send(encryptedPayload);
    setPzpMessages(prev => [...prev, { sender: 'self', text: chatInput.trim() }]);
    setChatInput('');
  };

  const handleOpticalScan = (scannedData) => {
    if (scannedData) {
      setRemoteSdp(scannedData);
      setIsScanning(false);
      triggerStatus('🟢 Optical Payload Acquired!');
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      <div className="border-b border-zinc-900 pb-3 pt-2 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">📡 Secure Socket</h2>
          <p className="text-xs text-zinc-400 mt-1">Double-Blind AES-256 WebRTC Signaling</p>
        </div>
        <button onClick={() => onNavigate('home')} className="bg-zinc-900 border border-zinc-700 text-xs font-bold px-4 py-2 rounded-full hover:border-white transition-all">
          Exit
        </button>
      </div>

      {statusMsg && <div className="theme-accent-bg text-black p-2 rounded-xl text-xs font-bold text-center shadow animate-pulse">{statusMsg}</div>}

      {connectionStatus === 'DISCONNECTED' && (
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
          <div className="space-y-2">
            <h3 className="font-bold theme-accent-text uppercase tracking-wider text-xs">🔑 Ephemeral Session PIN</h3>
            <p className="text-[10px] leading-relaxed text-zinc-400">Both nodes must enter the exact same PIN to derive the AES-256 key used to encrypt the tunnel.</p>
            <input 
              type="password" 
              placeholder="Enter shared PIN..." 
              value={sessionPin} 
              onChange={(e) => setSessionPin(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm font-mono text-white focus:outline-none focus:border-[var(--accent-text)] text-center tracking-widest"
              disabled={pzpRole !== null}
            />
          </div>

          {!pzpRole && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={createHostOffer} className="theme-accent-bg text-black font-bold py-3 rounded-xl shadow uppercase text-xs tracking-wider active:scale-95 transition-all">Establish Host</button>
              <button onClick={() => { if(!sessionPin) return triggerStatus('⚠️ Enter PIN first'); setPzpRole('JOIN'); }} className="bg-zinc-800 text-white border border-zinc-700 font-bold py-3 rounded-xl uppercase text-xs tracking-wider active:scale-95 transition-all">Join Peer</button>
            </div>
          )}

          {pzpRole === 'HOST' && (
            <div className="space-y-4 pt-2 border-t border-zinc-800 animate-fadeIn">
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold theme-accent-text uppercase">1. Transmit Offer</h4>
                <div className="flex gap-2">
                  <input readOnly value={localSdp ? "PAYLOAD READY" : "GENERATING..."} className="flex-1 bg-black border border-zinc-800 text-[10px] text-zinc-500 font-mono rounded-lg p-2 text-center" />
                  <button onClick={() => setQrPayload(localSdp)} disabled={!localSdp} className="bg-emerald-600 text-white font-bold text-xs px-3 rounded-lg active:scale-95 disabled:opacity-50">QR</button>
                  <button onClick={() => copyToClipboard(localSdp)} disabled={!localSdp} className="bg-zinc-800 text-white font-bold text-xs px-3 rounded-lg active:scale-95 disabled:opacity-50">COPY</button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold theme-accent-text uppercase">2. Await Peer Answer</h4>
                <div className="flex gap-2">
                  <input value={remoteSdp} onChange={(e) => setRemoteSdp(e.target.value)} placeholder="Paste/Scan answer..." className="flex-1 bg-black border border-zinc-800 text-[10px] text-white font-mono rounded-lg p-2 focus:outline-none" />
                  <button onClick={() => setIsScanning(true)} className="bg-emerald-600 text-white font-bold text-xs px-3 rounded-lg active:scale-95">SCAN</button>
                  <button onClick={pasteFromClipboard} className="bg-zinc-800 text-zinc-300 font-bold text-xs px-3 rounded-lg active:scale-95">PASTE</button>
                </div>
                <button onClick={finalizeHostConnection} disabled={!remoteSdp} className="w-full bg-emerald-600/20 border border-emerald-500 text-emerald-400 font-bold text-xs py-3 rounded-xl shadow mt-2 active:scale-95 transition-all tracking-widest uppercase disabled:opacity-30">Initialize Uplink</button>
              </div>
            </div>
          )}

          {pzpRole === 'JOIN' && (
            <div className="space-y-4 pt-2 border-t border-zinc-800 animate-fadeIn">
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold theme-accent-text uppercase">1. Acquire Host Offer</h4>
                <div className="flex gap-2">
                  <input value={remoteSdp} onChange={(e) => setRemoteSdp(e.target.value)} placeholder="Paste/Scan offer..." className="flex-1 bg-black border border-zinc-800 text-[10px] text-white font-mono rounded-lg p-2 focus:outline-none" />
                  <button onClick={() => setIsScanning(true)} className="bg-amber-500 text-black font-bold text-xs px-3 rounded-lg active:scale-95">SCAN</button>
                  <button onClick={pasteFromClipboard} className="bg-zinc-800 text-zinc-300 font-bold text-xs px-3 rounded-lg active:scale-95">PASTE</button>
                </div>
                <button onClick={acceptHostOffer} disabled={!remoteSdp} className="w-full bg-amber-500/20 border border-amber-500 text-amber-400 font-bold text-xs py-3 rounded-xl shadow mt-2 active:scale-95 transition-all tracking-widest uppercase disabled:opacity-30">Accept & Generate Answer</button>
              </div>

              {localSdp && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-[10px] font-bold theme-accent-text uppercase">2. Return Answer</h4>
                  <div className="flex gap-2">
                    <input readOnly value="PAYLOAD READY" className="flex-1 bg-black border border-zinc-800 text-[10px] text-zinc-500 font-mono rounded-lg p-2 text-center" />
                    <button onClick={() => setQrPayload(localSdp)} className="bg-amber-500 text-black font-bold text-xs px-3 rounded-lg active:scale-95">QR</button>
                    <button onClick={() => copyToClipboard(localSdp)} className="bg-zinc-800 text-white font-bold text-xs px-3 rounded-lg active:scale-95">COPY</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {connectionStatus === 'CONNECTED' && (
        <div className="bg-zinc-900 p-3 rounded-3xl border border-zinc-800 space-y-3 shadow-xl flex flex-col h-[65vh]">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2 px-2">
            <h4 className="text-[10px] font-bold theme-accent-text uppercase tracking-widest">E2EE Tactical Socket</h4>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>Active</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {pzpMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'self' ? 'justify-end' : msg.sender === 'system' ? 'justify-center' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-2.5 rounded-xl text-xs font-mono leading-relaxed ${
                  msg.sender === 'self' ? 'theme-accent-bg text-black font-bold rounded-br-sm' : 
                  msg.sender === 'system' ? 'bg-zinc-800 border border-zinc-700 text-[9px] text-zinc-400 rounded-lg py-1 px-3 text-center' : 
                  'bg-black border border-zinc-700 text-zinc-200 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={sendPzpMessage} className="flex gap-2 pt-2">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Inject payload..." className="flex-1 bg-black border border-zinc-700 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-[var(--accent-text)]" />
            <button type="submit" disabled={!chatInput.trim()} className="theme-accent-bg text-black font-bold text-xs px-5 rounded-xl active:scale-95 transition-all disabled:opacity-50 tracking-widest uppercase">TX</button>
          </form>
        </div>
      )}

      {/* Optical Broadcast Modal */}
      {qrPayload && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white p-4 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            <QRCodeSVG value={qrPayload} size={280} level="L" includeMargin={false} />
          </div>
          <p className="text-zinc-400 text-[10px] font-mono mt-6 text-center max-w-xs">Have the peer scan this matrix to securely ingest the WebRTC payload.</p>
          <button onClick={() => setQrPayload(null)} className="mt-8 text-white font-bold tracking-widest uppercase bg-red-600 px-8 py-3 rounded-xl shadow-lg active:scale-95 transition-all">Close Emitter</button>
        </div>
      )}

      {/* TACTICAL HARDWARE CAMERA MODAL (REPLACES DUMMY SCANNER) */}
      {isScanning && (
        <div className="fixed inset-0 z-[9999] bg-black">
          <SovereignCamera 
            forcedMode="QR" 
            onNavigate={() => setIsScanning(false)} 
            onScanSuccess={handleOpticalScan} 
          />
        </div>
      )}
    </div>
  );
}
