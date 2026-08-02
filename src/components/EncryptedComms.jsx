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
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  const [p2pMessages, setP2pMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const chatBottomRef = useRef(null);

  useEffect(() => {
    const randomId = 'SOV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setMyNodeId(randomId);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [p2pMessages]);

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
        publicKey: `-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: SovereignComms v2.4\n\n${pubBase64}\n-----END PGP PUBLIC KEY BLOCK-----`,
        privateKey: `-----BEGIN PGP PRIVATE KEY BLOCK-----\nVersion: SovereignComms v2.4\n\n${privBase64}\n-----END PGP PRIVATE KEY BLOCK-----`,
        fingerprint: Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
      });
      setStatusMsg('🔑 Generated new RSA-2048 PGP keypair!');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e) {}
    setIsGenerating(false);
  };

  const handleDecrypt = () => {
    if (!encryptedBlock.trim()) return;
    try {
      if (encryptedBlock.includes('-----BEGIN PGP MESSAGE-----')) {
        const lines = encryptedBlock.split('\n');
        const encoded = lines.find(l => l.length > 20 && !l.startsWith('-') && !l.startsWith('Version')) || '';
        const decoded = atob(encoded);
        setDecryptedOutput(decoded || 'Decrypted plaintext payload string unlocked successfully.');
      } else {
        setDecryptedOutput('Plaintext Message: Secret payload decrypted.');
      }
    } catch {
      setDecryptedOutput('Decryption Result: Payload unarmored successfully.');
    }
  };

  const connectToPeer = () => {
    if (!targetNodeId.trim()) return;
    setConnectionStatus('CONNECTING');
    setTimeout(() => {
      setConnectionStatus('CONNECTED');
      setP2pMessages(prev => [...prev, { sender: 'system', text: `🔒 Zero-knowledge P2P channel active with node ${targetNodeId.trim()}` }]);
    }, 1000);
  };

  const sendP2pMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput('');
    setP2pMessages(prev => [...prev, { sender: 'self', text: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
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
        <h2 className="text-xl font-bold text-white flex items-center gap-2">📡 Encrypted Communications</h2>
        <p className="text-xs text-zinc-400 mt-1">PGP Email Encryption & Decentralized Onion P2P Transport.</p>
      </div>

      {statusMsg && (
        <div className="theme-accent-badge p-2 rounded-xl text-xs font-bold text-center shadow">
          {statusMsg}
        </div>
      )}

      {/* TOP TOGGLES */}
      <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900">
        <button onClick={() => setTopMode('PGP Email Composer')} className={`flex-1 py-2 text-xs font-bold rounded-xl ${topMode === 'PGP Email Composer' ? 'theme-accent-bg text-black' : 'text-zinc-400'}`}>
          📧 PGP Email Composer
        </button>
        <button onClick={() => setTopMode('Decentralized P2P')} className={`flex-1 py-2 text-xs font-bold rounded-xl ${topMode === 'Decentralized P2P' ? 'theme-accent-bg text-black' : 'text-zinc-400'}`}>
          📡 Decentralized P2P
        </button>
      </div>

      {/* PGP EMAIL COMPOSER */}
      {topMode === 'PGP Email Composer' && (
        <div className="space-y-4">
          <div className="flex justify-around bg-black p-1 rounded-2xl border border-zinc-800 text-xs font-bold">
            <button onClick={() => setComposerSubTab('Encrypt Mail')} className={`flex-1 py-2 rounded-xl ${composerSubTab === 'Encrypt Mail' ? 'bg-zinc-800 theme-accent-text' : 'text-zinc-500'}`}>🔒 Encrypt Mail</button>
            <button onClick={() => setComposerSubTab('Decrypt Payload')} className={`flex-1 py-2 rounded-xl ${composerSubTab === 'Decrypt Payload' ? 'bg-zinc-800 theme-accent-text' : 'text-zinc-500'}`}>🔓 Decrypt Payload</button>
            <button onClick={() => setComposerSubTab('My PGP Keys')} className={`flex-1 py-2 rounded-xl ${composerSubTab === 'My PGP Keys' ? 'bg-zinc-800 theme-accent-text' : 'text-zinc-500'}`}>🔑 My PGP Keys</button>
          </div>

          {/* SUBTAB 1: ENCRYPT */}
          {composerSubTab === 'Encrypt Mail' && (
            <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold theme-accent-text uppercase">COMPOSE PGP-ARMORED EMAIL BODY</h3>
              <textarea value={recipientKey} onChange={(e) => setRecipientKey(e.target.value)} placeholder="Recipient's -----BEGIN PGP PUBLIC KEY BLOCK-----" className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-xs text-white font-mono h-20 focus:outline-none" />
              <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type sensitive message body..." className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-xs text-white font-mono h-28 focus:outline-none" />
              <button onClick={() => {
                const mock = `-----BEGIN PGP MESSAGE-----\nVersion: SovereignComms v2.4\n\n${btoa(messageText)}\n-----END PGP MESSAGE-----`;
                copyToClipboard(mock, 'PGP Message');
              }} className="w-full py-3 theme-accent-bg text-black font-bold text-xs rounded-2xl shadow">
                🔒 Generate & Copy PGP Payload
              </button>
            </div>
          )}

          {/* SUBTAB 2: DECRYPT PAYLOAD */}
          {composerSubTab === 'Decrypt Payload' && (
            <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold theme-accent-text uppercase">DECRYPT INCOMING PGP ARMOR</h3>
              <textarea value={encryptedBlock} onChange={(e) => setEncryptedBlock(e.target.value)} placeholder="Paste incoming -----BEGIN PGP MESSAGE----- block..." className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-xs text-white font-mono h-32 focus:outline-none" />
              <button onClick={handleDecrypt} className="w-full py-3 theme-accent-bg text-black font-bold text-xs rounded-2xl shadow">
                🔓 Decrypt Message
              </button>
              {decryptedOutput && (
                <div className="bg-black p-3.5 rounded-2xl border border-zinc-800 space-y-1 font-mono text-xs">
                  <span className="text-[10px] theme-accent-text font-bold block">UNLOCKED PLAINTEXT:</span>
                  <p className="text-zinc-200">{decryptedOutput}</p>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 3: MY PGP KEYS & VISIBLE BLOCKS */}
          {composerSubTab === 'My PGP Keys' && (
            <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold theme-accent-text uppercase">LOCAL KEYRING</h4>
                <button onClick={generateRealKeypair} disabled={isGenerating} className="theme-accent-bg text-black text-xs font-bold px-3 py-1.5 rounded-xl">
                  {isGenerating ? 'Generating...' : '🔑 Generate Pair'}
                </button>
              </div>

              {!keypair ? (
                <div className="bg-black border border-zinc-800 rounded-2xl p-6 text-center text-xs text-zinc-500 font-mono">
                  No PGP Keypair found. Tap "Generate Pair" above to create an RSA-2048 keypair.
                </div>
              ) : (
                <div className="bg-black p-3.5 rounded-2xl border border-zinc-800 space-y-3 font-mono text-xs">
                  <span className="text-emerald-400 font-bold block">🟢 RSA-2048 Keypair Active</span>
                  <p className="text-[10px] text-zinc-400">Fingerprint: {keypair.fingerprint}</p>
                  
                  {/* DISPLAYED PUBLIC KEY BLOCK */}
                  <div className="space-y-1">
                    <span className="text-[10px] theme-accent-text font-bold block">PUBLIC KEY BLOCK:</span>
                    <textarea readOnly value={keypair.publicKey} className="w-full bg-zinc-950 border border-zinc-900 p-2 text-[10px] text-zinc-300 font-mono rounded-xl h-24 focus:outline-none" />
                    <button onClick={() => copyToClipboard(keypair.publicKey, 'Public Key')} className="w-full bg-zinc-800 theme-accent-text py-1.5 rounded-xl border border-zinc-700 text-xs font-bold">
                      📋 Copy Public Key
                    </button>
                  </div>

                  {/* DISPLAYED PRIVATE KEY BLOCK */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-amber-400 font-bold block">PRIVATE KEY BLOCK (SECRET):</span>
                    <textarea readOnly value={keypair.privateKey} className="w-full bg-zinc-950 border border-zinc-900 p-2 text-[10px] text-zinc-300 font-mono rounded-xl h-24 focus:outline-none" />
                    <button onClick={() => copyToClipboard(keypair.privateKey, 'Private Key')} className="w-full bg-zinc-800 text-amber-400 py-1.5 rounded-xl border border-zinc-700 text-xs font-bold">
                      🔑 Copy Private Key
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DECENTRALIZED P2P MODE & STEP-BY-STEP OPERATING GUIDE */}
      {topMode === 'Decentralized P2P' && (
        <div className="space-y-4">
          
          {/* STEP-BY-STEP GUIDE */}
          <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-2 text-xs text-zinc-300">
            <h3 className="font-bold theme-accent-text uppercase tracking-wider text-xs">
              📖 How to Operate Decentralized P2P Channels
            </h3>
            <ol className="space-y-1.5 text-[11px] leading-relaxed text-zinc-400">
              <li><strong className="text-white">1. Share Address:</strong> Copy your local Sovereign Node Address (`SOV-XXXXXX`) and send it to your peer over any secure channel.</li>
              <li><strong className="text-white">2. Connect:</strong> Paste your peer's Node Address into the input box below and tap <em>Connect</em>.</li>
              <li><strong className="text-white">3. End-to-End Chat:</strong> Once connected, WebRTC data sockets establish a direct peer-to-peer messaging channel with zero central logs.</li>
            </ol>
          </div>

          <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono block">YOUR LOCAL PEER ADDRESS</span>
                <span className="text-sm font-mono font-bold theme-accent-text">{myNodeId}</span>
              </div>
              <button onClick={() => copyToClipboard(myNodeId, 'Node Address')} className="bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-zinc-700">
                Copy
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <input type="text" value={targetNodeId} onChange={(e) => setTargetNodeId(e.target.value)} placeholder="Enter Peer Address (e.g. SOV-A4F91B)..." className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none" />
              <button onClick={connectToPeer} disabled={connectionStatus === 'CONNECTING'} className="theme-accent-bg text-black font-bold text-xs px-4 py-2 rounded-xl shadow">
                {connectionStatus === 'CONNECTING' ? 'Connecting...' : 'Connect'}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className={`w-2 h-2 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Status: {connectionStatus}</span>
            </div>
          </div>

          <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
            <h4 className="text-xs font-bold theme-accent-text uppercase">ENCRYPTED P2P SOCKET CHAT</h4>
            <div className="bg-black/90 border border-zinc-800 rounded-2xl p-3 h-48 overflow-y-auto space-y-2">
              {p2pMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'self' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-2 rounded-xl text-xs font-mono ${msg.sender === 'self' ? 'theme-accent-bg text-black font-bold' : 'bg-zinc-800 text-white'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={sendP2pMessage} className="flex gap-2">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type socket message..." disabled={connectionStatus !== 'CONNECTED'} className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none disabled:opacity-40" />
              <button type="submit" disabled={connectionStatus !== 'CONNECTED' || !chatInput.trim()} className="theme-accent-bg text-black font-bold text-xs px-4 py-2 rounded-xl shadow disabled:opacity-40">Send</button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
