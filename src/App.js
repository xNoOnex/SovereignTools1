import React, { useState, useEffect } from 'react';
import { checkAndRequestPermissions } from './services/permissions';

function App() {
  // Security Lock State
  const [masterPin, setMasterPin] = useState(localStorage.getItem('sovereign_pin') || '');
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinSetup, setPinSetup] = useState(!localStorage.getItem('sovereign_pin'));

  // Settings & App State
  const [expertMode, setExpertMode] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Permission State
  const [permStatus, setPermStatus] = useState({
    camera: 'NOT CHECKED',
    bluetooth: 'NOT CHECKED',
    location: 'NOT CHECKED'
  });
  const [permLoading, setPermLoading] = useState(false);

  // AI State
  const [aiInput, setAiInput] = useState('');
  const [aiLogs, setAiLogs] = useState([
    { sender: 'ai', text: 'Sovereign On-Device Assistant ready. 100% local, zero cloud telemetry.' }
  ]);

  // Debloater State
  const [customPackage, setCustomPackage] = useState('');
  const [debloaterCommands, setDebloaterCommands] = useState([]);

  // NetSec State
  const [targetIp, setTargetIp] = useState('127.0.0.1');
  const [netsecResults, setNetsecResults] = useState('');

  // Handle Lock Screen Passcode
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

  // Trigger Hardware Permission Popups
  const handleRequestPermissions = async () => {
    setPermLoading(true);
    const results = await checkAndRequestPermissions();
    setPermStatus(results);
    setPermLoading(false);
  };

  // Menu Items Definition
  const allMenuItems = [
    { id: 1, name: '1. Home / Local AI Assistant', expertOnly: false },
    { id: 3, name: '3. P2P Video & BLE Mesh', expertOnly: false },
    { id: 4, name: '4. Notes & AES-256 Vault', expertOnly: false },
    { id: 6, name: '6. EXIF-Free Camera', expertOnly: false },
    { id: 12, name: '12. Multi-Pass File Shredder', expertOnly: false },
    { id: 15, name: '15. NetSec Diagnostics (Expert)', expertOnly: true },
    { id: 16, name: '16. Shizuku Debloater (Expert)', expertOnly: true },
    { id: 17, name: '17. Settings & Security', expertOnly: false },
  ];

  const visibleMenuItems = allMenuItems.filter(item => expertMode || !item.expertOnly);

  if (isLocked) {
    return (
      <div style={{ padding: '30px', background: '#0a0a0a', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <h2 style={{ color: '#00ffcc', marginBottom: '10px' }}>🛡️ Sovereign Vault Lock</h2>
        <p style={{ color: '#aaa', marginBottom: '20px' }}>
          {pinSetup ? 'Create a Master PIN to lock your app:' : 'Enter your Master PIN to unlock:'}
        </p>
        <input 
          type="password" 
          value={pinInput} 
          onChange={(e) => setPinInput(e.target.value)}
          placeholder="••••"
          maxLength={8}
          style={{ padding: '12px', fontSize: '18px', textAlign: 'center', width: '200px', borderRadius: '6px', border: '1px solid #333', background: '#1e1e1e', color: '#fff', marginBottom: '15px' }}
        />
        <button 
          onClick={handleAuth}
          style={{ padding: '12px 24px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px', fontSize: '16px' }}
        >
          {pinSetup ? 'Set PIN & Unlock' : 'Unlock App'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ padding: '15px', background: '#121212', display: 'flex', alignItems: 'center', borderBottom: '1px solid #222' }}>
        <button 
          onClick={() => setDrawerOpen(!drawerOpen)} 
          style={{ background: 'none', border: 'none', color: '#00ffcc', fontSize: '22px', marginRight: '15px' }}
        >
          ☰
        </button>
        <h1 style={{ fontSize: '18px', margin: 0, color: '#00ffcc' }}>Sovereignty Suite</h1>
      </header>

      {drawerOpen && (
        <div style={{ background: '#161616', borderBottom: '2px solid #00ffcc', padding: '15px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#888' }}>
            NAVIGATION MENU ({expertMode ? 'EXPERT MODE' : 'EASY MODE'})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {visibleMenuItems.map(item => (
              <button 
                key={item.id}
                onClick={() => { setActiveTab(item.id); setDrawerOpen(false); }}
                style={{ 
                  padding: '10px', 
                  textAlign: 'left', 
                  background: activeTab === item.id ? '#1b4d3e' : '#222', 
                  color: activeTab === item.id ? '#00ffcc' : '#ccc',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <main style={{ padding: '15px' }}>
        {/* Tab 1: Local AI */}
        {activeTab === 1 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>Local AI Assistant</h2>
            <div style={{ minHeight: '180px', maxHeight: '300px', overflowY: 'auto', marginBottom: '15px', padding: '10px', background: '#1a1a1a', borderRadius: '6px' }}>
              {aiLogs.map((log, i) => (
                <div key={i} style={{ padding: '8px', margin: '6px 0', borderRadius: '4px', background: log.sender === 'user' ? '#1b4d3e' : '#262626', color: log.sender === 'user' ? '#00ffcc' : '#ccc' }}>
                  <strong>{log.sender === 'user' ? 'You' : 'AI'}:</strong> {log.text}
                </div>
              ))}
            </div>
            <input 
              style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '4px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', boxSizing: 'border-box' }}
              value={aiInput} 
              onChange={e => setAiInput(e.target.value)} 
              placeholder="Type local query..." 
            />
            <button 
              style={{ width: '100%', padding: '12px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px' }}
              onClick={() => {
                if (!aiInput) return;
                setAiLogs(prev => [...prev, { sender: 'user', text: aiInput }, { sender: 'ai', text: `[Local Engine]: Processed "${aiInput}" on device.` }]);
                setAiInput('');
              }}
            >
              Process Query Locally
            </button>
          </div>
        )}

        {/* Tab 17: Settings & Hardware Permissions */}
        {activeTab === 17 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>System & Hardware Controls</h2>
            
            <label style={{ display: 'flex', alignItems: 'center', background: '#1e1e1e', padding: '12px', borderRadius: '6px', cursor: 'pointer', marginBottom: '15px' }}>
              <input 
                type="checkbox" 
                checked={expertMode} 
                onChange={e => setExpertMode(e.target.checked)} 
                style={{ width: '20px', height: '20px', marginRight: '10px' }}
              />
              <span>Enable Expert Mode (Shows NetSec & Debloater Tools)</span>
            </label>

            <div style={{ background: '#1a1a1a', padding: '12px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #333' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#00ffcc', fontSize: '14px' }}>📡 Hardware Permissions Status</h3>
              <p style={{ margin: '4px 0', fontSize: '13px' }}>📷 Camera: <strong style={{ color: permStatus.camera === 'GRANTED' ? '#00ffcc' : '#ff4444' }}>{permStatus.camera}</strong></p>
              <p style={{ margin: '4px 0', fontSize: '13px' }}>📶 Bluetooth LE: <strong style={{ color: permStatus.bluetooth === 'GRANTED' ? '#00ffcc' : '#ff4444' }}>{permStatus.bluetooth}</strong></p>
              <p style={{ margin: '4px 0', fontSize: '13px' }}>📍 Location: <strong style={{ color: permStatus.location === 'GRANTED' ? '#00ffcc' : '#ff4444' }}>{permStatus.location}</strong></p>
              
              <button 
                onClick={handleRequestPermissions}
                disabled={permLoading}
                style={{ width: '100%', marginTop: '10px', padding: '10px', background: '#333', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px', fontWeight: 'bold' }}
              >
                {permLoading ? 'Prompting Android OS...' : 'Grant / Refresh All Permissions'}
              </button>
            </div>

            <button 
              style={{ width: '100%', padding: '12px', background: '#ff4444', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '4px' }}
              onClick={() => {
                localStorage.clear();
                alert('Master PIN and storage wiped!');
                window.location.reload();
              }}
            >
              Reset Master PIN & Wipe Storage
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
