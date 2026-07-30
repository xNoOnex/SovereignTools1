import React, { useState } from 'react';
import { checkAndRequestPermissions } from './services/permissions';

// Pre-loaded Bloatware Database
const BLOATWARE_DATABASE = [
  { id: 'bixby_agent', pkg: 'com.samsung.android.bixby.agent', name: 'Samsung Bixby Voice Agent', category: 'Samsung' },
  { id: 'bixby_vision', pkg: 'com.samsung.android.visionintelligence', name: 'Bixby Vision Camera Telemetry', category: 'Samsung' },
  { id: 'galaxy_store', pkg: 'com.sec.android.app.samsungapps', name: 'Samsung Galaxy Store Ads', category: 'Samsung' },
  { id: 'game_home', pkg: 'com.samsung.android.game.gamehome', name: 'Samsung Game Launcher Tracker', category: 'Samsung' },
  { id: 'google_wellbeing', pkg: 'com.google.android.apps.wellbeing', name: 'Google Digital Wellbeing Surveillance', category: 'Google' },
  { id: 'google_feedback', pkg: 'com.google.android.feedback', name: 'Google Telemetry Feedback Agent', category: 'Google' },
  { id: 'fb_system', pkg: 'com.facebook.system', name: 'Meta System Background Installer', category: 'Meta/Facebook' },
  { id: 'fb_appmanager', pkg: 'com.facebook.appmanager', name: 'Meta App Manager Telemetry', category: 'Meta/Facebook' },
  { id: 'fb_services', pkg: 'com.facebook.services', name: 'Meta Services Daemon', category: 'Meta/Facebook' },
  { id: 'carrier_hub', pkg: 'com.carrierhub.service', name: 'Carrier Telemetry & Push Diagnostics', category: 'Carrier' },
];

function App() {
  const [masterPin, setMasterPin] = useState(localStorage.getItem('sovereign_pin') || '');
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinSetup, setPinSetup] = useState(!localStorage.getItem('sovereign_pin'));

  const [expertMode, setExpertMode] = useState(true);
  const [activeTab, setActiveTab] = useState(16);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Debloater State
  const [selectedPkgs, setSelectedPkgs] = useState([]);
  const [debloatMode, setDebloatMode] = useState('uninstall'); // 'uninstall' or 'disable'
  const [customPkgInput, setCustomPkgInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  // Permission State
  const [permStatus, setPermStatus] = useState({ camera: 'UNKNOWN', bluetooth: 'UNKNOWN', location: 'UNKNOWN' });

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

  // Toggle individual package
  const togglePackage = (pkgName) => {
    if (selectedPkgs.includes(pkgName)) {
      setSelectedPkgs(selectedPkgs.filter(p => p !== pkgName));
    } else {
      setSelectedPkgs([...selectedPkgs, pkgName]);
    }
  };

  // Select/Deselect Category
  const selectCategory = (catName) => {
    const catPackages = BLOATWARE_DATABASE.filter(b => b.category === catName).map(b => b.pkg);
    const allSelected = catPackages.every(p => selectedPkgs.includes(p));
    
    if (allSelected) {
      setSelectedPkgs(selectedPkgs.filter(p => !catPackages.includes(p)));
    } else {
      setSelectedPkgs([...new Set([...selectedPkgs, ...catPackages])]);
    }
  };

  // Add Custom Package
  const addCustomPackage = () => {
    if (!customPkgInput.trim()) return;
    const cleanPkg = customPkgInput.trim();
    if (!selectedPkgs.includes(cleanPkg)) {
      setSelectedPkgs([...selectedPkgs, cleanPkg]);
    }
    setCustomPkgInput('');
  };

  // Generate Script Commands
  const generateScript = () => {
    if (selectedPkgs.length === 0) return '# Select packages above to generate Shizuku/ADB commands';
    
    const prefix = debloatMode === 'uninstall' 
      ? 'adb shell pm uninstall -k --user 0' 
      : 'adb shell pm disable-user --user 0';
      
    return selectedPkgs.map(pkg => `${prefix} ${pkg}`).join('\n');
  };

  // Copy Script to Clipboard
  const copyScriptToClipboard = () => {
    const script = generateScript();
    navigator.clipboard.writeText(script);
    setCopyStatus('Copied to Clipboard! Paste into Shizuku or Termux.');
    setTimeout(() => setCopyStatus(''), 3000);
  };

  const allMenuItems = [
    { id: 1, name: '1. Home / Local AI Assistant', expertOnly: false },
    { id: 16, name: '16. Shizuku Debloater (Expert)', expertOnly: true },
    { id: 17, name: '17. Settings & Security', expertOnly: false },
  ];

  const visibleMenuItems = allMenuItems.filter(item => expertMode || !item.expertOnly);

  if (isLocked) {
    return (
      <div style={{ padding: '30px', background: '#0a0a0a', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <h2 style={{ color: '#00ffcc', marginBottom: '10px' }}>🛡️ Sovereign Vault Lock</h2>
        <p style={{ color: '#aaa', marginBottom: '20px' }}>{pinSetup ? 'Create a Master PIN:' : 'Enter Master PIN:'}</p>
        <input 
          type="password" 
          value={pinInput} 
          onChange={(e) => setPinInput(e.target.value)}
          placeholder="••••"
          maxLength={8}
          style={{ padding: '12px', fontSize: '18px', textAlign: 'center', width: '200px', borderRadius: '6px', border: '1px solid #333', background: '#1e1e1e', color: '#fff', marginBottom: '15px' }}
        />
        <button onClick={handleAuth} style={{ padding: '12px 24px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px' }}>
          {pinSetup ? 'Set PIN & Unlock' : 'Unlock App'}
        </button>
      </div>
    );
  }

  const filteredBloat = BLOATWARE_DATABASE.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.pkg.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ padding: '15px', background: '#121212', display: 'flex', alignItems: 'center', borderBottom: '1px solid #222' }}>
        <button onClick={() => setDrawerOpen(!drawerOpen)} style={{ background: 'none', border: 'none', color: '#00ffcc', fontSize: '22px', marginRight: '15px' }}>
          ☰
        </button>
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
        {/* Tab 16: Shizuku Debloater */}
        {activeTab === 16 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>⚡ Shizuku ADB Debloater</h2>
            <p style={{ color: '#aaa', fontSize: '12px' }}>
              Select bloatware targets below to build an automated removal script.
            </p>

            {/* Mode & Quick Category Selectors */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button 
                onClick={() => setDebloatMode('uninstall')}
                style={{ flex: 1, padding: '8px', background: debloatMode === 'uninstall' ? '#ff4444' : '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontWeight: 'bold' }}
              >
                Mode: Uninstall
              </button>
              <button 
                onClick={() => setDebloatMode('disable')}
                style={{ flex: 1, padding: '8px', background: debloatMode === 'disable' ? '#ffbb33' : '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontWeight: 'bold' }}
              >
                Mode: Disable
              </button>
            </div>

            {/* Search Bar */}
            <input 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder="Search bloatware (e.g. bixby, facebook, google)..."
              style={{ width: '100%', padding: '10px', marginBottom: '15px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box' }}
            />

            {/* Package Checklist */}
            <div style={{ maxHeight: '250px', overflowY: 'auto', background: '#181818', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '10px', marginBottom: '15px' }}>
              {filteredBloat.map(item => (
                <label key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #222', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedPkgs.includes(item.pkg)} 
                    onChange={() => togglePackage(item.pkg)}
                    style={{ width: '18px', height: '18px', marginRight: '10px' }}
                  />
                  <div>
                    <strong style={{ color: '#00ffcc', fontSize: '13px' }}>{item.name}</strong>
                    <br />
                    <span style={{ color: '#777', fontSize: '11px' }}>{item.pkg}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Custom Package Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
              <input 
                value={customPkgInput} 
                onChange={e => setCustomPkgInput(e.target.value)} 
                placeholder="Or enter any custom package (com.app.name)"
                style={{ flex: 1, padding: '10px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
              />
              <button onClick={addCustomPackage} style={{ padding: '10px', background: '#333', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px' }}>
                Add
              </button>
            </div>

            {/* Generated Script Area */}
            <h3 style={{ color: '#00ffcc', fontSize: '14px', marginBottom: '5px' }}>
              Generated ADB Script ({selectedPkgs.length} targets selected):
            </h3>
            <pre style={{ background: '#000', color: '#00ff00', padding: '12px', borderRadius: '4px', fontSize: '11px', maxHeight: '150px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
              {generateScript()}
            </pre>

            {copyStatus && <p style={{ color: '#00ffcc', fontSize: '12px', fontStyle: 'italic' }}>{copyStatus}</p>}

            <button 
              onClick={copyScriptToClipboard} 
              disabled={selectedPkgs.length === 0}
              style={{ width: '100%', padding: '12px', background: selectedPkgs.length > 0 ? '#00cc66' : '#444', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px', marginTop: '10px' }}
            >
              Copy Shizuku Script to Clipboard
            </button>
          </div>
        )}

        {/* Tab 17: Settings */}
        {activeTab === 17 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>Settings & Security Controls</h2>
            <button onClick={() => { localStorage.clear(); alert('Wiped!'); window.location.reload(); }} style={{ width: '100%', padding: '12px', background: '#ff4444', color: '#fff', border: 'none', borderRadius: '4px' }}>
              Reset Master PIN & Wipe Storage
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
