import React, { useState } from 'react';

// Massively Expanded Bloatware Database with Risk Ratings
const BLOATWARE_DATABASE = [
  // Samsung Bloatware
  { id: 'bixby_agent', pkg: 'com.samsung.android.bixby.agent', name: 'Bixby Voice Assistant', category: 'Samsung', risk: 'safe' },
  { id: 'bixby_vision', pkg: 'com.samsung.android.visionintelligence', name: 'Bixby Vision AI Camera', category: 'Samsung', risk: 'safe' },
  { id: 'galaxy_store', pkg: 'com.sec.android.app.samsungapps', name: 'Galaxy Store Ad Engine', category: 'Samsung', risk: 'safe' },
  { id: 'game_home', pkg: 'com.samsung.android.game.gamehome', name: 'Game Launcher & Tracking', category: 'Samsung', risk: 'safe' },
  { id: 'samsung_pass', pkg: 'com.samsung.android.samsungpass', name: 'Samsung Pass / Autofill', category: 'Samsung', risk: 'caution' },
  { id: 'ar_zone', pkg: 'com.samsung.android.arzone', name: 'AR Zone Emoji Spyware', category: 'Samsung', risk: 'safe' },
  { id: 'samsung_pay', pkg: 'com.samsung.android.spay', name: 'Samsung Wallet / Pay', category: 'Samsung', risk: 'safe' },

  // Meta / Facebook System Spyware
  { id: 'fb_system', pkg: 'com.facebook.system', name: 'Meta System Installer', category: 'Meta', risk: 'safe' },
  { id: 'fb_appmanager', pkg: 'com.facebook.appmanager', name: 'Meta App Manager Telemetry', category: 'Meta', risk: 'safe' },
  { id: 'fb_services', pkg: 'com.facebook.services', name: 'Meta Background Daemon', category: 'Meta', risk: 'safe' },
  { id: 'fb_katana', pkg: 'com.facebook.katana', name: 'Facebook Main App Preload', category: 'Meta', risk: 'safe' },

  // Google Telemetry & Preloads
  { id: 'google_wellbeing', pkg: 'com.google.android.apps.wellbeing', name: 'Digital Wellbeing Surveillance', category: 'Google', risk: 'caution' },
  { id: 'google_feedback', pkg: 'com.google.android.feedback', name: 'Google Feedback Collector', category: 'Google', risk: 'safe' },
  { id: 'google_partner', pkg: 'com.google.android.partneretups', name: 'Google Partner Setup', category: 'Google', risk: 'safe' },
  { id: 'android_auto', pkg: 'com.google.android.projection.gearhead', name: 'Android Auto Service', category: 'Google', risk: 'caution' },
  { id: 'google_assistant', pkg: 'com.google.android.googlequicksearchbox', name: 'Google Search / Assistant', category: 'Google', risk: 'caution' },

  // Microsoft & Amazon Preloads
  { id: 'ms_link_windows', pkg: 'com.microsoft.appmanager', name: 'Link to Windows (Your Phone)', category: 'Microsoft', risk: 'safe' },
  { id: 'ms_onedrive', pkg: 'com.microsoft.skydrive', name: 'Microsoft OneDrive Preload', category: 'Microsoft', risk: 'safe' },
  { id: 'amazon_shop', pkg: 'com.amazon.mShop.android.shopping', name: 'Amazon Shopping App', category: 'Amazon', risk: 'safe' },

  // Carrier Telemetry
  { id: 'carrier_hub', pkg: 'com.carrierhub.service', name: 'Carrier Hub Diagnostics', category: 'Carrier', risk: 'safe' },
  { id: 'carrier_tracking', pkg: 'com.tmobile.pr.mytmobile', name: 'Carrier Diagnostics & Push', category: 'Carrier', risk: 'safe' },
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
  const [debloatMode, setDebloatMode] = useState('uninstall'); // 'uninstall', 'disable', 'restore'
  const [catFilter, setCatFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [customPkg, setCustomPkg] = useState('');
  const [copyMsg, setCopyMsg] = useState('');

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

  const togglePkg = (pkg) => {
    if (selectedPkgs.includes(pkg)) {
      setSelectedPkgs(selectedPkgs.filter(p => p !== pkg));
    } else {
      setSelectedPkgs([...selectedPkgs, pkg]);
    }
  };

  const selectCategoryGroup = (categoryName) => {
    const group = BLOATWARE_DATABASE.filter(b => b.category === categoryName).map(b => b.pkg);
    const allIn = group.every(p => selectedPkgs.includes(p));
    if (allIn) {
      setSelectedPkgs(selectedPkgs.filter(p => !group.includes(p)));
    } else {
      setSelectedPkgs([...new Set([...selectedPkgs, ...group])]);
    }
  };

  const addCustomPkg = () => {
    if (!customPkg.trim()) return;
    const clean = customPkg.trim();
    if (!selectedPkgs.includes(clean)) setSelectedPkgs([...selectedPkgs, clean]);
    setCustomPkg('');
  };

  const buildScript = (mode) => {
    if (selectedPkgs.length === 0) return '# Select bloatware items to generate script';
    return selectedPkgs.map(pkg => {
      if (mode === 'uninstall') return `adb shell pm uninstall -k --user 0 ${pkg}`;
      if (mode === 'disable') return `adb shell pm disable-user --user 0 ${pkg}`;
      if (mode === 'restore') return `adb shell pm install-existing ${pkg}`;
      return '';
    }).join('\n');
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopyMsg(`${label} script copied to clipboard!`);
    setTimeout(() => setCopyMsg(''), 3000);
  };

  const visibleItems = BLOATWARE_DATABASE.filter(item => {
    const matchesCat = catFilter === 'All' || item.category === catFilter;
    const matchesRisk = riskFilter === 'All' || item.risk === riskFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.pkg.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesRisk && matchesSearch;
  });

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
          <button onClick={() => { setActiveTab(1); setDrawerOpen(false); }} style={{ width: '100%', padding: '10px', background: '#222', color: '#fff', marginBottom: '5px', textAlign: 'left', border: '1px solid #333' }}>1. Home / AI Assistant</button>
          <button onClick={() => { setActiveTab(16); setDrawerOpen(false); }} style={{ width: '100%', padding: '10px', background: '#1b4d3e', color: '#00ffcc', textAlign: 'left', border: '1px solid #333' }}>16. Shizuku Debloater (Expert)</button>
        </div>
      )}

      <main style={{ padding: '15px' }}>
        {activeTab === 16 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>⚡ Advanced ADB & Shizuku Debloater</h2>
            <p style={{ color: '#888', fontSize: '12px' }}>Categorized bloatware removal engine with instant recovery script generation.</p>

            {/* Quick Category Nuke Bar */}
            <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', marginBottom: '15px', paddingBottom: '5px' }}>
              {['Samsung', 'Meta', 'Google', 'Amazon', 'Microsoft', 'Carrier'].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => selectCategoryGroup(cat)}
                  style={{ padding: '6px 12px', background: '#222', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '20px', fontSize: '11px', whiteSpace: 'nowrap' }}
                >
                  Toggle {cat}
                </button>
              ))}
            </div>

            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input 
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Search package name..."
                style={{ flex: 2, padding: '8px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
              />
              <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={{ flex: 1, padding: '8px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}>
                <option value="All">All Risks</option>
                <option value="safe">🟢 Safe Only</option>
                <option value="caution">🟡 Caution Only</option>
              </select>
            </div>

            {/* Package Selection List */}
            <div style={{ maxHeight: '220px', overflowY: 'auto', background: '#181818', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '10px', marginBottom: '15px' }}>
              {visibleItems.map(item => (
                <label key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #222', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedPkgs.includes(item.pkg)} 
                    onChange={() => togglePkg(item.pkg)}
                    style={{ width: '18px', height: '18px', marginRight: '10px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ color: item.risk === 'safe' ? '#00ffcc' : '#ffbb33', fontWeight: 'bold', fontSize: '13px' }}>
                      {item.risk === 'safe' ? '🟢' : '🟡'} {item.name}
                    </span>
                    <br />
                    <span style={{ color: '#666', fontSize: '11px' }}>{item.pkg}</span>
                  </div>
                  <span style={{ fontSize: '10px', background: '#222', color: '#888', padding: '2px 6px', borderRadius: '4px' }}>{item.category}</span>
                </label>
              ))}
            </div>

            {/* Add Custom Package */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
              <input 
                value={customPkg} onChange={e => setCustomPkg(e.target.value)} 
                placeholder="Custom package ID (com.example.app)"
                style={{ flex: 1, padding: '8px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
              />
              <button onClick={addCustomPkg} style={{ padding: '8px 12px', background: '#333', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px' }}>Add Target</button>
            </div>

            {/* Action Output Tabs */}
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <button onClick={() => setDebloatMode('uninstall')} style={{ flex: 1, padding: '8px', background: debloatMode === 'uninstall' ? '#ff4444' : '#222', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px' }}>Uninstall</button>
              <button onClick={() => setDebloatMode('disable')} style={{ flex: 1, padding: '8px', background: debloatMode === 'disable' ? '#ffbb33' : '#222', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px' }}>Freeze</button>
              <button onClick={() => setDebloatMode('restore')} style={{ flex: 1, padding: '8px', background: debloatMode === 'restore' ? '#00cc66' : '#222', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px' }}>Recovery Script</button>
            </div>

            <pre style={{ background: '#000', color: debloatMode === 'restore' ? '#00ffcc' : '#00ff00', padding: '12px', borderRadius: '4px', fontSize: '11px', maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
              {buildScript(debloatMode)}
            </pre>

            {copyMsg && <p style={{ color: '#00ffcc', fontSize: '12px', fontStyle: 'italic' }}>{copyMsg}</p>}

            <button 
              onClick={() => copyToClipboard(buildScript(debloatMode), debloatMode.toUpperCase())}
              disabled={selectedPkgs.length === 0}
              style={{ width: '100%', padding: '12px', background: selectedPkgs.length > 0 ? '#00cc66' : '#444', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px', marginTop: '5px' }}
            >
              Copy {debloatMode.toUpperCase()} Script to Clipboard ({selectedPkgs.length} selected)
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
