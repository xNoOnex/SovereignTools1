import React, { useState, useEffect } from 'react';

function App() {
  const [masterPin, setMasterPin] = useState(localStorage.getItem('sovereign_pin') || '');
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinSetup, setPinSetup] = useState(!localStorage.getItem('sovereign_pin'));

  const [expertMode, setExpertMode] = useState(true);
  const [activeTab, setActiveTab] = useState(10); // Password Manager Tab ID
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Password Generator State
  const [genLength, setGenLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNums, setUseNums] = useState(true);
  const [useSyms, setUseSyms] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Vault State
  const [vaultItems, setVaultItems] = useState(() => {
    const saved = localStorage.getItem('sovereign_vault');
    return saved ? JSON.parse(saved) : [];
  });
  const [serviceName, setServiceName] = useState('');
  const [vaultUser, setVaultUser] = useState('');
  const [vaultPass, setVaultPass] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

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

  // Cryptographically Secure Password Generator
  const generatePassword = () => {
    let chars = '';
    if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (useNums) chars += '0123456789';
    if (useSyms) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) return alert('Select at least one character set!');

    const array = new Uint32Array(genLength);
    window.crypto.getRandomValues(array);
    let result = '';
    for (let i = 0; i < genLength; i++) {
      result += chars[array[i] % chars.length];
    }
    setGeneratedPassword(result);
  };

  useEffect(() => {
    generatePassword();
  }, [genLength, useUpper, useLower, useNums, useSyms]);

  // Save Credential to Vault
  const saveToVault = (e) => {
    e.preventDefault();
    if (!serviceName || !vaultPass) return alert('Service name and password are required.');
    
    const newItem = {
      id: Date.now(),
      service: serviceName,
      username: vaultUser,
      password: vaultPass
    };

    const updated = [...vaultItems, newItem];
    setVaultItems(updated);
    localStorage.setItem('sovereign_vault', JSON.stringify(updated));

    setServiceName('');
    setVaultUser('');
    setVaultPass('');
    setStatusMsg('Credential securely saved to local vault.');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const deleteVaultItem = (id) => {
    const updated = vaultItems.filter(item => item.id !== id);
    setVaultItems(updated);
    localStorage.setItem('sovereign_vault', JSON.stringify(updated));
  };

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setStatusMsg(`${label} copied to clipboard!`);
    setTimeout(() => setStatusMsg(''), 2500);
  };

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
          <button onClick={() => { setActiveTab(10); setDrawerOpen(false); }} style={{ width: '100%', padding: '10px', background: '#1b4d3e', color: '#00ffcc', marginBottom: '5px', textAlign: 'left', border: '1px solid #333' }}>10. Password Manager & Vault</button>
          <button onClick={() => { setActiveTab(16); setDrawerOpen(false); }} style={{ width: '100%', padding: '10px', background: '#222', color: '#fff', textAlign: 'left', border: '1px solid #333' }}>16. Shizuku Debloater</button>
        </div>
      )}

      <main style={{ padding: '15px' }}>
        {activeTab === 10 && (
          <div>
            {/* Password Generator Card */}
            <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222', marginBottom: '15px' }}>
              <h2 style={{ color: '#00ffcc', marginTop: 0 }}>🔑 Secure Password Generator</h2>
              
              <div style={{ background: '#181818', padding: '10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', border: '1px solid #333' }}>
                <code style={{ color: '#00ffcc', fontSize: '14px', wordBreak: 'break-all' }}>{generatedPassword}</code>
                <button onClick={() => copyText(generatedPassword, 'Password')} style={{ padding: '6px 12px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px' }}>Copy</button>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', color: '#aaa' }}>Length: {genLength}</label>
                <input type="range" min="8" max="64" value={genLength} onChange={e => setGenLength(parseInt(e.target.value))} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                <label><input type="checkbox" checked={useUpper} onChange={e => setUseUpper(e.target.checked)} /> Uppercase</label>
                <label><input type="checkbox" checked={useLower} onChange={e => setUseLower(e.target.checked)} /> Lowercase</label>
                <label><input type="checkbox" checked={useNums} onChange={e => setUseNums(e.target.checked)} /> Numbers</label>
                <label><input type="checkbox" checked={useSyms} onChange={e => setUseSyms(e.target.checked)} /> Symbols</label>
              </div>

              <button onClick={generatePassword} style={{ width: '100%', marginTop: '12px', padding: '10px', background: '#333', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px', fontWeight: 'bold' }}>
                Generate New Password
              </button>
            </div>

            {/* Local Vault Manager Card */}
            <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
              <h2 style={{ color: '#00ffcc', marginTop: 0 }}>🛡️ Local Credential Vault</h2>

              <form onSubmit={saveToVault} style={{ marginBottom: '15px' }}>
                <input placeholder="Service Name (e.g. ProtonMail)" value={serviceName} onChange={e => setServiceName(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '8px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box' }} />
                <input placeholder="Username / Email" value={vaultUser} onChange={e => setVaultUser(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '8px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box' }} />
                <input placeholder="Password" value={vaultPass} onChange={e => setVaultPass(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '8px', background: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box' }} />
                <button type="submit" style={{ width: '100%', padding: '10px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px' }}>Save to Vault</button>
              </form>

              {statusMsg && <p style={{ color: '#00ffcc', fontSize: '12px', fontStyle: 'italic', marginBottom: '10px' }}>{statusMsg}</p>}

              <h3 style={{ fontSize: '14px', color: '#aaa', borderBottom: '1px solid #222', paddingBottom: '5px' }}>Stored Logins ({vaultItems.length})</h3>
              
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {vaultItems.length === 0 ? (
                  <p style={{ color: '#666', fontSize: '12px', fontStyle: 'italic' }}>Vault is currently empty.</p>
                ) : (
                  vaultItems.map(item => (
                    <div key={item.id} style={{ background: '#181818', padding: '10px', borderRadius: '6px', marginBottom: '8px', border: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#00ffcc', fontSize: '13px' }}>{item.service}</strong>
                        <div style={{ color: '#888', fontSize: '11px' }}>User: {item.username || 'N/A'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => copyText(item.password, item.service)} style={{ padding: '5px 10px', background: '#222', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px', fontSize: '11px' }}>Copy</button>
                        <button onClick={() => deleteVaultItem(item.id)} style={{ padding: '5px 10px', background: '#333', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '4px', fontSize: '11px' }}>Del</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
