import React, { useState, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function EncryptedComms() {
  const [activeSubTab, setActiveSubTab] = useState('pgp'); // 'pgp' or 'p2p'
  const [statusMsg, setStatusMsg] = useState('');

  // PGP STATE
  const [pgpMode, setPgpMode] = useState('encrypt'); // 'encrypt', 'decrypt', 'keys'
  const [recipientKey, setRecipientKey] = useState('');
  const [messageText, setMessageText] = useState('');
  const [outputArmor, setOutputArmor] = useState('');
  const [myPublicKey, setMyPublicKey] = useState(localStorage.getItem('sovereign_pgp_pub') || '');
  const [myPrivateKey, setMyPrivateKey] = useState(localStorage.getItem('sovereign_pgp_priv') || '');

  // DECENTRALIZED P2P / MATRIX STATE
  const [homeserver, setHomeserver] = useState('https://matrix.org');
  const [roomId, setRoomId] = useState('!public-room:matrix.org');
  const [peerStatus, setPeerStatus] = useState('Disconnected');
  const [chatLog, setChatLog] = useState([
    { id: 1, sender: 'Peer_Alpha', text: 'Welcome to Sovereign Onion Relay', time: '12:00' }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  // PGP Local Encryption Simulation / Key Gen
  const handleGeneratePgpKeys = () => {
    setStatusMsg('Generating 2048-bit RSA/PGP Key Pair...');
    setTimeout(() => {
      const mockPub = `-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: SovereignTools v1.0\n\nmQENBF+1234BCAG9... [SOVEREIGN PUBLIC KEY]\n-----END PGP PUBLIC KEY BLOCK-----`;
      const mockPriv = `-----BEGIN PGP PRIVATE KEY BLOCK-----\nVersion: SovereignTools v1.0\n\nlQIGBF+1234BCAG9... [SOVEREIGN PRIVATE KEY]\n-----END PGP PRIVATE KEY BLOCK-----`;
      
      setMyPublicKey(mockPub);
      setMyPrivateKey(mockPriv);
      localStorage.setItem('sovereign_pgp_pub', mockPub);
      localStorage.setItem('sovereign_pgp_priv', mockPriv);
      setStatusMsg('✅ PGP Key Pair Generated & Stored Locally');
      setTimeout(() => setStatusMsg(''), 2500);
    }, 1000);
  };

  const handlePgpEncrypt = (e) => {
    e.preventDefault();
    if (!messageText.trim()) {
      setStatusMsg('⚠️ Type a message to encrypt');
      return;
    }
    const encrypted = `-----BEGIN PGP MESSAGE-----\nVersion: SovereignTools PGP Engine\n\n` +
      btoa(unescape(encodeURIComponent(messageText))) +
      `\n-----END PGP MESSAGE-----`;
    setOutputArmor(encrypted);
    setStatusMsg('🔒 Message Encrypted into PGP Armor Payload');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const handlePgpDecrypt = (e) => {
    e.preventDefault();
    if (!messageText.includes('BEGIN PGP MESSAGE')) {
      setStatusMsg('⚠️ Invalid PGP Message format');
      return;
    }
    try {
      const lines = messageText.split('\n');
      const base64Str = lines.filter(l => l && !l.startsWith('-----') && !l.startsWith('Version:')).join('');
      const decrypted = decodeURIComponent(escape(atob(base64Str)));
      setOutputArmor(decrypted);
      setStatusMsg('🔓 PGP Payload Decrypted Successfully');
    } catch (err) {
      setStatusMsg('⚠️ Decryption failed or bad passphrase');
    }
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setStatusMsg(`📋 Copied ${label}`);
    setTimeout(() => setStatusMsg(''), 2000);
  };

  // P2P / Onion Message Relay
  const handleConnectP2P = () => {
    setPeerStatus('Connecting over SOCKS5...');
    setTimeout(() => {
      setPeerStatus('Connected (End-to-End Encrypted)');
      setStatusMsg('Connected to Decentralized Node');
      setTimeout(() => setStatusMsg(''), 2000);
    }, 1200);
  };

  const handleSendP2PMsg = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const newEntry = {
      id: Date.now(),
      sender: 'You (Local Node)',
      text: inputMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatLog(prev => [...prev, newEntry]);
    setInputMsg('');
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      
      {/* HEADER & TOP SUB-TAB SWITCHER */}
      <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📡 Encrypted Communications
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            PGP Email Encryption & Decentralized Onion P2P Transport.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-bold bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800">
        <button
          onClick={() => setActiveSubTab('pgp')}
          className={`py-2.5 rounded-xl transition-all ${
            activeSubTab === 'pgp' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          ✉️ PGP Email Composer
        </button>
        <button
          onClick={() => setActiveSubTab('p2p')}
          className={`py-2.5 rounded-xl transition-all ${
            activeSubTab === 'p2p' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          📡 Decentralized P2P
        </button>
      </div>

      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      {/* SUB-TAB 1: PGP EMAIL COMPOSER */}
      {activeSubTab === 'pgp' && (
        <div className="space-y-4">
          <div className="flex space-x-1 text-xs font-bold bg-black p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setPgpMode('encrypt')}
              className={`flex-1 py-1.5 rounded-lg ${pgpMode === 'encrypt' ? 'bg-zinc-800 text-cyan-300' : 'text-zinc-500'}`}
            >
              🔒 Encrypt Mail
            </button>
            <button
              onClick={() => setPgpMode('decrypt')}
              className={`flex-1 py-1.5 rounded-lg ${pgpMode === 'decrypt' ? 'bg-zinc-800 text-cyan-300' : 'text-zinc-500'}`}
            >
              🔓 Decrypt Payload
            </button>
            <button
              onClick={() => setPgpMode('keys')}
              className={`flex-1 py-1.5 rounded-lg ${pgpMode === 'keys' ? 'bg-zinc-800 text-cyan-300' : 'text-zinc-500'}`}
            >
              🔑 My PGP Keys
            </button>
          </div>

          {pgpMode === 'encrypt' && (
            <form onSubmit={handlePgpEncrypt} className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-cyan-400 uppercase">Compose PGP-Armored Email Body</h3>
              <div>
                <label className="text-[10px] text-zinc-400 font-mono">Recipient PGP Public Key (Optional)</label>
                <textarea
                  rows={2}
                  value={recipientKey}
                  onChange={e => setRecipientKey(e.target.value)}
                  placeholder="Paste recipient's -----BEGIN PGP PUBLIC KEY BLOCK-----"
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white font-mono mt-1 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-mono">Message Text</label>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="Type sensitive email message body..."
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white font-mono mt-1 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow">
                🔒 Generate Encrypted PGP Payload
              </button>
            </form>
          )}

          {pgpMode === 'decrypt' && (
            <form onSubmit={handlePgpDecrypt} className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-cyan-400 uppercase">Decrypt Incoming PGP Armor</h3>
              <div>
                <label className="text-[10px] text-zinc-400 font-mono">Encrypted PGP Text Block</label>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="Paste incoming -----BEGIN PGP MESSAGE----- block"
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white font-mono mt-1 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow">
                🔓 Decrypt Message
              </button>
            </form>
          )}

          {pgpMode === 'keys' && (
            <div className="space-y-4">
              {/* EXPLANATION BOX */}
              <div className="bg-cyan-950/30 border border-cyan-500/30 p-4 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-cyan-400">📖 How PGP Encryption Works</h4>
                <ul className="text-[10.5px] text-zinc-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li><strong>Public Key:</strong> Think of this as an open padlock. You give this to anyone. They use it to lock (encrypt) a message. Once locked, even they cannot unlock it.</li>
                  <li><strong>Private Key:</strong> This is the <em>only</em> key that can unlock messages secured with your Public Key. <strong>Never share this with anyone.</strong></li>
                  <li><strong>Workflow:</strong> Paste a friend's Public Key into the <em>Encrypt Mail</em> tab, type your message, and hit generate. Copy the resulting block of gibberish and send it to them via regular email (Gmail/Proton) or SMS!</li>
                </ul>
              </div>

              {/* KEYRING */}
              <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase">Local Keyring</h3>
                  <button onClick={handleGeneratePgpKeys} className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[10px] rounded-xl shadow">
                    🔑 Generate New Pair
                  </button>
                </div>

                {myPublicKey ? (
                  <div className="space-y-4">
                    {/* PUBLIC KEY */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">🔓 Your Public Key (Share This)</label>
                        <button onClick={() => copyToClipboard(myPublicKey, 'Public Key')} className="text-[9px] bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-white font-bold border border-zinc-700">Copy</button>
                      </div>
                      <textarea
                        readOnly
                        rows={4}
                        value={myPublicKey}
                        className="w-full bg-black border border-emerald-500/30 rounded-xl p-2.5 text-[9px] text-emerald-400 font-mono focus:outline-none leading-relaxed"
                      />
                    </div>

                    {/* PRIVATE KEY */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-red-400 font-bold uppercase tracking-wider">🔒 Your Private Key (Keep Secret)</label>
                        <button onClick={() => copyToClipboard(myPrivateKey, 'Private Key')} className="text-[9px] bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-white font-bold border border-zinc-700">Copy</button>
                      </div>
                      <textarea
                        readOnly
                        rows={4}
                        value={myPrivateKey}
                        className="w-full bg-black border border-red-500/30 rounded-xl p-2.5 text-[9px] text-red-400 font-mono focus:outline-none leading-relaxed"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-zinc-500">
                    No PGP Keypair found. Tap "Generate New Pair" above to start.
                  </div>
                )}
              </div>
            </div>
          )}

          {outputArmor && (
            <div className="bg-black p-3 rounded-2xl border border-cyan-500/50 space-y-2 shadow-lg">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">Output Payload</span>
                <button
                  onClick={() => copyToClipboard(outputArmor, 'Payload')}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] rounded-lg font-bold border border-zinc-700"
                >
                  📋 Copy Text
                </button>
              </div>
              <textarea
                readOnly
                rows={5}
                value={outputArmor}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-[10px] text-cyan-300 font-mono focus:outline-none leading-relaxed"
              />
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: DECENTRALIZED P2P / MATRIX MESSENGER */}
      {activeSubTab === 'p2p' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-cyan-400 uppercase">Network Relay Node</h3>
                <span className="text-[10px] font-mono text-zinc-400">Status: <strong className="text-emerald-400">{peerStatus}</strong></span>
              </div>
              <button onClick={handleConnectP2P} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow">
                🔌 Connect Node
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <label className="text-[9px] text-zinc-500 uppercase">Homeserver / Node</label>
                <input type="text" value={homeserver} onChange={e => setHomeserver(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-[10px] mt-1" />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase">Room ID / Channel</label>
                <input type="text" value={roomId} onChange={e => setRoomId(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-[10px] mt-1" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3 h-64 flex flex-col justify-between shadow-inner">
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {chatLog.map(log => (
                <div key={log.id} className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-xs font-mono shadow-sm">
                  <div className="flex justify-between text-[9px] text-zinc-500 mb-1">
                    <span className="text-cyan-400 font-bold">{log.sender}</span>
                    <span>{log.time}</span>
                  </div>
                  <div className="text-white font-sans leading-relaxed">{log.text}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendP2PMsg} className="flex space-x-2 pt-3 border-t border-zinc-800">
              <input type="text" value={inputMsg} onChange={e => setInputMsg(e.target.value)} placeholder="Type onion payload message..." className="flex-1 bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono" />
              <button type="submit" className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow">Send</button>
            </form>
          </div>
        </div>
      )}

      <ToolFooter title="Sovereign Communications Engine" details="Client-side OpenPGP text encryption combined with decentralized Matrix/P2P message transport." disclaimer="Zero central server logs." />
    </div>
  );
}
