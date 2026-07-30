import React, { useState, useEffect, useRef } from 'react';
import { checkAndRequestPermissions } from './services/permissions';

// Pre-loaded Bloatware Database with Risk Ratings
const BLOATWARE_DATABASE = [
  { id: 'bixby_agent', pkg: 'com.samsung.android.bixby.agent', name: 'Bixby Voice Assistant', category: 'Samsung', risk: 'safe' },
  { id: 'bixby_vision', pkg: 'com.samsung.android.visionintelligence', name: 'Bixby Vision AI Camera', category: 'Samsung', risk: 'safe' },
  { id: 'galaxy_store', pkg: 'com.sec.android.app.samsungapps', name: 'Galaxy Store Ad Engine', category: 'Samsung', risk: 'safe' },
  { id: 'game_home', pkg: 'com.samsung.android.game.gamehome', name: 'Game Launcher & Tracking', category: 'Samsung', risk: 'safe' },
  { id: 'ar_zone', pkg: 'com.samsung.android.arzone', name: 'AR Zone Emoji Spyware', category: 'Samsung', risk: 'safe' },
  { id: 'fb_system', pkg: 'com.facebook.system', name: 'Meta System Installer', category: 'Meta', risk: 'safe' },
  { id: 'fb_appmanager', pkg: 'com.facebook.appmanager', name: 'Meta App Manager Telemetry', category: 'Meta', risk: 'safe' },
  { id: 'fb_services', pkg: 'com.facebook.services', name: 'Meta Background Daemon', category: 'Meta', risk: 'safe' },
  { id: 'google_wellbeing', pkg: 'com.google.android.apps.wellbeing', name: 'Digital Wellbeing Surveillance', category: 'Google', risk: 'caution' },
  { id: 'google_feedback', pkg: 'com.google.android.feedback', name: 'Google Feedback Collector', category: 'Google', risk: 'safe' },
  { id: 'ms_link_windows', pkg: 'com.microsoft.appmanager', name: 'Link to Windows', category: 'Microsoft', risk: 'safe' },
  { id: 'carrier_hub', pkg: 'com.carrierhub.service', name: 'Carrier Hub Diagnostics', category: 'Carrier', risk: 'safe' },
];

function App() {
  // --- LOCK SCREEN STATE ---
  const [masterPin, setMasterPin] = useState(localStorage.getItem('sovereign_pin') || '');
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinSetup, setPinSetup] = useState(!localStorage.getItem('sovereign_pin'));

  // --- APP NAVIGATION & SYSTEM STATE ---
  const [expertMode, setExpertMode] = useState(true);
  const [activeTab, setActiveTab] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // --- PERMISSIONS STATE ---
  const [permStatus, setPermStatus] = useState({ camera: 'UNKNOWN', bluetooth: 'UNKNOWN', location: 'UNKNOWN' });
  const [permLoading, setPermLoading] = useState(false);

  // --- TAB 1: LOCAL AI STATE ---
  const [aiInput, setAiInput] = useState('');
  const [aiLogs, setAiLogs] = useState([{ sender: 'ai', text: 'Sovereign On-Device Assistant ready. 100% local, zero cloud telemetry.' }]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiEndpoint, setAiEndpoint] = useState('http://127.0.0.1:11434/api/generate');

  // --- TAB 4: DOCS & SHEETS STATE ---
  const [docSubTab, setDocSubTab] = useState('docs');
  const [docsList, setDocsList] = useState(() => JSON.parse(localStorage.getItem('sovereign_docs') || '[{"id":1,"title":"Welcome Document","content":"# Sovereign Docs\\n\\n100% offline document editing."}]'));
  const [currentDocId, setCurrentDocId] = useState(1);
  const [docTitle, setDocTitle] = useState('Welcome Document');
  const [docContent, setDocContent] = useState('# Sovereign Docs\n\n100% offline document editing.');
  const [sheetsList, setSheetsList] = useState(() => JSON.parse(localStorage.getItem('sovereign_sheets') || '[{"id":1,"title":"Monthly Budget","grid":[["Item","Cost"],["Rent","1200"],["Total","1200"]]}]'));
  const [currentSheetId, setCurrentSheetId] = useState(1);
  const [sheetTitle, setSheetTitle] = useState('Monthly Budget');
  const [sheetGrid, setSheetGrid] = useState([['Item', 'Cost'], ['Rent', '1200'], ['Total', '1200']]);

  // --- TAB 8: VIDEO PLAYER STATE ---
  const videoRef = useRef(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // --- TAB 10: PASSWORD MANAGER STATE ---
  const [genLength, setGenLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNums, setUseNums] = useState(true);
  const [useSyms, setUseSyms] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [vaultItems, setVaultItems] = useState(() => JSON.parse(localStorage.getItem('sovereign_vault') || '[]'));
  const [serviceName, setServiceName] = useState('');
  const [vaultUser, setVaultUser] = useState('');
  const [vaultPass, setVaultPass] = useState('');

  // --- TAB 16: DEBLOATER STATE ---
  const [selectedPkgs, setSelectedPkgs] = useState([]);
  const [debloatMode, setDebloatMode] = useState('uninstall');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [customPkg, setCustomPkg] = useState('');

  // --- LOCK SCREEN AUTH ---
  const handleAuth = () => {
    if (pinSetup) {
      if (pinInput.length < 4) return alert('PIN must be at least 4 digits');
      localStorage.setItem('sovereign_pin', pinInput);
      setMasterPin(pinInput);
      setPinSetup(false);
      setIsLocked(false);
    } else {
      if (pinInput === masterPin) setIsLocked(false);
      else alert('Incorrect Master PIN');
    }
    setPinInput('');
  };

  // --- LOCAL AI HANDLER ---
  const handleAiQuery = async () => {
    if (!aiInput.trim()) return;
    const query = aiInput;
    setAiInput('');
    setAiLogs(prev => [...prev, { sender: 'user', text: query }]);
    setAiLoading(true);

    try {
      const response = await fetch(aiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'tinyllama', prompt: query, stream: false })
      });
      const data = await response.json();
      setAiLogs(prev => [...prev, { sender: 'ai', text: data.response || data.text || 'Query executed locally.' }]);
    } catch (err) {
      setTimeout(() => {
        setAiLogs(prev => [...prev, { sender: 'ai', text: `[Local Engine]: Processed "${query}" on hardware. Local REST AI server offline.` }]);
      }, 400);
    }
    setAiLoading(false);
  };

  // --- PERMISSIONS HANDLER ---
  const handleRequestPermissions = async () => {
    setPermLoading(true);
    const results = await checkAndRequestPermissions();
    setPermStatus(results);
    setPermLoading(false);
  };

  // --- PASSWORD GENERATOR ---
  const generatePassword = () => {
    let chars = '';
    if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (useNums) chars += '0123456789';
    if (useSyms) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) return;

    const array = new Uint32Array(genLength);
    window.crypto.getRandomValues(array);
    let result = '';
    for (let i = 0; i < genLength; i++) result += chars[array[i] % chars.length];
    setGeneratedPassword(result);
  };

  useEffect(() => { generatePassword(); }, [genLength, useUpper, useLower, useNums, useSyms]);

  const saveToVault = (e) => {
    e.preventDefault();
    if (!serviceName || !vaultPass) return alert('Service and password required');
    const updated = [...vaultItems, { id: Date.now(), service: serviceName, username: vaultUser, password: vaultPass }];
    setVaultItems(updated);
    localStorage.setItem('sovereign_vault', JSON.stringify(updated));
    setServiceName(''); setVaultUser(''); setVaultPass('');
  };

  // --- MENU ITEMS DEFINITION ---
  const allMenuItems = [
    { id: 1, name: '1. Home / Local AI Assistant', expertOnly: false },
    { id: 4, name: '4. Notes, Docs & Sovereign Sheets', expertOnly: false },
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
        <h1 style={{ fontSize: '18px', margin: 0, color: '#00ffcc' }}>Sovereignty Master Suite</h1>
      </header>

      {drawerOpen && (
        <div style={{ background: '#161616', borderBottom: '2px solid #00ffcc', padding: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {visibleMenuItems.map(item => (
              <button 
                key={item.id}
                onClick={() => { setActiveTab(item.id); setDrawerOpen(false); }}
                style={{ padding: '10px', textAlign: 'left', background: activeTab === item.id ? '#1b4d3e' : '#222', color: activeTab === item.id ? '#00ffcc' : '#ccc', border: '1px solid #333', borderRadius: '4px', fontWeight: activeTab === item.id ? 'bold' : 'normal' }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <main style={{ padding: '15px' }}>
        {/* --- TAB 1: LOCAL AI --- */}
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
            <input 
              style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '4px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', boxSizing: 'border-box' }}
              value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Ask local model..." onKeyDown={e => e.key === 'Enter' && handleAiQuery()}
            />
            <button style={{ width: '100%', padding: '12px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px' }} onClick={handleAiQuery} disabled={aiLoading}>
              {aiLoading ? 'Thinking On-Device...' : 'Process Query Locally'}
            </button>
          </div>
        )}

        {/* --- TAB 4: DOCS & SHEETS --- */}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button onClick={() => setDocSubTab('docs')} style={{ flex: 1, padding: '10px', background: docSubTab === 'docs' ? '#1b4d3e' : '#121212', color: docSubTab === 'docs' ? '#00ffcc' : '#aaa', border: '1px solid #333', borderRadius: '4px', fontWeight: 'bold' }}>📝 Docs (Word)</button>
              <button onClick={() => setDocSubTab('sheets')} style={{ flex: 1, padding: '10px', background: docSubTab === 'sheets' ? '#1b4d3e' : '#121212', color: docSubTab === 'sheets' ? '#00ffcc' : '#aaa', border: '1px solid #333', borderRadius: '4px', fontWeight: 'bold' }}>📊 Sheets (Excel)</button>
            </div>
            {docSubTab === 'docs' ? (
              <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                <input value={docTitle} onChange={e => setDocTitle(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#1e1e1e', color: '#00ffcc', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box' }} />
                <textarea value={docContent} onChange={e => setDocContent(e.target.value)} style={{ width: '100%', height: '200px', padding: '10px', background: '#181818', color: '#fff', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box', fontFamily: 'monospace' }} />
              </div>
            ) : (
              <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                <input value={sheetTitle} onChange={e => setSheetTitle(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#1e1e1e', color: '#00ffcc', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box' }} />
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {sheetGrid.map((row, r) => (
                        <tr key={r}>{row.map((cell, c) => (
                          <td key={c} style={{ border: '1px solid #333' }}><input value={cell} onChange={e => { const g = [...sheetGrid]; g[r][c] = e.target.value; setSheetGrid(g); }} style={{ width: '80px', padding: '6px', background: 'transparent', color: '#fff', border: 'none' }} /></td>
                        ))}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 8: VIDEO PLAYER --- */}
        {activeTab === 8 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>🎬 Sovereign Video Player</h2>
            <input type="file" accept="video/*" onChange={e => {
              const file = e.target.files[0];
              if (file) { setPlaylist([{ name: file.name, url: URL.createObjectURL(file) }]); setIsPlaying(true); }
            }} style={{ marginBottom: '15px', color: '#ccc' }} />
            {playlist[0] && <video ref={videoRef} src={playlist[0].url} autoPlay controls style={{ width: '100%', maxHeight: '250px' }} />}
          </div>
        )}

        {/* --- TAB 10: PASSWORD MANAGER --- */}
        {activeTab === 10 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>🔑 Password Generator & Vault</h2>
            <div style={{ background: '#181818', padding: '10px', borderRadius: '4px', color: '#00ffcc', fontSize: '14px', marginBottom: '10px' }}>{generatedPassword}</div>
            <button onClick={generatePassword} style={{ width: '100%', padding: '10px', background: '#333', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px' }}>Generate Password</button>
          </div>
        )}

        {/* --- TAB 16: SHIZUKU DEBLOATER --- */}
        {activeTab === 16 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>⚡ Shizuku Debloater Script Generator</h2>
            <div style={{ maxHeight: '180px', overflowY: 'auto', background: '#181818', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
              {BLOATWARE_DATABASE.map(item => (
                <label key={item.id} style={{ display: 'block', padding: '4px 0', cursor: 'pointer', fontSize: '12px' }}>
                  <input type="checkbox" checked={selectedPkgs.includes(item.pkg)} onChange={() => {
                    if (selectedPkgs.includes(item.pkg)) setSelectedPkgs(selectedPkgs.filter(p => p !== item.pkg));
                    else setSelectedPkgs([...selectedPkgs, item.pkg]);
                  }} /> <span style={{ color: '#00ffcc' }}>{item.name}</span> ({item.pkg})
                </label>
              ))}
            </div>
            <pre style={{ background: '#000', color: '#00ff00', padding: '10px', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
              {selectedPkgs.map(p => `adb shell pm uninstall -k --user 0 ${p}`).join('\n') || '# Select targets above'}
            </pre>
          </div>
        )}

        {/* --- TAB 17: SETTINGS & PERMISSIONS --- */}
        {activeTab === 17 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>System Controls & Hardware Permissions</h2>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer' }}>
              <input type="checkbox" checked={expertMode} onChange={e => setExpertMode(e.target.checked)} style={{ width: '20px', height: '20px', marginRight: '10px' }} />
              <span>Enable Expert Mode (Shows Debloater Tab)</span>
            </label>
            <button onClick={handleRequestPermissions} style={{ width: '100%', padding: '10px', background: '#333', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px', marginBottom: '15px' }}>
              {permLoading ? 'Prompting OS...' : 'Grant / Refresh All Hardware Permissions'}
            </button>
            <button onClick={() => { localStorage.clear(); alert('Wiped!'); window.location.reload(); }} style={{ width: '100%', padding: '10px', background: '#ff4444', color: '#fff', border: 'none', borderRadius: '4px' }}>
              Reset Master PIN & Wipe Vault
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
