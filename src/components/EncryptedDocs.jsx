import React, { useState, useEffect } from 'react';

export function EncryptedDocs({ onNavigate }) {
  const [activeSubTab, setActiveSubTab] = useState('Editor'); // 'Editor' | 'My Files'
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [format, setFormat] = useState('NOTE (.TXT)');
  const [template, setTemplate] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // Local storage vault for saved docs
  const [savedDocs, setSavedDocs] = useState(() => {
    try {
      const stored = localStorage.getItem('sovereign_encrypted_docs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sovereign_encrypted_docs', JSON.stringify(savedDocs));
    } catch (e) {}
  }, [savedDocs]);

  // Load preset note templates
  const handleTemplateChange = (e) => {
    const selected = e.target.value;
    setTemplate(selected);
    
    if (selected === 'checklist') {
      setContent("[ ] Task 1\n[ ] Task 2\n[ ] Task 3\n");
    } else if (selected === 'memo') {
      setContent("MEMORANDUM\nTO: Enclave\nFROM: Self\nDATE: " + new Date().toLocaleDateString() + "\n\nSUBJECT: \n\n");
    } else if (selected === 'journal') {
      setContent("--- LOG " + new Date().toISOString().split('T')[0] + " ---\n\nNotes:\n");
    }
  };

  const saveToAppVault = () => {
    if (!title.trim() && !content.trim()) {
      setStatusMsg('❌ Title or content cannot be empty.');
      setTimeout(() => setStatusMsg(''), 3000);
      return;
    }

    const newDoc = {
      id: Date.now(),
      title: title.trim() || 'Untitled Document',
      content,
      format,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSavedDocs([newDoc, ...savedDocs]);
    setTitle('');
    setContent('');
    setStatusMsg('💾 Saved document to App Vault!');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const exportToDevice = () => {
    if (!content.trim()) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (title.trim() || 'sovereign_note') + (format.includes('.MD') ? '.md' : '.txt');
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('📤 Exported file to device downloads!');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const deleteDoc = (id) => {
    setSavedDocs(savedDocs.filter(d => d.id !== id));
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* HEADER */}
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          📝 Encrypted Docs
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Offline local text & Markdown note vault
        </p>
      </div>

      {/* TOAST NOTIFICATION */}
      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg animate-fadeIn">
          {statusMsg}
        </div>
      )}

      {/* TOP TOGGLE SUBTABS */}
      <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900">
        <button
          onClick={() => setActiveSubTab('Editor')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'Editor' 
              ? 'bg-cyan-500 text-black shadow-md scale-105' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          ✍️ Document Editor
        </button>
        <button
          onClick={() => setActiveSubTab('My Files')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'My Files' 
              ? 'bg-cyan-500 text-black shadow-md scale-105' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          📁 My Files ({savedDocs.length})
        </button>
      </div>

      {/* SUBTAB 1: DOCUMENT EDITOR */}
      {activeSubTab === 'Editor' && (
        <div className="space-y-3">
          
          {/* TOOLBAR CONTROLS */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={template}
              onChange={handleTemplateChange}
              className="bg-black border border-zinc-800 text-xs text-cyan-400 font-mono rounded-xl p-2.5 focus:outline-none"
            >
              <option value="">+ Load Template...</option>
              <option value="checklist">Checklist Template</option>
              <option value="memo">Secure Memo</option>
              <option value="journal">Daily Journal Log</option>
            </select>

            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="bg-black border border-zinc-800 text-xs text-cyan-400 font-mono rounded-xl p-2.5 focus:outline-none"
            >
              <option value="NOTE (.TXT)">NOTE (.TXT)</option>
              <option value="MARKDOWN (.MD)">MARKDOWN (.MD)</option>
              <option value="ENCRYPTED (.ENC)">ENCRYPTED (.ENC)</option>
            </select>
          </div>

          {/* TITLE INPUT */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document Title..."
            className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          />

          {/* EDITOR BODY */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing or load a template..."
            className="w-full bg-black border border-zinc-800 rounded-3xl p-4 text-xs text-white font-mono h-64 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
          />

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={saveToAppVault}
              className="py-3 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 text-xs font-bold rounded-2xl shadow active:scale-95 transition-transform"
            >
              💾 Save to App Vault
            </button>
            <button
              onClick={exportToDevice}
              className="py-3 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-2xl shadow active:scale-95 transition-transform"
            >
              📤 Export to Device
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 2: MY FILES */}
      {activeSubTab === 'My Files' && (
        <div className="bg-zinc-900/80 p-4 rounded-3xl border border-zinc-800 space-y-3 min-h-[360px]">
          {savedDocs.length === 0 ? (
            <div className="text-center py-24 text-xs text-zinc-500 font-mono space-y-2">
              <p className="text-2xl">📁</p>
              <p>No documents saved in App Vault.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {savedDocs.map((doc) => (
                <div key={doc.id} className="bg-black/80 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-white">{doc.title}</h4>
                      <p className="text-[9px] text-cyan-400 font-mono mt-0.5">{doc.date} at {doc.time} • {doc.format}</p>
                    </div>
                    <button
                      onClick={() => deleteDoc(doc.id)}
                      className="text-red-400 text-xs font-bold px-2 py-1 hover:bg-red-950/50 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>

                  <p className="text-[10px] text-zinc-400 font-mono bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 line-clamp-3 whitespace-pre-wrap">
                    {doc.content}
                  </p>

                  <button
                    onClick={() => {
                      setTitle(doc.title);
                      setContent(doc.content);
                      setFormat(doc.format);
                      setActiveSubTab('Editor');
                    }}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-[10px] font-bold py-1.5 rounded-xl border border-zinc-700"
                  >
                    Open in Editor
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
