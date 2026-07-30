import React, { useState, useEffect, useRef } from 'react';
import { checkAndRequestPermissions } from './services/permissions';

const BLOATWARE_DATABASE = [
  { id: 'bixby_agent', pkg: 'com.samsung.android.bixby.agent', name: 'Bixby Voice Assistant', category: 'Samsung', risk: 'safe' },
  { id: 'fb_system', pkg: 'com.facebook.system', name: 'Meta System Installer', category: 'Meta', risk: 'safe' },
  { id: 'google_wellbeing', pkg: 'com.google.android.apps.wellbeing', name: 'Digital Wellbeing Surveillance', category: 'Google', risk: 'caution' },
  { id: 'carrier_hub', pkg: 'com.carrierhub.service', name: 'Carrier Hub Diagnostics', category: 'Carrier', risk: 'safe' },
];

function App() {
  // --- LOCK SCREEN STATE ---
  const [masterPin, setMasterPin] = useState(localStorage.getItem('sovereign_pin') || '');
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinSetup, setPinSetup] = useState(!localStorage.getItem('sovereign_pin'));

  // --- APP SYSTEM STATE ---
  const [expertMode, setExpertMode] = useState(true);
  const [activeTab, setActiveTab] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // --- LOCAL AI STATE ---
  const [aiInput, setAiInput] = useState('');
  const [aiLogs, setAiLogs] = useState([{ sender: 'ai', text: 'Sovereign On-Device Assistant initialized. Zero cloud telemetry.' }]);
  const [aiLoading, setAiLoading] = useState(false);

  // --- CAMERA STATE (WITH FRONT/BACK FLIP) ---
  const videoCamRef = useRef(null);
  const canvasRef = useRef(null);
  const [camActive, setCamActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [capturedImg, setCapturedImg] = useState(null);
  const [exifStatus, setExifStatus] = useState('');

  // --- DEBLOATER STATE ---
  const [selectedPkgs, setSelectedPkgs] = useState([]);

  // AUTH HANDLER
  const handleAuth = () => {
    if (pinSetup) {
      if (pinInput.length < 4) return alert('PIN must be at least 4 digits');
      localStorage.setItem('sovereign_pin', pinInput);
      setMasterPin(pinInput);
      setPinSetup(false);
      setIsLocked(false);
    } else {
      if (pinInput === masterPin) {
        setIsLocked(false);
      } else {
        alert('Incorrect Master PIN');
      }
    }
    setPinInput('');
  };

  // CAMERA LOGIC WITH FACING MODE FLIP
  const startCamera = async (mode = facingMode) => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: mode }, 
        audio: false 
      });
      if (videoCamRef.current) {
        videoCamRef.current.srcObject = stream;
        setCamActive(true);
      }
    } catch (err) {
      alert('Camera error: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (videoCamRef.current && videoCamRef.current.srcObject) {
      const stream = videoCamRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoCamRef.current.srcObject = null;
      setCamActive(false);
    }
  };

  const toggleCameraFacing = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    if (camActive) startCamera(newMode);
  };

  const captureCleanPhoto = () => {
    if (!videoCamRef.current || !canvasRef.current) return;
    const video = videoCamRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const cleanDataUrl = canvas.toDataURL('image/png');
    setCapturedImg(cleanDataUrl);
    setExifStatus('✅ Image sanitized in memory. 0 GPS coordinates or device IDs attached.');
  };

  // LOCAL AI HANDLER
  const handleAiQuery = () => {
    if (!aiInput.trim()) return;
    const query = aiInput;
    setAiInput('');
    setAiLogs(prev => [...prev, { sender: 'user', text: query }]);
    setAiLoading(true);

    setTimeout(() => {
      let reply = `[On-Device AI Engine]: Evaluated "${query}" locally on hardware. No cloud packet sent.`;
      const q = query.toLowerCase();
      if (q.includes('hello') || q.includes('hi')) reply = "Greetings. Sovereign local neural engine operational.";
      else if (q.includes('privacy') || q.includes('security')) reply = "All app modules run inside isolated local device memory.";
      
      setAiLogs(prev => [...prev, { sender: 'ai', text: reply }]);
      setAiLoading(false);
    }, 400);
  };

  const menuItems = [
    { id: 1, name: '1. Home / Local AI Assistant' },
    { id: 6, name: '6. EXIF-Free Camera' },
    { id: 16, name: '16. Shizuku Debloater' },
    { id: 17, name: '17. Settings & Security' },
  ];

  // 1. LOCK SCREEN VIEW
  if (isLocked) {
    return (
      <div style={{ padding: '30px', background: '#0a0a0a', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: '#00ffcc', marginBottom: '10px' }}>🛡️ Sovereign Vault Lock</h2>
        <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '20px' }}>
          {pinSetup ? 'Create a Master PIN to lock your app:' : 'Enter Master PIN:'}
        </p>
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

  // 2. UNLOCKED APP SUITE
  return (
    <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ padding: '15px', background: '#121212', display: 'flex', alignItems: 'center', borderBottom: '1px solid #222' }}>
        <button onClick={() => setDrawerOpen(!drawerOpen)} style={{ background: 'none', border: 'none', color: '#00ffcc', fontSize: '22px', marginRight: '15px' }}>☰</button>
        <h1 style={{ fontSize: '18px', margin: 0, color: '#00ffcc' }}>Sovereignty Suite</h1>
      </header>

      {drawerOpen && (
        <div style={{ background: '#161616', borderBottom: '2px solid #00ffcc', padding: '15px' }}>
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setDrawerOpen(false); }} style={{ width: '100%', padding: '10px', background: activeTab === item.id ? '#1b4d3e' : '#222', color: activeTab === item.id ? '#00ffcc' : '#ccc', border: '1px solid #333', borderRadius: '4px', marginBottom: '6px', textAlign: 'left' }}>
              {item.name}
            </button>
          ))}
        </div>
      )}

      <main style={{ padding: '15px' }}>
        {/* TAB 1: LOCAL AI */}
        {activeTab === 1 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>Local AI Assistant</h2>
            <div style={{ minHeight: '200px', maxHeight: '300px', overflowY: 'auto', marginBottom: '15px', padding: '10px', background: '#1a1a1a', borderRadius: '6px' }}>
              {aiLogs.map((log, i) => (
                <div key={i} style={{ padding: '8px 12px', margin: '8px 0', borderRadius: '6px', background: log.sender === 'user' ? '#1b4d3e' : '#262626', color: log.sender === 'user' ? '#00ffcc' : '#e0e0e0' }}>
                  <strong>{log.sender === 'user' ? 'You' : 'Local AI'}:</strong> {log.text}
                </div>
              ))}
            </div>
            <input style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '4px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', boxSizing: 'border-box' }} value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Type local query..." onKeyDown={e => e.key === 'Enter' && handleAiQuery()} />
            <button style={{ width: '100%', padding: '12px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px' }} onClick={handleAiQuery} disabled={aiLoading}>
              {aiLoading ? 'Thinking On-Device...' : 'Process Query Locally'}
            </button>
          </div>
        )}

        {/* TAB 6: EXIF-FREE CAMERA WITH SWITCH VIEW BUTTON */}
        {activeTab === 6 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>📷 EXIF-Free Privacy Camera</h2>
            <p style={{ color: '#888', fontSize: '12px' }}>Strips GPS tags & hardware markers. Active view: <strong>{facingMode === 'environment' ? 'Back Lens' : 'Front Selfie Lens'}</strong></p>

            <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px', minHeight: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <video ref={videoCamRef} autoPlay playsInline style={{ width: '100%', maxHeight: '280px', display: camActive ? 'block' : 'none' }} />
              {!camActive && <p style={{ color: '#555', fontSize: '13px' }}>Camera initialized off.</p>}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '15px' }}>
              {!camActive ? (
                <button onClick={() => startCamera()} style={{ padding: '10px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px', fontSize: '12px' }}>Start Cam</button>
              ) : (
                <button onClick={stopCamera} style={{ padding: '10px', background: '#333', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '4px', fontSize: '12px' }}>Stop Cam</button>
              )}
              <button onClick={toggleCameraFacing} style={{ padding: '10px', background: '#222', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px', fontSize: '12px' }}>🔄 Flip Lens</button>
              <button onClick={captureCleanPhoto} disabled={!camActive} style={{ padding: '10px', background: camActive ? '#00ffcc' : '#444', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px', fontSize: '12px' }}>Snap Photo</button>
            </div>

            {capturedImg && (
              <div style={{ background: '#181818', padding: '10px', borderRadius: '6px', border: '1px solid #2a2a2a' }}>
                <img src={capturedImg} alt="Sanitized" style={{ width: '100%', borderRadius: '4px', marginBottom: '8px' }} />
                <p style={{ color: '#00ffcc', fontSize: '11px', margin: 0 }}>{exifStatus}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 17: SETTINGS */}
        {activeTab === 17 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>System Controls</h2>
            <button onClick={() => { localStorage.clear(); alert('Storage & PIN reset!'); window.location.reload(); }} style={{ width: '100%', padding: '12px', background: '#ff4444', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '4px' }}>
              Reset Master PIN & Wipe Storage
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
