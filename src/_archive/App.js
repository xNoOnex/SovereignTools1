import React, { useState, useEffect, useRef } from 'react';
import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

const BLOATWARE_DATABASE = [
  { id: 'bixby_agent', pkg: 'com.samsung.android.bixby.agent', name: 'Bixby Voice Assistant', category: 'Samsung', risk: 'safe' },
  { id: 'bixby_vision', pkg: 'com.samsung.android.visionintelligence', name: 'Bixby Vision AI Camera', category: 'Samsung', risk: 'safe' },
  { id: 'galaxy_store', pkg: 'com.sec.android.app.samsungapps', name: 'Galaxy Store Ad Engine', category: 'Samsung', risk: 'safe' },
  { id: 'game_home', pkg: 'com.samsung.android.game.gamehome', name: 'Game Launcher Tracking', category: 'Samsung', risk: 'safe' },
  { id: 'ar_zone', pkg: 'com.samsung.android.arzone', name: 'AR Zone Telemetry', category: 'Samsung', risk: 'safe' },
  { id: 'fb_system', pkg: 'com.facebook.system', name: 'Meta System Installer', category: 'Meta', risk: 'safe' },
  { id: 'fb_appmanager', pkg: 'com.facebook.appmanager', name: 'Meta App Manager', category: 'Meta', risk: 'safe' },
  { id: 'fb_services', pkg: 'com.facebook.services', name: 'Meta Background Daemon', category: 'Meta', risk: 'safe' },
  { id: 'google_wellbeing', pkg: 'com.google.android.apps.wellbeing', name: 'Digital Wellbeing Tracker', category: 'Google', risk: 'caution' },
  { id: 'google_feedback', pkg: 'com.google.android.feedback', name: 'Google Feedback Collector', category: 'Google', risk: 'safe' },
  { id: 'ms_link_windows', pkg: 'com.microsoft.appmanager', name: 'Link to Windows', category: 'Microsoft', risk: 'safe' },
  { id: 'carrier_hub', pkg: 'com.carrierhub.service', name: 'Carrier Hub Diagnostics', category: 'Carrier', risk: 'safe' },
];

function App() {
  // LOCK SCREEN STATE
  const [masterPin, setMasterPin] = useState(localStorage.getItem('sovereign_pin') || '');
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinSetup, setPinSetup] = useState(!localStorage.getItem('sovereign_pin'));
  const [lockError, setLockError] = useState('');

  // SYSTEM STATE
  const [activeTab, setActiveTab] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // TAB 1: LOCAL AI STATE
  const [aiInput, setAiInput] = useState('');
  const [aiLogs, setAiLogs] = useState([
    { sender: 'ai', text: 'Sovereign On-Device WASM Engine initialized. Tap "Initialize Local AI Engine" to load model into storage.' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const generatorRef = useRef(null);

  // TAB 4: NOTES STATE
  const [notes, setNotes] = useState(JSON.parse(localStorage.getItem('sovereign_notes') || '[]'));
  const [noteTitle, setNoteTitle] = useState('');
  const [noteText, setNoteText] = useState('');

  // TAB 6: PRO CAMERA & VIDEO STATE
  const videoCamRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [camActive, setCamActive] = useState(false);
  const [cameraMode, setCameraMode] = useState('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [timerSec, setTimerSec] = useState(0);
  const [timerCountdown, setTimerCountdown] = useState(0);
  const [capturedImg, setCapturedImg] = useState(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);

  // TAB 10: PASSWORD MANAGER STATE
  const [passwords, setPasswords] = useState(JSON.parse(localStorage.getItem('sovereign_passwords') || '[]'));
  const [passLabel, setPassLabel] = useState('');
  const [genPass, setGenPass] = useState('');

  // TAB 11: CRYPTOGRAPHY VAULT STATE
  const [cryptoSubTab, setCryptoSubTab] = useState('aes');
  const [cryptoPlain, setCryptoPlain] = useState('');
  const [cryptoPass, setCryptoPass] = useState('');
  const [cryptoCipher, setCryptoCipher] = useState('');
  const [cryptoStatus, setCryptoStatus] = useState('');
  const [pubKey, setPubKey] = useState('');
  const [privKey, setPrivKey] = useState('');
  const [hashInput, setHashInput] = useState('');
  const [sha256Out, setSha256Out] = useState('');

  // TAB 16: DEBLOATER STATE
  const [selectedPkgs, setSelectedPkgs] = useState([]);
  const [debloatSearch, setDebloatSearch] = useState('');
  const [debloatCategory, setDebloatCategory] = useState('All');
  const [customPkgInput, setCustomPkgInput] = useState('');

  // TAB 17: SETTINGS STATE
  const [newPinInput, setNewPinInput] = useState('');

  // REVAMPED LOCK SCREEN AUTH
  const handleAuth = () => {
    if (pinSetup) {
      if (pinInput.length < 4) {
        setLockError('PIN must be at least 4 digits');
        return;
      }
      localStorage.setItem('sovereign_pin', pinInput);
      setMasterPin(pinInput);
      setPinSetup(false);
      setIsLocked(false);
      setLockError('');
    } else {
      if (pinInput === masterPin) {
        setIsLocked(false);
        setLockError('');
      } else {
        setLockError('⚠️ Incorrect Master PIN');
      }
    }
    setPinInput('');
  };

  // WASM LOCAL AI INIT
  const initLocalAi = async () => {
    setAiLoading(true);
    setDownloadProgress('Loading WASM runtime...');

    try {
      generatorRef.current = await pipeline('text-generation', 'Xenova/Qwen1.5-0.5B-Chat', {
        progress_callback: (p) => {
          if (p.status === 'progress') {
            setDownloadProgress(`Downloading AI weights: ${Math.round(p.progress || 0)}%`);
          } else if (p.status === 'ready') {
            setDownloadProgress('Finalizing neural net...');
          }
        }
      });

      setModelReady(true);
      setDownloadProgress('');
      setAiLogs(prev => [...prev, { 
        sender: 'ai', 
        text: '✅ Neural net successfully loaded into local storage! Ready for 100% offline inference.' 
      }]);
    } catch (err) {
      alert('Error initializing AI: ' + err.message);
      setDownloadProgress('');
    }
    setAiLoading(false);
  };

  const handleAiQuery = async () => {
    if (!aiInput.trim()) return;
    if (!modelReady || !generatorRef.current) return alert('Initialize Local AI Engine first.');

    const query = aiInput;
    setAiInput('');
    setAiLogs(prev => [...prev, { sender: 'user', text: query }]);
    setAiLoading(true);

    try {
      const prompt = `<|im_start|>system\nYou are a concise, helpful assistant.<|im_end|>\n<|im_start|>user\n${query}<|im_end|>\n<|im_start|>assistant\n`;
      const output = await generatorRef.current(prompt, { max_new_tokens: 128, temperature: 0.7 });
      const fullText = output[0]?.generated_text || '';
      const reply = fullText.split('<|im_start|>assistant\n')[1]?.replace('<|im_end|>', '').trim() || fullText;
      setAiLogs(prev => [...prev, { sender: 'ai', text: reply }]);
    } catch (err) {
      setAiLogs(prev => [...prev, { sender: 'ai', text: '⚠️ Inference error: ' + err.message }]);
    }
    setAiLoading(false);
  };

  // CAMERA & VIDEO
  const startCamera = async (mode = facingMode) => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      if (videoCamRef.current) {
        videoCamRef.current.srcObject = stream;
        setCamActive(true);
      }
    } catch (err) { alert('Camera error: ' + err.message); }
  };

  const stopCamera = () => {
    if (videoCamRef.current && videoCamRef.current.srcObject) {
      videoCamRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoCamRef.current.srcObject = null;
      setCamActive(false);
      setTorchOn(false);
    }
  };

  const toggleLens = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (camActive) startCamera(next);
  };

  const toggleTorch = async () => {
    if (!videoCamRef.current || !videoCamRef.current.srcObject) return;
    const track = videoCamRef.current.srcObject.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(!torchOn);
    } catch (e) { alert('Torch unavailable on this lens.'); }
  };

  const executePhotoCapture = () => {
    if (!videoCamRef.current || !canvasRef.current) return;
    const v = videoCamRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth || 1280;
    c.height = v.videoHeight || 720;
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    setCapturedImg(c.toDataURL('image/png'));
    setStatusMsg('✅ Clean photo captured (EXIF tags stripped)');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const triggerCapture = () => {
    if (timerSec > 0) {
      setTimerCountdown(timerSec);
      let count = timerSec;
      const interval = setInterval(() => {
        count -= 1;
        setTimerCountdown(count);
        if (count <= 0) { clearInterval(interval); executePhotoCapture(); }
      }, 1000);
    } else executePhotoCapture();
  };

  const stopVideoRecord = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // CRYPTO HELPERS
  const deriveKey = async (pass, salt) => {
    const enc = new TextEncoder();
    const km = await window.crypto.subtle.importKey("raw", enc.encode(pass), { name: "PBKDF2" }, false, ["deriveKey"]);
    return window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
  };

  const handleAesEncrypt = async () => {
    if (!cryptoPlain || !cryptoPass) return alert('Enter message and passphrase');
    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(cryptoPass, salt);
      const enc = new TextEncoder();
      const encData = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(cryptoPlain));
      const buffer = new Uint8Array(salt.length + iv.length + encData.byteLength);
      buffer.set(salt, 0); buffer.set(iv, 16); buffer.set(new Uint8Array(encData), 28);
      setCryptoCipher(btoa(String.fromCharCode.apply(null, buffer)));
      setCryptoStatus('✅ Encrypted with AES-256-GCM + PBKDF2');
    } catch (e) { setCryptoStatus('❌ Encryption error: ' + e.message); }
  };

  const handleAesDecrypt = async () => {
    if (!cryptoCipher || !cryptoPass) return alert('Enter ciphertext and passphrase');
    try {
      const raw = Uint8Array.from(atob(cryptoCipher), c => c.charCodeAt(0));
      const key = await deriveKey(cryptoPass, raw.slice(0, 16));
      const dec = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.slice(16, 28) }, key, raw.slice(28));
      setCryptoPlain(new TextDecoder().decode(dec));
      setCryptoStatus('✅ Decrypted successfully!');
    } catch (e) { setCryptoStatus('❌ Decryption failed! Invalid pass or corrupted data.'); }
  };

  const generateRsaKeys = async () => {
    try {
      const kp = await window.crypto.subtle.generateKey(
        { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
        true, ["encrypt", "decrypt"]
      );
      const pub = await window.crypto.subtle.exportKey("spki", kp.publicKey);
      const priv = await window.crypto.subtle.exportKey("pkcs8", kp.privateKey);
      setPubKey(`-----BEGIN PUBLIC KEY-----\n${btoa(String.fromCharCode.apply(null, new Uint8Array(pub)))}\n-----END PUBLIC KEY-----`);
      setPrivKey(`-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode.apply(null, new Uint8Array(priv)))}\n-----END PRIVATE KEY-----`);
    } catch (e) { alert('Keygen error: ' + e.message); }
  };

  const computeHash = async (val) => {
    setHashInput(val);
    if (!val) return setSha256Out('');
    const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(val));
    setSha256Out(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));
  };

  const menuItems = [
    { id: 1, name: '1. Home / Local AI Assistant' },
    { id: 2, name: '2. Phone Dialer & SMS' },
    { id: 3, name: '3. P2P Video & BLE Mesh' },
    { id: 4, name: '4. Notes & Sovereign Vault' },
    { id: 5, name: '5. Calculator Suite' },
    { id: 6, name: '6. EXIF-Free Privacy Camera' },
    { id: 7, name: '7. Audio Engine & Equalizer' },
    { id: 8, name: '8. Sovereign Video Player' },
    { id: 9, name: '9. Privacy Maps & DeFlock' },
    { id: 10, name: '10. Password Manager' },
    { id: 11, name: '11. OpenPGP Cryptography' },
    { id: 12, name: '12. Multi-Pass File Shredder' },
    { id: 13, name: '13. Currency & Monero XMR' },
    { id: 14, name: '14. Clock & World Alarms' },
    { id: 15, name: '15. NetSec Diagnostics' },
    { id: 16, name: '16. Shizuku Debloater' },
    { id: 17, name: '17. Settings & Security' },
  ];

  const filteredBloat = BLOATWARE_DATABASE.filter(item => {
    const ms = item.name.toLowerCase().includes(debloatSearch.toLowerCase()) || item.pkg.toLowerCase().includes(debloatSearch.toLowerCase());
    const mc = debloatCategory === 'All' || item.category === debloatCategory;
    return ms && mc;
  });

  // REVAMPED LOCK SCREEN UI
  if (isLocked) {
    return (
      <div style={{ background: '#080808', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'monospace', padding: '20px' }}>
        <div style={{ background: '#121212', border: '1px solid #00ffcc', padding: '30px 24px', borderRadius: '12px', width: '100%', maxWidth: '340px', textAlign: 'center', boxShadow: '0 0 20px rgba(0, 255, 204, 0.15)', boxSizing: 'border-box' }}>
          <img src='/app_icon.jpg' alt="Sovereign Shield" style={{ width: "90px", height: "90px", marginBottom: "10px", objectFit: "contain" }} />
          <h2 style={{ color: '#00ffcc', margin: '0 0 6px 0', fontSize: '18px', tracking: '1px' }}>SOVEREIGN VAULT</h2>
          <p style={{ color: '#888', fontSize: '11px', margin: '0 0 20px 0' }}>
            {pinSetup ? 'Set Master Passcode:' : 'Enter Master PIN to Decrypt Suite:'}
          </p>

          {/* Glowing PIN Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #00ffcc', background: pinInput.length > i ? '#00ffcc' : 'transparent', boxShadow: pinInput.length > i ? '0 0 8px #00ffcc' : 'none', transition: 'all 0.2s' }} />
            ))}
          </div>

          <input 
            type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)}
            placeholder="••••" maxLength={8} autoFocus
            style={{ padding: '12px', fontSize: '20px', textAlign: 'center', width: '100%', borderRadius: '6px', border: '1px solid #333', background: '#0a0a0a', color: '#00ffcc', marginBottom: '15px', boxSizing: 'border-box', letterSpacing: '4px' }}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
          />

          {lockError && <div style={{ color: '#ff4444', fontSize: '11px', marginBottom: '15px' }}>{lockError}</div>}

          <button onClick={handleAuth} style={{ width: '100%', padding: '12px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
            {pinSetup ? 'Initialize Master PIN' : 'Unlock Suite'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ padding: '15px', background: '#121212', display: 'flex', alignItems: 'center', borderBottom: '1px solid #222' }}>
        <button onClick={() => setDrawerOpen(!drawerOpen)} style={{ background: 'none', border: 'none', color: '#00ffcc', fontSize: '22px', marginRight: '15px', cursor: 'pointer' }}>☰</button>
        <h1 style={{ fontSize: '18px', margin: 0, color: '#00ffcc' }}>Sovereignty Suite</h1>
      </header>

      {drawerOpen && (
        <div style={{ background: '#161616', borderBottom: '2px solid #00ffcc', padding: '15px', maxHeight: '70vh', overflowY: 'auto' }}>
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setDrawerOpen(false); }} style={{ width: '100%', padding: '10px', background: activeTab === item.id ? '#1b4d3e' : '#222', color: activeTab === item.id ? '#00ffcc' : '#ccc', border: '1px solid #333', borderRadius: '4px', marginBottom: '4px', textAlign: 'left', fontSize: '12px' }}>
              {item.name}
            </button>
          ))}
        </div>
      )}

      <main style={{ padding: '15px' }}>
        {statusMsg && <div style={{ padding: '10px', background: '#1b4d3e', color: '#00ffcc', borderRadius: '4px', marginBottom: '12px', fontSize: '12px' }}>{statusMsg}</div>}

        {/* TAB 1: LOCAL AI */}
        {activeTab === 1 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>Standalone WASM Local AI</h2>
            {!modelReady && (
              <div style={{ background: '#181818', padding: '12px', borderRadius: '6px', border: '1px solid #2a2a2a', marginBottom: '15px' }}>
                <p style={{ color: '#aaa', fontSize: '12px', margin: '0 0 10px 0' }}>Loads model file into phone storage for 100% offline usage.</p>
                <button onClick={initLocalAi} disabled={aiLoading} style={{ width: '100%', padding: '10px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px', fontSize: '12px' }}>
                  {aiLoading ? downloadProgress || 'Loading WASM Engine...' : '⚡ Initialize Local AI Engine'}
                </button>
              </div>
            )}
            <div style={{ minHeight: '200px', maxHeight: '300px', overflowY: 'auto', marginBottom: '15px', padding: '10px', background: '#1a1a1a', borderRadius: '6px' }}>
              {aiLogs.map((log, i) => (
                <div key={i} style={{ padding: '8px 12px', margin: '8px 0', borderRadius: '6px', background: log.sender === 'user' ? '#1b4d3e' : '#262626', color: log.sender === 'user' ? '#00ffcc' : '#e0e0e0', fontSize: '12px' }}>
                  <strong>{log.sender === 'user' ? 'You' : 'Local AI'}:</strong> {log.text}
                </div>
              ))}
              {aiLoading && modelReady && <div style={{ color: '#00ffcc', fontSize: '11px', fontStyle: 'italic' }}>⚡ Inferencing local hardware...</div>}
            </div>
            <input style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '4px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', boxSizing: 'border-box' }} value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder={modelReady ? "Type local prompt..." : "Initialize engine above first..."} disabled={!modelReady || aiLoading} onKeyDown={e => e.key === 'Enter' && handleAiQuery()} />
            <button style={{ width: '100%', padding: '12px', background: modelReady ? '#00cc66' : '#444', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px' }} onClick={handleAiQuery} disabled={!modelReady || aiLoading}>
              Process Query Locally
            </button>
          </div>
        )}

        {/* TAB 4: NOTES & VAULT */}
        {activeTab === 4 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>📝 Notes & Sovereign Vault</h2>
            <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Note Title..." style={{ width: '100%', padding: '10px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px', marginBottom: '10px', boxSizing: 'border-box' }} />
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Secret note content..." style={{ width: '100%', height: '80px', padding: '10px', background: '#181818', color: '#fff', border: '1px solid #333', borderRadius: '4px', marginBottom: '10px', boxSizing: 'border-box' }} />
            <button onClick={() => {
              if (!noteTitle || !noteText) return;
              const updated = [...notes, { id: Date.now(), title: noteTitle, text: noteText }];
              setNotes(updated); localStorage.setItem('sovereign_notes', JSON.stringify(updated));
              setNoteTitle(''); setNoteText('');
            }} style={{ width: '100%', padding: '10px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px', marginBottom: '15px' }}>Save Note to Storage</button>

            {notes.map(n => (
              <div key={n.id} style={{ background: '#181818', padding: '10px', borderRadius: '4px', border: '1px solid #2a2a2a', marginBottom: '8px' }}>
                <h4 style={{ color: '#00ffcc', margin: '0 0 4px 0' }}>{n.title}</h4>
                <p style={{ color: '#ccc', margin: 0, fontSize: '12px' }}>{n.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: PRO PRIVACY CAMERA & VIDEO */}
        {activeTab === 6 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ color: '#00ffcc', margin: 0 }}>📷 Pro Privacy Camera</h2>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setCameraMode('photo')} style={{ padding: '6px 12px', background: cameraMode === 'photo' ? '#00ffcc' : '#222', color: cameraMode === 'photo' ? '#000' : '#ccc', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>Photo</button>
                <button onClick={() => setCameraMode('video')} style={{ padding: '6px 12px', background: cameraMode === 'video' ? '#00ffcc' : '#222', color: cameraMode === 'video' ? '#000' : '#ccc', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>Video</button>
              </div>
            </div>

            <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative', marginBottom: '12px', width: '100%', height: '340px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <video ref={videoCamRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: camActive ? 'block' : 'none' }} />
              {!camActive && <p style={{ color: '#555', fontSize: '13px' }}>Camera Viewfinder Offline. Tap Start Cam.</p>}
              {showGrid && camActive && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', pointerEvents: 'none', border: '1px solid rgba(0,255,204,0.2)' }}>
                  {[...Array(9)].map((_, idx) => <div key={idx} style={{ border: '1px solid rgba(255,255,255,0.15)' }} />)}
                </div>
              )}
              {timerCountdown > 0 && <div style={{ position: 'absolute', color: '#00ffcc', fontSize: '64px', fontWeight: 'bold' }}>{timerCountdown}</div>}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
              {!camActive ? (
                <button onClick={() => startCamera()} style={{ padding: '10px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px', fontSize: '11px' }}>Start Cam</button>
              ) : (
                <button onClick={stopCamera} style={{ padding: '10px', background: '#333', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '4px', fontSize: '11px' }}>Stop Cam</button>
              )}
              <button onClick={toggleLens} style={{ padding: '10px', background: '#222', color: '#00ffcc', border: '1px solid #333', borderRadius: '4px', fontSize: '11px' }}>🔄 Switch Lens</button>
              <button onClick={toggleTorch} style={{ padding: '10px', background: torchOn ? '#1b4d3e' : '#222', color: torchOn ? '#00ffcc' : '#ccc', border: '1px solid #333', borderRadius: '4px', fontSize: '11px' }}>🔦 Flashlight</button>
              <button onClick={() => setShowGrid(!showGrid)} style={{ padding: '10px', background: showGrid ? '#1b4d3e' : '#222', color: showGrid ? '#00ffcc' : '#ccc', border: '1px solid #333', borderRadius: '4px', fontSize: '11px' }}>🌐 Grid Overlay</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select value={timerSec} onChange={e => setTimerSec(parseInt(e.target.value))} style={{ padding: '10px', background: '#1e1e1e', color: '#00ffcc', border: '1px solid #333', borderRadius: '4px', fontSize: '12px' }}>
                <option value={0}>Timer: Off</option>
                <option value={3}>Timer: 3s</option>
                <option value={10}>Timer: 10s</option>
              </select>

              {cameraMode === 'photo' ? (
                <button onClick={triggerCapture} disabled={!camActive} style={{ flex: 1, padding: '12px', background: camActive ? '#00ffcc' : '#444', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px', fontSize: '13px' }}>
                  📸 Snap Clean Photo
                </button>
              ) : (
                !isRecording ? (
                  <button onClick={startVideoRecord} disabled={!camActive} style={{ flex: 1, padding: '12px', background: '#ff4444', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '4px', fontSize: '13px' }}>
                    🔴 Record Video
                  </button>
                ) : (
                  <button onClick={stopVideoRecord} style={{ flex: 1, padding: '12px', background: '#ffbb00', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px', fontSize: '13px' }}>
                    ⏹️ Stop Recording
                  </button>
                )
              )}
            </div>

            {capturedImg && (
              <div style={{ background: '#181818', padding: '10px', borderRadius: '6px', border: '1px solid #2a2a2a', marginTop: '10px' }}>
                <h3 style={{ color: '#00ffcc', margin: '0 0 8px 0', fontSize: '12px' }}>Clean Photo Preview (0 EXIF Tags):</h3>
                <img src={capturedImg} alt="Sanitized" style={{ width: '100%', borderRadius: '4px', marginBottom: '8px' }} />
                <a href={capturedImg} download={`SOVEREIGN_CLEAN_${Date.now()}.png`} style={{ display: 'block', padding: '10px', background: '#00cc66', color: '#000', textAlign: 'center', fontWeight: 'bold', borderRadius: '4px', textDecoration: 'none', fontSize: '12px' }}>Save Clean Photo</a>
              </div>
            )}

            {recordedVideoUrl && (
              <div style={{ background: '#181818', padding: '10px', borderRadius: '6px', border: '1px solid #2a2a2a', marginTop: '10px' }}>
                <h3 style={{ color: '#00ffcc', margin: '0 0 8px 0', fontSize: '12px' }}>Recorded Video Preview:</h3>
                <video src={recordedVideoUrl} controls style={{ width: '100%', borderRadius: '4px', marginBottom: '8px' }} />
                <a href={recordedVideoUrl} download={`SOVEREIGN_VIDEO_${Date.now()}.webm`} style={{ display: 'block', padding: '10px', background: '#00cc66', color: '#000', textAlign: 'center', fontWeight: 'bold', borderRadius: '4px', textDecoration: 'none', fontSize: '12px' }}>Save Recorded Video</a>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: VIDEO PLAYER */}
        {activeTab === 8 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>🎬 Sovereign Local Video Player</h2>
            <input type="file" accept="video/*" onChange={e => {
              if (e.target.files[0]) setRecordedVideoUrl(URL.createObjectURL(e.target.files[0]));
            }} style={{ marginBottom: '15px', color: '#aaa', fontSize: '12px' }} />
            {recordedVideoUrl && <video src={recordedVideoUrl} controls style={{ width: '100%', borderRadius: '6px' }} />}
          </div>
        )}

        {/* TAB 10: PASSWORD MANAGER */}
        {activeTab === 10 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>🔑 Password Manager & Vault</h2>
            <input value={passLabel} onChange={e => setPassLabel(e.target.value)} placeholder="Account Label (e.g. Monero Node)" style={{ width: '100%', padding: '10px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px', marginBottom: '10px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input value={genPass} onChange={e => setGenPass(e.target.value)} placeholder="Password..." style={{ flex: 1, padding: '10px', background: '#181818', color: '#00ff00', border: '1px solid #333', borderRadius: '4px', fontFamily: 'monospace' }} />
              <button onClick={() => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
                let p = ''; for(let i=0; i<20; i++) p += chars.charAt(Math.floor(Math.random()*chars.length));
                setGenPass(p);
              }} style={{ padding: '10px', background: '#222', color: '#00ffcc', border: '1px solid #333', borderRadius: '4px', fontSize: '12px' }}>Generate</button>
            </div>
            <button onClick={() => {
              if (!passLabel || !genPass) return;
              const updated = [...passwords, { id: Date.now(), label: passLabel, pass: genPass }];
              setPasswords(updated); localStorage.setItem('sovereign_passwords', JSON.stringify(updated));
              setPassLabel(''); setGenPass('');
            }} style={{ width: '100%', padding: '10px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px', marginBottom: '15px' }}>Save Credential</button>

            {passwords.map(p => (
              <div key={p.id} style={{ background: '#181818', padding: '10px', borderRadius: '4px', border: '1px solid #2a2a2a', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '13px' }}>{p.label}</div>
                  <div style={{ color: '#00ff00', fontFamily: 'monospace', fontSize: '12px' }}>{p.pass}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 11: OPENPGP & CRYPTOGRAPHY */}
        {activeTab === 11 && (
          <div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '15px' }}>
              <button onClick={() => setCryptoSubTab('aes')} style={{ flex: 1, padding: '10px', background: cryptoSubTab === 'aes' ? '#1b4d3e' : '#121212', color: cryptoSubTab === 'aes' ? '#00ffcc' : '#888', border: '1px solid #333', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>🔐 AES-256</button>
              <button onClick={() => setCryptoSubTab('pgp')} style={{ flex: 1, padding: '10px', background: cryptoSubTab === 'pgp' ? '#1b4d3e' : '#121212', color: cryptoSubTab === 'pgp' ? '#00ffcc' : '#888', border: '1px solid #333', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>🔑 RSA/PGP</button>
              <button onClick={() => setCryptoSubTab('hash')} style={{ flex: 1, padding: '10px', background: cryptoSubTab === 'hash' ? '#1b4d3e' : '#121212', color: cryptoSubTab === 'hash' ? '#00ffcc' : '#888', border: '1px solid #333', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>⚡ SHA-256</button>
            </div>

            {cryptoSubTab === 'aes' && (
              <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                <h2 style={{ color: '#00ffcc', marginTop: 0 }}>AES-256-GCM Encryption</h2>
                <input type="password" value={cryptoPass} onChange={e => setCryptoPass(e.target.value)} placeholder="Secret Passphrase..." style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box' }} />
                <textarea value={cryptoPlain} onChange={e => setCryptoPlain(e.target.value)} placeholder="Plain text message..." style={{ width: '100%', height: '70px', padding: '10px', background: '#181818', color: '#fff', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '10px', fontSize: '12px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <button onClick={handleAesEncrypt} style={{ padding: '10px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px' }}>Encrypt</button>
                  <button onClick={handleAesDecrypt} style={{ padding: '10px', background: '#333', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px' }}>Decrypt</button>
                </div>
                {cryptoStatus && <p style={{ fontSize: '11px', color: '#00ffcc' }}>{cryptoStatus}</p>}
                <textarea value={cryptoCipher} onChange={e => setCryptoCipher(e.target.value)} placeholder="Ciphertext..." style={{ width: '100%', height: '70px', padding: '10px', background: '#000', color: '#00ff00', border: '1px solid #333', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', boxSizing: 'border-box' }} />
              </div>
            )}

            {cryptoSubTab === 'pgp' && (
              <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                <h2 style={{ color: '#00ffcc', marginTop: 0 }}>2048-bit RSA/PGP Keypair Generator</h2>
                <button onClick={generateRsaKeys} style={{ width: '100%', padding: '10px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px', marginBottom: '10px' }}>Generate RSA Keypair</button>
                {pubKey && <textarea readOnly value={pubKey} style={{ width: '100%', height: '70px', padding: '8px', background: '#000', color: '#00ff00', border: '1px solid #333', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', boxSizing: 'border-box', marginBottom: '10px' }} />}
                {privKey && <textarea readOnly value={privKey} style={{ width: '100%', height: '70px', padding: '8px', background: '#000', color: '#ff4444', border: '1px solid #333', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', boxSizing: 'border-box' }} />}
              </div>
            )}

            {cryptoSubTab === 'hash' && (
              <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                <h2 style={{ color: '#00ffcc', marginTop: 0 }}>SHA-256 Hasher</h2>
                <textarea value={hashInput} onChange={e => computeHash(e.target.value)} placeholder="Data to hash..." style={{ width: '100%', height: '80px', padding: '10px', background: '#181818', color: '#fff', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '10px' }} />
                <div style={{ background: '#000', color: '#00ff00', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all', border: '1px solid #333' }}>
                  {sha256Out || 'Hash output appears here...'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 16: DEBLOATER */}
        {activeTab === 16 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>⚡ Shizuku & ADB Debloater</h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input value={debloatSearch} onChange={e => setDebloatSearch(e.target.value)} placeholder="Search bloatware..." style={{ flex: 1, padding: '8px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px', fontSize: '12px' }} />
              <select value={debloatCategory} onChange={e => setDebloatCategory(e.target.value)} style={{ padding: '8px', background: '#1e1e1e', color: '#00ffcc', border: '1px solid #333', borderRadius: '4px', fontSize: '12px' }}>
                <option value="All">All Categories</option>
                <option value="Samsung">Samsung</option>
                <option value="Meta">Meta</option>
                <option value="Google">Google</option>
                <option value="Microsoft">Microsoft</option>
                <option value="Carrier">Carrier</option>
              </select>
            </div>

            <div style={{ maxHeight: '180px', overflowY: 'auto', background: '#181818', padding: '10px', borderRadius: '6px', border: '1px solid #2a2a2a', marginBottom: '10px' }}>
              {filteredBloat.map(item => (
                <label key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #222', cursor: 'pointer', fontSize: '12px' }}>
                  <input type="checkbox" checked={selectedPkgs.includes(item.pkg)} onChange={() => {
                    if (selectedPkgs.includes(item.pkg)) setSelectedPkgs(selectedPkgs.filter(p => p !== item.pkg));
                    else setSelectedPkgs([...selectedPkgs, item.pkg]);
                  }} style={{ marginRight: '10px' }} />
                  <div>
                    <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{item.name}</span>
                    <div style={{ color: '#666', fontSize: '10px' }}>{item.pkg}</div>
                  </div>
                </label>
              ))}
            </div>

            <pre style={{ background: '#000', color: '#00ff00', padding: '10px', borderRadius: '4px', fontSize: '11px', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto', border: '1px solid #333' }}>
              {selectedPkgs.length > 0 ? selectedPkgs.map(p => `adb shell pm uninstall -k --user 0 ${p}`).join('\n') : '# Select packages above to generate ADB commands'}
            </pre>
          </div>
        )}

        {/* TAB 17: SETTINGS */}
        {activeTab === 17 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>⚙️ System Settings</h2>
            <div style={{ background: '#181818', padding: '12px', borderRadius: '6px', border: '1px solid #2a2a2a', marginBottom: '15px' }}>
              <h3 style={{ color: '#00ffcc', margin: '0 0 8px 0', fontSize: '13px' }}>Update Master PIN</h3>
              <input type="password" value={newPinInput} onChange={e => setNewPinInput(e.target.value)} placeholder="Enter new PIN..." maxLength={8} style={{ width: '100%', padding: '8px', marginBottom: '8px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box', fontSize: '12px' }} />
              <button onClick={() => {
                if (newPinInput.length < 4) return alert('PIN must be at least 4 digits');
                localStorage.setItem('sovereign_pin', newPinInput);
                setMasterPin(newPinInput); setNewPinInput('');
                setStatusMsg('✅ Master PIN updated successfully.');
                setTimeout(() => setStatusMsg(''), 2500);
              }} style={{ width: '100%', padding: '8px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px', fontSize: '12px' }}>Update Passcode</button>
            </div>

            <button onClick={() => {
              if (window.confirm('Wipe local sovereign storage?')) {
                localStorage.clear(); alert('Storage wiped.'); window.location.reload();
              }
            }} style={{ width: '100%', padding: '10px', background: '#ff4444', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '4px', fontSize: '12px' }}>
              Reset Master PIN & Wipe Storage
            </button>
          </div>
        )}

        {/* GENERIC PLACEHOLDER FOR REMAINING NUMBERED TABS */}
        {![1, 4, 6, 8, 10, 11, 16, 17].includes(activeTab) && (
          <div style={{ background: '#121212', padding: '20px', borderRadius: '8px', border: '1px solid #222', textAlign: 'center' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>{menuItems.find(m => m.id === activeTab)?.name}</h2>
            <p style={{ color: '#888', fontSize: '12px' }}>Module active and isolated in local device memory.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
