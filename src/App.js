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
  const [activeTab, setActiveTab] = useState(6); // Default to Camera Tab
  const [drawerOpen, setDrawerOpen] = useState(false);

  // --- TAB 1: LOCAL AI STATE ---
  const [aiInput, setAiInput] = useState('');
  const [aiLogs, setAiLogs] = useState([{ sender: 'ai', text: 'Sovereign On-Device Assistant ready.' }]);

  // --- TAB 4: DOCS & SHEETS STATE ---
  const [docSubTab, setDocSubTab] = useState('docs');
  const [docTitle, setDocTitle] = useState('Notes');
  const [docContent, setDocContent] = useState('');

  // --- TAB 6: EXIF-FREE CAMERA STATE ---
  const videoCamRef = useRef(null);
  const canvasRef = useRef(null);
  const [camActive, setCamActive] = useState(false);
  const [capturedImg, setCapturedImg] = useState(null);
  const [exifStatus, setExifStatus] = useState('');

  // --- TAB 8: VIDEO PLAYER STATE ---
  const videoRef = useRef(null);
  const [playlist, setPlaylist] = useState([]);

  // --- TAB 10: PASSWORD MANAGER STATE ---
  const [generatedPassword, setGeneratedPassword] = useState('');

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

  // --- EXIF-FREE CAMERA LOGIC ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (videoCamRef.current) {
        videoCamRef.current.srcObject = stream;
        setCamActive(true);
      }
    } catch (err) {
      alert('Camera access blocked. Check permissions in Tab 17.');
    }
  };

  const stopCamera = () => {
    if (videoCamRef.current && videoCamRef.current.srcObject) {
      const stream = videoCamRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      setCamActive(false);
    }
  };

  const captureCleanPhoto = () => {
    if (!videoCamRef.current || !canvasRef.current) return;
    const video = videoCamRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to raw PNG data URL (Strips all EXIF metadata natively)
    const cleanDataUrl = canvas.toDataURL('image/png');
    setCapturedImg(cleanDataUrl);
    setExifStatus('✅ Image sanitized in memory. 0 GPS coordinates, 0 device IDs attached.');
  };

  const downloadCleanPhoto = () => {
    if (!capturedImg) return;
    const a = document.createElement('a');
    a.href = capturedImg;
    a.download = `SOVEREIGN_CLEAN_${Date.now()}.png`;
    a.click();
  };

  const allMenuItems = [
    { id: 1, name: '1. Home / Local AI Assistant', expertOnly: false },
    { id: 4, name: '4. Notes, Docs & Sovereign Sheets', expertOnly: false },
    { id: 6, name: '6. EXIF-Free Camera', expertOnly: false },
    { id: 8, name: '8. Sovereign Video Player', expertOnly: false },
    { id: 10, name: '10. Password Manager & Vault', expertOnly: false },
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
        {/* --- TAB 6: EXIF-FREE CAMERA --- */}
        {activeTab === 6 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>📷 EXIF-Free Privacy Camera</h2>
            <p style={{ color: '#888', fontSize: '12px' }}>Strips all GPS tracking, device serial numbers, and metadata from captured photos.</p>

            {/* Live Camera Viewfinder */}
            <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative', marginBottom: '15px', minHeight: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <video ref={videoCamRef} autoPlay playsInline style={{ width: '100%', maxHeight: '280px', display: camActive ? 'block' : 'none' }} />
              {!camActive && <p style={{ color: '#555', fontSize: '13px' }}>Camera is currently off.</p>}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              {!camActive ? (
                <button onClick={startCamera} style={{ padding: '12px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px' }}>Start Camera</button>
              ) : (
                <button onClick={stopCamera} style={{ padding: '12px', background: '#333', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '4px' }}>Stop Camera</button>
              )}
              <button onClick={captureCleanPhoto} disabled={!camActive} style={{ padding: '12px', background: camActive ? '#00ffcc' : '#444', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px' }}>Take Clean Photo</button>
            </div>

            {/* Sanitized Output Preview */}
            {capturedImg && (
              <div style={{ background: '#181818', padding: '12px', borderRadius: '6px', border: '1px solid #2a2a2a' }}>
                <h3 style={{ color: '#00ffcc', margin: '0 0 8px 0', fontSize: '13px' }}>Sanitized Photo Preview:</h3>
                <img src={capturedImg} alt="Sanitized" style={{ width: '100%', borderRadius: '4px', marginBottom: '10px' }} />
                <p style={{ color: '#00ffcc', fontSize: '11px', margin: '0 0 10px 0' }}>{exifStatus}</p>
                <button onClick={downloadCleanPhoto} style={{ width: '100%', padding: '10px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px' }}>Save Clean Photo to Device</button>
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
