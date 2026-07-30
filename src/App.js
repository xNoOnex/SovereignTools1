import React, { useState, useEffect, useRef } from 'react';
import { checkAndRequestPermissions } from './services/permissions';

const BLOATWARE_DATABASE = [
  { id: 'bixby_agent', pkg: 'com.samsung.android.bixby.agent', name: 'Bixby Voice Assistant', category: 'Samsung', risk: 'safe' },
  { id: 'fb_system', pkg: 'com.facebook.system', name: 'Meta System Installer', category: 'Meta', risk: 'safe' },
  { id: 'google_wellbeing', pkg: 'com.google.android.apps.wellbeing', name: 'Digital Wellbeing Surveillance', category: 'Google', risk: 'caution' },
  { id: 'carrier_hub', pkg: 'com.carrierhub.service', name: 'Carrier Hub Diagnostics', category: 'Carrier', risk: 'safe' },
];

function App() {
  const [masterPin, setMasterPin] = useState(localStorage.getItem('sovereign_pin') || '');
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinSetup, setPinSetup] = useState(!localStorage.getItem('sovereign_pin'));

  const [expertMode, setExpertMode] = useState(true);
  const [activeTab, setActiveTab] = useState(11); // Default to Cryptography Tab
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // --- TAB 1: LOCAL AI STATE ---
  const [aiInput, setAiInput] = useState('');
  const [aiLogs, setAiLogs] = useState([{ sender: 'ai', text: 'Sovereign On-Device Assistant ready.' }]);

  // --- TAB 6: EXIF-FREE CAMERA STATE ---
  const videoCamRef = useRef(null);
  const canvasRef = useRef(null);
  const [camActive, setCamActive] = useState(false);
  const [capturedImg, setCapturedImg] = useState(null);

  // --- TAB 11: CRYPTOGRAPHY & PGP VAULT STATE ---
  const [cryptoSubTab, setCryptoSubTab] = useState('aes'); // 'aes', 'pgp', 'hash'
  const [plainText, setPlainText] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [cipherText, setCipherText] = useState('');
  const [cryptoStatus, setCryptoStatus] = useState('');

  // PGP / Asymmetric Keys
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [keyGenLoading, setKeyGenLoading] = useState(false);

  // Hashing State
  const [hashInput, setHashInput] = useState('');
  const [sha256Result, setSha256Result] = useState('');

  // --- TAB 16: DEBLOATER STATE ---
  const [selectedPkgs, setSelectedPkgs] = useState([]);

  const handleAuth = () => {
    if (pinSetup) {
      if (pinInput.length < 4) return alert('PIN must be at least 4 digits');
      localStorage.setItem('sovereign_pin', pinInput);
      setMasterPin(pinInput); setPinSetup(false); setIsLocked(false);
    } else {
      if (pinInput === masterPin) setIsLocked(false);
      else alert('Incorrect Master PIN');
    }
    setPinInput('');
  };

  // --- AES-256-GCM ENCRYPTION HELPERS ---
  const getKeyMaterial = (password) => {
    const enc = new TextEncoder();
    return window.crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
  };

  const deriveKey = async (password, salt) => {
    const keyMaterial = await getKeyMaterial(password);
    return window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  };

  const handleAesEncrypt = async () => {
    if (!plainText || !passphrase) return alert('Enter both text and a passphrase');
    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(passphrase, salt);
      const enc = new TextEncoder();

      const encryptedContent = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc.encode(plainText)
      );

      const buffer = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
      buffer.set(salt, 0);
      buffer.set(iv, salt.length);
      buffer.set(new Uint8Array(encryptedContent), salt.length + iv.length);

      const b64 = btoa(String.fromCharCode.apply(null, buffer));
      setCipherText(b64);
      setCryptoStatus('✅ Encrypted with AES-256-GCM + PBKDF2 (100,000 iterations)');
    } catch (e) {
      setCryptoStatus('❌ Encryption failed: ' + e.message);
    }
  };

  const handleAesDecrypt = async () => {
    if (!cipherText || !passphrase) return alert('Enter both cipher text and passphrase');
    try {
      const raw = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));
      const salt = raw.slice(0, 16);
      const iv = raw.slice(16, 28);
      const data = raw.slice(28);

      const key = await deriveKey(passphrase, salt);
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        data
      );

      const dec = new TextDecoder();
      setPlainText(dec.decode(decrypted));
      setCryptoStatus('✅ Decryption successful! Plaintext restored.');
    } catch (e) {
      setCryptoStatus('❌ Decryption failed! Invalid passphrase or corrupted ciphertext.');
    }
  };

  // --- ON-DEVICE RSA/PGP KEYPAIR GENERATION ---
  const generateKeyPair = async () => {
    setKeyGenLoading(true);
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );

      const exportedPub = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
      const exportedPriv = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

      const pubB64 = btoa(String.fromCharCode.apply(null, new Uint8Array(exportedPub)));
      const privB64 = btoa(String.fromCharCode.apply(null, new Uint8Array(exportedPriv)));

      setPublicKey(`-----BEGIN PUBLIC KEY-----\n${pubB64}\n-----END PUBLIC KEY-----`);
      setPrivateKey(`-----BEGIN PRIVATE KEY-----\n${privB64}\n-----END PRIVATE KEY-----`);
    } catch (e) {
      alert('Key generation error: ' + e.message);
    }
    setKeyGenLoading(false);
  };

  // --- SHA-256 HASHER ---
  const computeHash = async (val) => {
    setHashInput(val);
    if (!val) { setSha256Result(''); return; }
    const enc = new TextEncoder();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(val));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setSha256Result(hashHex);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setStatusMsg(`${label} copied to clipboard!`);
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const allMenuItems = [
    { id: 1, name: '1. Home / Local AI Assistant', expertOnly: false },
    { id: 4, name: '4. Notes, Docs & Sovereign Sheets', expertOnly: false },
    { id: 6, name: '6. EXIF-Free Camera', expertOnly: false },
    { id: 8, name: '8. Sovereign Video Player', expertOnly: false },
    { id: 10, name: '10. Password Manager & Vault', expertOnly: false },
    { id: 11, name: '11. Cryptography & PGP Vault', expertOnly: false },
    { id: 16, name: '16. Shizuku Debloater (Expert)', expertOnly: true },
    { id: 17, name: '17. Settings & Permissions', expertOnly: false },
  ];

  const visibleMenuItems = allMenuItems.filter(item => expertMode || !item.expertOnly);

  if (isLocked) {
    return (
      <div style={{ padding: '30px', background: '#0a0a0a', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: '#00ffcc' }}>🛡️ Sovereign Vault Lock</h2>
        <input 
          type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)}
          placeholder="••••" maxLength={8}
          style={{ padding: '12px', fontSize: '18px', textAlign: 'center', width: '200px', borderRadius: '6px', border: '1px solid #333', background: '#1e1e1e', color: '#fff', marginBottom: '15px' }}
        />
        <button onClick={handleAuth} style={{ padding: '12px 24px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px' }}>
          {pinSetup ? 'Set PIN & Unlock' : 'Unlock App'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ padding: '15px', background: '#121212', display: 'flex', alignItems: 'center', borderBottom: '1px solid #222' }}>
        <button onClick={() => setDrawerOpen(!drawerOpen)} style={{ background: 'none', border: 'none', color: '#00ffcc', fontSize: '22px', marginRight: '15px' }}>☰</button>
        <h1 style={{ fontSize: '18px', margin: 0, color: '#00ffcc' }}>Sovereignty Suite</h1>
      </header>

      {drawerOpen && (
        <div style={{ background: '#161616', borderBottom: '2px solid #00ffcc', padding: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {visibleMenuItems.map(item => (
              <button 
                key={item.id}
                onClick={() => { setActiveTab(item.id); setDrawerOpen(false); }}
                style={{ padding: '10px', textAlign: 'left', background: activeTab === item.id ? '#1b4d3e' : '#222', color: activeTab === item.id ? '#00ffcc' : '#ccc', border: '1px solid #333', borderRadius: '4px' }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <main style={{ padding: '15px' }}>
        {/* --- TAB 11: CRYPTOGRAPHY & PGP VAULT --- */}
        {activeTab === 11 && (
          <div>
            {/* Sub-tab Switcher */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '15px' }}>
              <button onClick={() => setCryptoSubTab('aes')} style={{ flex: 1, padding: '10px', background: cryptoSubTab === 'aes' ? '#1b4d3e' : '#121212', color: cryptoSubTab === 'aes' ? '#00ffcc' : '#888', border: '1px solid #333', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>🔐 AES-256 Text</button>
              <button onClick={() => setCryptoSubTab('pgp')} style={{ flex: 1, padding: '10px', background: cryptoSubTab === 'pgp' ? '#1b4d3e' : '#121212', color: cryptoSubTab === 'pgp' ? '#00ffcc' : '#888', border: '1px solid #333', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>🔑 RSA/PGP Keys</button>
              <button onClick={() => setCryptoSubTab('hash')} style={{ flex: 1, padding: '10px', background: cryptoSubTab === 'hash' ? '#1b4d3e' : '#121212', color: cryptoSubTab === 'hash' ? '#00ffcc' : '#888', border: '1px solid #333', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>⚡ SHA-256 Hasher</button>
            </div>

            {statusMsg && <p style={{ color: '#00ffcc', fontSize: '12px', fontStyle: 'italic', marginBottom: '10px' }}>{statusMsg}</p>}

            {/* AES-256 MODULE */}
            {cryptoSubTab === 'aes' && (
              <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                <h2 style={{ color: '#00ffcc', marginTop: 0 }}>AES-256-GCM Symmetric Encryption</h2>
                <p style={{ color: '#888', fontSize: '12px' }}>Encrypt sensitive text messages into scrambled ciphertext using a shared passphrase.</p>

                <input 
                  type="password" 
                  value={passphrase} 
                  onChange={e => setPassphrase(e.target.value)} 
                  placeholder="Master Secret Passphrase..." 
                  style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box' }}
                />

                <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Plain Text Message:</label>
                <textarea 
                  value={plainText} 
                  onChange={e => setPlainText(e.target.value)} 
                  placeholder="Type secret message here..."
                  style={{ width: '100%', height: '90px', padding: '10px', background: '#181818', color: '#fff', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '10px', fontSize: '12px' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px' }}>
                  <button onClick={handleAesEncrypt} style={{ padding: '10px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px' }}>Encrypt Text</button>
                  <button onClick={handleAesDecrypt} style={{ padding: '10px', background: '#333', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px', fontWeight: 'bold' }}>Decrypt Text</button>
                </div>

                {cryptoStatus && <p style={{ fontSize: '11px', color: '#00ffcc', marginBottom: '10px' }}>{cryptoStatus}</p>}

                <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Encrypted Ciphertext (Base64):</label>
                <textarea 
                  value={cipherText} 
                  onChange={e => setCipherText(e.target.value)} 
                  placeholder="Scrambled ciphertext outputs here..."
                  style={{ width: '100%', height: '90px', padding: '10px', background: '#000', color: '#00ff00', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '10px', fontFamily: 'monospace', fontSize: '11px' }}
                />

                <button onClick={() => copyToClipboard(cipherText, 'Ciphertext')} disabled={!cipherText} style={{ width: '100%', padding: '10px', background: cipherText ? '#00cc66' : '#444', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px' }}>
                  Copy Encrypted Ciphertext
                </button>
              </div>
            )}

            {/* PGP / RSA KEY GENERATOR MODULE */}
            {cryptoSubTab === 'pgp' && (
              <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                <h2 style={{ color: '#00ffcc', marginTop: 0 }}>On-Device RSA / PGP Key Generator</h2>
                <p style={{ color: '#888', fontSize: '12px' }}>Generate 2048-bit asymmetric cryptographic keypairs directly on your hardware.</p>

                <button onClick={generateKeyPair} disabled={keyGenLoading} style={{ width: '100%', padding: '12px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px', marginBottom: '15px' }}>
                  {keyGenLoading ? 'Generating 2048-bit Keypair...' : 'Generate New Keypair'}
                </button>

                {publicKey && (
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '12px', color: '#00ffcc', fontWeight: 'bold' }}>Public Key (Shareable):</label>
                      <button onClick={() => copyToClipboard(publicKey, 'Public Key')} style={{ padding: '2px 8px', background: '#222', color: '#00ffcc', border: '1px solid #333', borderRadius: '3px', fontSize: '10px' }}>Copy</button>
                    </div>
                    <textarea readOnly value={publicKey} style={{ width: '100%', height: '80px', padding: '8px', background: '#000', color: '#00ff00', border: '1px solid #333', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', boxSizing: 'border-box' }} />
                  </div>
                )}

                {privateKey && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '12px', color: '#ff4444', fontWeight: 'bold' }}>Private Key (SECRET):</label>
                      <button onClick={() => copyToClipboard(privateKey, 'Private Key')} style={{ padding: '2px 8px', background: '#222', color: '#ff4444', border: '1px solid #333', borderRadius: '3px', fontSize: '10px' }}>Copy</button>
                    </div>
                    <textarea readOnly value={privateKey} style={{ width: '100%', height: '80px', padding: '8px', background: '#000', color: '#ff4444', border: '1px solid #333', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', boxSizing: 'border-box' }} />
                  </div>
                )}
              </div>
            )}

            {/* SHA-256 HASHER MODULE */}
            {cryptoSubTab === 'hash' && (
              <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                <h2 style={{ color: '#00ffcc', marginTop: 0 }}>SHA-256 Data Integrity Hasher</h2>
                <p style={{ color: '#888', fontSize: '12px' }}>Compute real-time cryptographic hashes to verify text or checksums.</p>

                <textarea 
                  value={hashInput} 
                  onChange={e => computeHash(e.target.value)} 
                  placeholder="Type or paste data to hash..."
                  style={{ width: '100%', height: '100px', padding: '10px', background: '#181818', color: '#fff', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '10px', fontSize: '12px' }}
                />

                <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>SHA-256 Hash Output:</label>
                <div style={{ background: '#000', color: '#00ff00', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all', border: '1px solid #333', marginBottom: '10px' }}>
                  {sha256Result || 'Hash will appear here as you type...'}
                </div>

                <button onClick={() => copyToClipboard(sha256Result, 'SHA-256 Hash')} disabled={!sha256Result} style={{ width: '100%', padding: '10px', background: sha256Result ? '#00cc66' : '#444', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px' }}>
                  Copy SHA-256 Hash
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 1: LOCAL AI --- */}
        {activeTab === 1 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>Local AI Assistant</h2>
            <p style={{ color: '#888', fontSize: '12px' }}>On-device execution engine.</p>
          </div>
        )}

        {/* --- TAB 17: SETTINGS --- */}
        {activeTab === 17 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>System Controls</h2>
            <button onClick={() => { localStorage.clear(); alert('Wiped!'); window.location.reload(); }} style={{ width: '100%', padding: '10px', background: '#ff4444', color: '#fff', border: 'none', borderRadius: '4px' }}>Reset Master PIN & Wipe Storage</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
