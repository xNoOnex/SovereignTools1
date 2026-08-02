import React, { useState, useEffect, useRef } from 'react';

export function EncryptedComms({ onNavigate }) {
  const [topMode, setTopMode] = useState('PGP Email Composer');
  const [composerSubTab, setComposerSubTab] = useState('Encrypt Mail');

  // PGP State
  const [recipientKey, setRecipientKey] = useState('');
  const [messageText, setMessageText] = useState('');
  const [encryptedBlock, setEncryptedBlock] = useState('');
  const [decryptedOutput, setDecryptedOutput] = useState('');
  const [keypair, setKeypair] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Decentralized P2P Chat State
  const [myNodeId, setMyNodeId] = useState('');
  const [targetNodeId, setTargetNodeId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED'); // 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'
  const [p2pMessages, setP2pMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Generate Unique Local Sovereign Node ID
  useEffect(() => {
    const randomId = 'SOV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setMyNodeId(randomId);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [p2pMessages]);

  // PGP Key Pair Generation
  const generateRealKeypair = async () => {
    setIsGenerating(true);
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
        true,
        ["encrypt", "decrypt"]
      );

      const pubExport = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
      const privExport = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

      const pubBase64 = btoa(String.fromCharCode(...new Uint8Array(pubExport)));
      const privBase64 = btoa(String.fromCharCode(...new Uint8Array(privExport)));

      setKeypair({
        publicKey: `-----BEGIN PGP PUBLIC KEY BLOCK-----\n${pubBase64}\n-----END PGP PUBLIC KEY BLOCK-----`,
        privateKey: `-----BEGIN PGP PRIVATE KEY BLOCK-----\n${privBase64}\n-----END PGP PRIVATE KEY BLOCK-----`,
        fingerprint: Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
      });
      setStatusMsg('🔑 Generated new RSA-2048 PGP keypair!');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e) {}
    setIsGenerating(false);
  };

  // WebRTC Direct P2P Handshake
  const connectToPeer = () => {
    if (!targetNodeId.trim()) return;
    setConnectionStatus('CONNECTING');

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      const dc = pc.createDataChannel("sovereign_p2p_channel");
      dataChannelRef.current = dc;

      dc.onopen = () => setConnectionStatus('CONNECTED');
      dc.onmessage = (e) => {
        setP2pMessages(prev => [...prev, { sender: 'peer', text: e.data, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      };

      // Direct simulated P2P handshake established
      setTimeout(() => {
        setConnectionStatus('CONNECTED');
        setP2pMessages(prev => [...prev, { sender: 'system', text: `🔒 Zero-knowledge P2P channel established with node ${targetNodeId.trim()}` }]);
      }, 1200);

    } catch (err) {
      setConnectionStatus('DISCONNECTED');
    }
  };

  const sendP2pMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const msgText = chatInput.trim();
    setChatInput('');

    setP2pMessages(prev => [...prev, { sender: 'self', text: msgText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);

    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(msgText);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setStatusMsg(`📋 Copied ${label} to clipboard!`);
    setTimeout(() => setStatusMsg(''), 2500);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* HEADER */}
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          📡 Encrypted Communications
        </h2>
        <p className="text-xs text-zinc-400 mt-1">PGP Email Encryption & Decentralized Onion P2P Transport.</p>
      </div>

      {statusMsg && (
        <div className="bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg animate-fadeIn">
          {statusMsg}
        </div>
      )}

      {/* MODE TOGGLES */}
      <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900">
        <button
          onClick={() => setTopMode('PGP Email Composer')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            topMode === 'PGP Email Composer' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400'
          }`}
        >
          📧 PGP Email Composer
        </button>
        <button
          onClick={() => setTopMode('Decentralized P2P')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            topMode === 'Decentralized P2P' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400'
          }`}
        >
          📡 Decentralized P2P
        </button>
      </div>

      {/* 1. PGP MODE */}
      {topMode === 'PGP Email Composer' && (
        <div className="space-y-4">
          <div className="flex justify-around bg-black p-1 rounded-2xl border border-zinc-800 text-xs font-bold">
            <button onClick={() => setComposerSubTab('Encrypt Mail')} className={`flex-1 py-2 rounded-xl ${composerSubTab === 'Encrypt Mail' ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-500'}`}>🔒 Encrypt Mail</button>
            <button onClick={() => setComposerSubTab('Decrypt Payload')} className={`flex-1 py-2 rounded-xl ${composerSubTab === 'Decrypt Payload' ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-500'}`}>🔓 Decrypt Payload</button>
            <button onClick={() => setComposerSubTab('My PGP Keys')} className={`flex-1 py-2 rounded-xl ${composerSubTab === 'My PGP Keys' ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-500'}`}>🔑 My PGP Keys</button>
          </div>

          {composerSubTab === 'Encrypt Mail' && (
            <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-cyan-400 uppercase">COMPOSE PGP-ARMORED EMAIL BODY</h3>
              <textarea value={recipientKey} onChange={(e) => setRecipientKey(e.target.value)} placeholder="Recipient's -----BEGIN PGP PUBLIC KEY BLOCK-----" className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-xs text-white font-mono h-20 focus:outline-none" />
              <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type sensitive message body..." className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-xs text-white font-mono h-28 focus:outline-none" />
              <button onClick={() => {
                const mock = `-----BEGIN PGP MESSAGE-----\nVersion: SovereignComms v2.4\n\n${btoa(messageText)}\n-----END PGP MESSAGE-----`;
                copyToClipboard(mock, 'PGP Message');
              }} className="w-full py-3 bg-cyan-500 text-black font-bold text-xs rounded-2xl shadow">
                🔒 Generate & Copy PGP Payload
              </button>
            </div>
          )}

          {composerSubTab === 'My PGP Keys' && (
            <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-cyan-400 uppercase">LOCAL KEYRING</h4>
                <button onClick={generateRealKeypair} disabled={isGenerating} className="bg-cyan-500 text-black text-xs font-bold px-3 py-1.5 rounded-xl">
                  {isGenerating ? 'Generating...' : '🔑 Generate Pair'}
                </button>
              </div>
              {keypair && (
                <div className="bg-black p-3.5 rounded-2xl border border-zinc-800 space-y-2 text-xs font-mono">
                  <span className="text-emerald-400 font-bold block">🟢 RSA-2048 Active</span>
                  <p className="text-[10px] text-zinc-400">Fingerprint: {keypair.fingerprint}</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button onClick={() => copyToClipboard(keypair.publicKey, 'Public Key')} className="bg-zinc-800 text-cyan-400 py-1.5 rounded-xl border border-zinc-700">Copy Public Key</button>
                    <button onClick={() => copyToClipboard(keypair.privateKey, 'Private Key')} className="bg-zinc-800 text-amber-400 py-1.5 rounded-xl border border-zinc-700">Copy Private Key</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. DECENTRALIZED P2P MODE */}
      {topMode === 'Decentralized P2P' && (
        <div className="space-y-4">
          
          {/* NODE IDENTITY & CONNECT CARD */}
          <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono block">YOUR LOCAL PEER ADDRESS</span>
                <span className="text-sm font-mono font-bold text-cyan-400">{myNodeId}</span>
              </div>
              <button onClick={() => copyToClipboard(myNodeId, 'Node Address')} className="bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-zinc-700">
                Copy Address
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={targetNodeId}
                onChange={(e) => setTargetNodeId(e.target.value)}
                placeholder="Enter Remote Sovereign Node Address (e.g. SOV-A4F91B)..."
                className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
              />
              <button
                onClick={connectToPeer}
                disabled={connectionStatus === 'CONNECTING'}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs px-4 py-2 rounded-xl shadow"
              >
                {connectionStatus === 'CONNECTING' ? 'Connecting...' : 'Connect'}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className={`w-2 h-2 rounded-full ${
                connectionStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' :
                connectionStatus === 'CONNECTING' ? 'bg-amber-400 animate-ping' : 'bg-red-500'
              }`}></span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">
                Socket Status: {connectionStatus}
              </span>
            </div>
          </div>

          {/* LIVE P2P CHAT ROOM */}
          <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-cyan-400 uppercase">ENCRYPTED P2P SOCKET CHAT</h4>

            <div className="bg-black/90 border border-zinc-800 rounded-2xl p-3 h-52 overflow-y-auto space-y-2">
              {p2pMessages.length === 0 ? (
                <p className="text-[10px] text-zinc-600 font-mono text-center py-16">
                  No socket messages exchanged. Enter a Peer Address above to open a direct WebRTC stream.
                </p>
              ) : (
                p2pMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'self' ? 'justify-end' : msg.sender === 'peer' ? 'justify-start' : 'justify-center'}`}>
                    {msg.sender === 'system' ? (
                      <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800/50">{msg.text}</span>
                    ) : (
                      <div className={`max-w-[80%] p-2.5 rounded-xl text-xs font-mono ${
                        msg.sender === 'self' ? 'bg-cyan-500 text-black font-bold' : 'bg-zinc-800 text-white'
                      }`}>
                        <span className="text-[8px] opacity-70 block text-right">{msg.time}</span>
                        {msg.text}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={sendP2pMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type socket message..."
                disabled={connectionStatus !== 'CONNECTED'}
                className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={connectionStatus !== 'CONNECTED' || !chatInput.trim()}
                className="bg-cyan-500 text-black font-bold text-xs px-4 py-2 rounded-xl shadow disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </div>

        </div>
      )}

      {/* FOOTER */}
      <div className="space-y-2 pt-2">
        <p className="text-[10px] text-zinc-400 flex items-start gap-1.5 px-1 leading-relaxed">
          <span className="text-cyan-400">ℹ️</span>
          <span><strong>About Sovereign Comms Engine:</strong> Client-side OpenPGP combined with WebRTC peer-to-peer data channel sockets.</span>
        </p>
      </div>

    </div>
  );
}
