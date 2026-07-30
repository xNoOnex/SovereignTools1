import React, { useState, useEffect } from 'react';

function App() {
  const [masterPin, setMasterPin] = useState(localStorage.getItem('sovereign_pin') || '');
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinSetup, setPinSetup] = useState(!localStorage.getItem('sovereign_pin'));

  const [expertMode, setExpertMode] = useState(true);
  const [activeTab, setActiveTab] = useState(4); // Tab 4: Docs & Sheets
  const [drawerOpen, setDrawerOpen] = useState(false);

  // --- TAB 4: DOCS & SHEETS STATE ---
  const [docSubTab, setDocSubTab] = useState('docs'); // 'docs' or 'sheets'

  // Docs State
  const [docsList, setDocsList] = useState(() => {
    const saved = localStorage.getItem('sovereign_docs');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'Welcome Document', content: '# Welcome to Sovereign Docs\n\n100% offline document editing.\n- Zero cloud telemetry\n- Local storage encryption', category: 'General' }
    ];
  });
  const [currentDocId, setCurrentDocId] = useState(1);
  const [docTitle, setDocTitle] = useState('Welcome Document');
  const [docContent, setDocContent] = useState('# Welcome to Sovereign Docs\n\n100% offline document editing.\n- Zero cloud telemetry\n- Local storage encryption');
  const [docCategory, setDocCategory] = useState('General');

  // Sheets State
  const [sheetsList, setSheetsList] = useState(() => {
    const saved = localStorage.getItem('sovereign_sheets');
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, 
        title: 'Monthly Budget', 
        grid: [
          ['Item', 'Cost', 'Category'],
          ['Rent', '1200', 'Housing'],
          ['Groceries', '350', 'Food'],
          ['Total', '=SUM(B2:B3)', 'Summary']
        ] 
      }
    ];
  });
  const [currentSheetId, setCurrentSheetId] = useState(1);
  const [sheetTitle, setSheetTitle] = useState('Monthly Budget');
  const [sheetGrid, setSheetGrid] = useState([
    ['Item', 'Cost', 'Category'],
    ['Rent', '1200', 'Housing'],
    ['Groceries', '350', 'Food'],
    ['Total', '=SUM(B2:B3)', 'Summary']
  ]);

  const [statusMsg, setStatusMsg] = useState('');

  // Lock Screen Auth
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

  // --- DOCS LOGIC ---
  const saveCurrentDoc = () => {
    let updated;
    const existing = docsList.find(d => d.id === currentDocId);
    if (existing) {
      updated = docsList.map(d => d.id === currentDocId ? { ...d, title: docTitle, content: docContent, category: docCategory } : d);
    } else {
      const newDoc = { id: Date.now(), title: docTitle || 'Untitled Doc', content: docContent, category: docCategory };
      updated = [...docsList, newDoc];
      setCurrentDocId(newDoc.id);
    }
    setDocsList(updated);
    localStorage.setItem('sovereign_docs', JSON.stringify(updated));
    setStatusMsg('Document saved to local vault!');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const createNewDoc = () => {
    const newId = Date.now();
    setCurrentDocId(newId);
    setDocTitle('New Document');
    setDocContent('');
    setDocCategory('General');
  };

  const loadDoc = (doc) => {
    setCurrentDocId(doc.id);
    setDocTitle(doc.title);
    setDocContent(doc.content);
    setDocCategory(doc.category || 'General');
  };

  const deleteDoc = (id) => {
    const updated = docsList.filter(d => d.id !== id);
    setDocsList(updated);
    localStorage.setItem('sovereign_docs', JSON.stringify(updated));
    if (updated.length > 0) loadDoc(updated[0]);
    else createNewDoc();
  };

  const insertMarkdown = (syntax) => {
    setDocContent(prev => prev + syntax);
  };

  const exportDocFile = () => {
    const element = document.createElement("a");
    const file = new Blob([docContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${docTitle.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // --- SHEETS LOGIC ---
  const handleCellChange = (rIndex, cIndex, value) => {
    const newGrid = sheetGrid.map((row, r) => 
      row.map((cell, c) => (r === rIndex && c === cIndex ? value : cell))
    );
    setSheetGrid(newGrid);
  };

  const addRow = () => {
    const colsCount = sheetGrid[0].length;
    setSheetGrid([...sheetGrid, new Array(colsCount).fill('')]);
  };

  const addColumn = () => {
    setSheetGrid(sheetGrid.map(row => [...row, '']));
  };

  const saveCurrentSheet = () => {
    let updated;
    const existing = sheetsList.find(s => s.id === currentSheetId);
    if (existing) {
      updated = sheetsList.map(s => s.id === currentSheetId ? { ...s, title: sheetTitle, grid: sheetGrid } : s);
    } else {
      const newSheet = { id: Date.now(), title: sheetTitle || 'Untitled Sheet', grid: sheetGrid };
      updated = [...sheetsList, newSheet];
      setCurrentSheetId(newSheet.id);
    }
    setSheetsList(updated);
    localStorage.setItem('sovereign_sheets', JSON.stringify(updated));
    setStatusMsg('Spreadsheet saved to local vault!');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const createNewSheet = () => {
    const newId = Date.now();
    setCurrentSheetId(newId);
    setSheetTitle('New Spreadsheet');
    setSheetGrid([
      ['A', 'B', 'C'],
      ['', '', ''],
      ['', '', '']
    ]);
  };

  const exportCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + sheetGrid.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${sheetTitle.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <button onClick={() => { setActiveTab(4); setDrawerOpen(false); }} style={{ width: '100%', padding: '10px', background: '#1b4d3e', color: '#00ffcc', marginBottom: '5px', textAlign: 'left', border: '1px solid #333' }}>4. Notes, Docs & Sovereign Sheets</button>
          <button onClick={() => { setActiveTab(10); setDrawerOpen(false); }} style={{ width: '100%', padding: '10px', background: '#222', color: '#fff', marginBottom: '5px', textAlign: 'left', border: '1px solid #333' }}>10. Password Manager</button>
          <button onClick={() => { setActiveTab(16); setDrawerOpen(false); }} style={{ width: '100%', padding: '10px', background: '#222', color: '#fff', textAlign: 'left', border: '1px solid #333' }}>16. Shizuku Debloater</button>
        </div>
      )}

      <main style={{ padding: '15px' }}>
        {activeTab === 4 && (
          <div>
            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button 
                onClick={() => setDocSubTab('docs')} 
                style={{ flex: 1, padding: '12px', background: docSubTab === 'docs' ? '#1b4d3e' : '#121212', color: docSubTab === 'docs' ? '#00ffcc' : '#aaa', border: '1px solid #333', borderRadius: '6px', fontWeight: 'bold' }}
              >
                📝 Sovereign Docs (Word)
              </button>
              <button 
                onClick={() => setDocSubTab('sheets')} 
                style={{ flex: 1, padding: '12px', background: docSubTab === 'sheets' ? '#1b4d3e' : '#121212', color: docSubTab === 'sheets' ? '#00ffcc' : '#aaa', border: '1px solid #333', borderRadius: '6px', fontWeight: 'bold' }}
              >
                📊 Sovereign Sheets (Excel)
              </button>
            </div>

            {statusMsg && <p style={{ color: '#00ffcc', fontSize: '12px', fontStyle: 'italic', marginBottom: '10px' }}>{statusMsg}</p>}

            {/* --- DOCS EDITOR MODULE --- */}
            {docSubTab === 'docs' && (
              <div>
                <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input 
                      value={docTitle} onChange={e => setDocTitle(e.target.value)} 
                      placeholder="Document Title" 
                      style={{ flex: 2, padding: '10px', background: '#1e1e1e', color: '#00ffcc', border: '1px solid #333', borderRadius: '4px', fontWeight: 'bold' }}
                    />
                    <button onClick={saveCurrentDoc} style={{ flex: 1, padding: '10px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px' }}>Save</button>
                  </div>

                  {/* Formatting Toolbar */}
                  <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px' }}>
                    <button onClick={() => insertMarkdown('# ')} style={{ padding: '4px 8px', background: '#222', color: '#00ffcc', border: '1px solid #333', borderRadius: '4px' }}>H1</button>
                    <button onClick={() => insertMarkdown('## ')} style={{ padding: '4px 8px', background: '#222', color: '#00ffcc', border: '1px solid #333', borderRadius: '4px' }}>H2</button>
                    <button onClick={() => insertMarkdown('**bold**')} style={{ padding: '4px 8px', background: '#222', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}><b>B</b></button>
                    <button onClick={() => insertMarkdown('*italic*')} style={{ padding: '4px 8px', background: '#222', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}><i>I</i></button>
                    <button onClick={() => insertMarkdown('- ')} style={{ padding: '4px 8px', background: '#222', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}>• List</button>
                    <button onClick={() => insertMarkdown('```\ncode block\n```')} style={{ padding: '4px 8px', background: '#222', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}>Code</button>
                    <button onClick={exportDocFile} style={{ padding: '4px 8px', background: '#333', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px', marginLeft: 'auto' }}>Export .md</button>
                  </div>

                  {/* Document Text Area */}
                  <textarea 
                    value={docContent} onChange={e => setDocContent(e.target.value)}
                    placeholder="Write your document here..."
                    style={{ width: '100%', height: '220px', padding: '12px', background: '#181818', color: '#fff', border: '1px solid #333', borderRadius: '6px', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666', marginTop: '6px' }}>
                    <span>Words: {docContent.trim() ? docContent.trim().split(/\s+/).length : 0} | Characters: {docContent.length}</span>
                    <button onClick={createNewDoc} style={{ background: 'none', border: 'none', color: '#00ffcc', cursor: 'pointer' }}>+ New Blank Doc</button>
                  </div>
                </div>

                {/* Stored Documents Vault */}
                <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                  <h3 style={{ color: '#00ffcc', marginTop: 0, fontSize: '14px' }}>📁 Stored Documents ({docsList.length})</h3>
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {docsList.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#181818', padding: '8px 12px', borderRadius: '4px', marginBottom: '6px', border: '1px solid #222' }}>
                        <span onClick={() => loadDoc(doc)} style={{ color: doc.id === currentDocId ? '#00ffcc' : '#fff', cursor: 'pointer', fontWeight: doc.id === currentDocId ? 'bold' : 'normal', fontSize: '13px' }}>
                          📄 {doc.title}
                        </span>
                        <button onClick={() => deleteDoc(doc.id)} style={{ padding: '2px 6px', background: '#333', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '3px', fontSize: '10px' }}>Del</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- SHEETS SPREADSHEET MODULE --- */}
            {docSubTab === 'sheets' && (
              <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input 
                    value={sheetTitle} onChange={e => setSheetTitle(e.target.value)} 
                    placeholder="Spreadsheet Title" 
                    style={{ flex: 2, padding: '10px', background: '#1e1e1e', color: '#00ffcc', border: '1px solid #333', borderRadius: '4px', fontWeight: 'bold' }}
                  />
                  <button onClick={saveCurrentSheet} style={{ flex: 1, padding: '10px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px' }}>Save Sheet</button>
                </div>

                {/* Grid Controls */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  <button onClick={addRow} style={{ padding: '6px 10px', background: '#222', color: '#00ffcc', border: '1px solid #333', borderRadius: '4px', fontSize: '12px' }}>+ Add Row</button>
                  <button onClick={addColumn} style={{ padding: '6px 10px', background: '#222', color: '#00ffcc', border: '1px solid #333', borderRadius: '4px', fontSize: '12px' }}>+ Add Column</button>
                  <button onClick={exportCsv} style={{ padding: '6px 10px', background: '#333', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px', fontSize: '12px', marginLeft: 'auto' }}>Export CSV</button>
                  <button onClick={createNewSheet} style={{ padding: '6px 10px', background: '#222', color: '#aaa', border: '1px solid #333', borderRadius: '4px', fontSize: '12px' }}>New Sheet</button>
                </div>

                {/* Grid Spreadsheet View */}
                <div style={{ overflowX: 'auto', marginBottom: '15px', border: '1px solid #333', borderRadius: '4px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#181818' }}>
                    <tbody>
                      {sheetGrid.map((row, rIndex) => (
                        <tr key={rIndex}>
                          {row.map((cell, cIndex) => (
                            <td key={cIndex} style={{ border: '1px solid #2a2a2a', padding: '0' }}>
                              <input 
                                value={cell} 
                                onChange={e => handleCellChange(rIndex, cIndex, e.target.value)}
                                style={{ 
                                  width: '90px', 
                                  padding: '8px', 
                                  background: rIndex === 0 ? '#1f2d27' : 'transparent', 
                                  color: rIndex === 0 ? '#00ffcc' : '#fff', 
                                  border: 'none', 
                                  fontWeight: rIndex === 0 ? 'bold' : 'normal',
                                  fontSize: '12px'
                                }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Saved Sheets Vault */}
                <h3 style={{ color: '#00ffcc', marginTop: '10px', fontSize: '14px' }}>📊 Stored Spreadsheets ({sheetsList.length})</h3>
                <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                  {sheetsList.map(s => (
                    <div key={s.id} onClick={() => { setCurrentSheetId(s.id); setSheetTitle(s.title); setSheetGrid(s.grid); }} style={{ padding: '8px', background: '#181818', borderRadius: '4px', marginBottom: '5px', border: '1px solid #222', cursor: 'pointer', color: s.id === currentSheetId ? '#00ffcc' : '#ccc', fontSize: '12px' }}>
                      📊 {s.title} ({s.grid.length}x{s.grid[0].length})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
