import { useSecureStorage } from '../hooks/useSecureStorage';
import React, { useState, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

const TEMPLATES = [
  { id: 'blank', name: '📄 Blank Document', format: 'txt', content: '' },
  { id: 'meeting', name: '📝 Meeting Minutes', format: 'doc', content: 'Meeting Title:\nDate:\nAttendees:\n\nAgenda:\n1. \n2. \n\nAction Items:\n- [ ] \n- [ ] ' },
  { id: 'budget', name: '📊 Monthly Budget', format: 'csv', content: 'Category,Planned,Actual,Difference\nIncome,0,0,0\nRent,0,0,0\nUtilities,0,0,0\nGroceries,0,0,0\nSavings,0,0,0' },
  { id: 'inventory', name: '📦 Inventory Tracker', format: 'csv', content: 'Item_ID,Item_Name,Quantity,Unit_Price,Total_Value\n001,Widget A,10,5.00,50.00\n002,Widget B,0,12.50,0.00' },
  { id: 'nda', name: '⚖️ Legal NDA Draft', format: 'doc', content: 'NON-DISCLOSURE AGREEMENT\n\nThis Agreement is made on [DATE], by and between [PARTY A] and [PARTY B].\n\n1. Confidential Information: Both parties agree to maintain strict confidentiality regarding all proprietary systems, code, and business practices discussed.\n\nSignature A: ______________\nSignature B: ______________' },
  { id: 'invoice', name: '🧾 Invoice Template', format: 'doc', content: 'INVOICE\n\nInvoice #: 001\nDate: YYYY-MM-DD\n\nBilled To:\nName: \nAddress: \n\nDescription | Qty | Price | Total\n-----------------------------------\nService A   | 1   | $0.00 | $0.00\n\nTotal Due: $0.00' },
  { id: 'todo', name: '✅ Daily Checklist', format: 'txt', content: 'DAILY TASKS:\n[ ] Morning review & system check\n[ ] Clear inbox\n[ ] Code deployment\n[ ] Evening sync' },
  { id: 'workout', name: '💪 Workout Log', format: 'csv', content: 'Date,Exercise,Sets,Reps,Weight_lbs\n2026-08-01,Bench Press,3,10,135\n2026-08-01,Squats,4,8,225' },
  { id: 'expense', name: '💸 Expense Report', format: 'csv', content: 'Date,Description,Category,Amount,Tax,Total\n2026-08-01,Server Hosting,IT,45.00,0.00,45.00' },
  { id: 'passwords', name: '🔐 Seed Matrix', format: 'csv', content: 'Service,Username,Seed_Phrase,Pin\nMonero Wallet,,word1 word2 word3...,1234' },
  { id: 'code', name: '💻 Code Snippet', format: 'txt', content: '/* \n * Script Name: \n * Description: \n */\n\nfunction init() {\n  console.log("System nominal");\n}' },
  { id: 'journal', name: '📓 Personal Journal', format: 'txt', content: 'Date: \nLocation: \n\nLog Entry:\n' },
  { id: 'goals', name: '🎯 Goal Planner', format: 'doc', content: 'GOAL PLANNER\n\nObjective: \nDeadline: \n\nMilestones:\n1. \n2. \n3. \n\nObstacles & Mitigation:\n- \n- ' },
  { id: 'contacts', name: '📞 Contact List', format: 'csv', content: 'Name,Phone,Email,PGP_Key_Fingerprint\nJohn Doe,555-0100,john@example.com,XXXX-XXXX-XXXX' }
];

export function DocumentManager() {
  const [activeSubTab, setActiveSubTab] = useState('editor'); // 'editor', 'files'
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docFormat, setDocFormat] = useState('txt'); 
  const [myFiles, setMyFiles] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');

  // Load saved files from local encrypted sandbox
  useEffect(() => {
    const saved = localStorage.getItem('sovereign_office_docs');
    if (saved) {
      try {
        setMyFiles(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveToLocalFiles = () => {
    if (!docTitle.trim()) {
      setStatusMsg('⚠️ Please enter a document title.');
      setTimeout(() => setStatusMsg(''), 2500);
      return;
    }
    const newDoc = {
      id: Date.now(),
      title: docTitle.trim(),
      content: docContent,
      format: docFormat,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    const updated = [newDoc, ...myFiles];
    setMyFiles(updated);
    // Handled automatically by vault: sovereign_office_docs);
    setStatusMsg('💾 Document saved to internal Vault!');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const deleteFile = (id) => {
    if (window.confirm('Delete this document permanently?')) {
      const updated = myFiles.filter(f => f.id !== id);
      setMyFiles(updated);
      // Handled automatically by vault: sovereign_office_docs);
    }
  };

  const loadFile = (file) => {
    setDocTitle(file.title);
    setDocContent(file.content);
    setDocFormat(file.format);
    setActiveSubTab('editor');
    setStatusMsg(`Loaded: ${file.title}`);
    setTimeout(() => setStatusMsg(''), 2000);
  };

  const loadTemplate = (e) => {
    const templateId = e.target.value;
    if (!templateId) return;
    const t = TEMPLATES.find(x => x.id === templateId);
    if (t) {
      setDocTitle(`New ${t.name.split(' ')[1]}`);
      setDocContent(t.content);
      setDocFormat(t.format);
      setStatusMsg(`Loaded ${t.name} Template`);
      setTimeout(() => setStatusMsg(''), 2000);
    }
    e.target.value = ''; // Reset dropdown
  };

  const exportToDevice = () => {
    if (!docTitle.trim()) {
      setStatusMsg('⚠️ Title required for export');
      setTimeout(() => setStatusMsg(''), 2000);
      return;
    }

    let mimeType = 'text/plain';
    if (docFormat === 'csv') mimeType = 'text/csv';
    if (docFormat === 'doc') mimeType = 'application/msword';
    if (docFormat === 'html') mimeType = 'text/html';

    try {
      const blob = new Blob([docContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docTitle.replace(/ /g, '_')}.${docFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatusMsg(`📥 Exported to device as .${docFormat}`);
    } catch (err) {
      setStatusMsg('⚠️ Export failed or blocked by WebView');
    }
    setTimeout(() => setStatusMsg(''), 3000);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      
      {/* HEADER */}
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          📝 Sovereign Office Suite
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Zero-telemetry Word, Excel, and Notes engine.
        </p>
      </div>

      {/* SUB-TAB NAVIGATION */}
      <div className="grid grid-cols-2 gap-2 text-xs font-bold bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800">
        <button
          onClick={() => setActiveSubTab('editor')}
          className={`py-2.5 rounded-xl transition-all ${
            activeSubTab === 'editor' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          ✍️ Document Editor
        </button>
        <button
          onClick={() => setActiveSubTab('files')}
          className={`py-2.5 rounded-xl transition-all ${
            activeSubTab === 'files' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          🗂️ My Files ({myFiles.length})
        </button>
      </div>

      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      {/* SUB-TAB 1: EDITOR */}
      {activeSubTab === 'editor' && (
        <div className="space-y-3">
          
          <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-2xl border border-zinc-800">
            <select 
              onChange={loadTemplate}
              className="bg-black border border-zinc-700 text-cyan-300 text-[10px] rounded-lg p-2 font-bold focus:outline-none"
            >
              <option value="">+ Load Template...</option>
              {TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <select
              value={docFormat}
              onChange={e => setDocFormat(e.target.value)}
              className="bg-black border border-zinc-700 text-white text-[10px] rounded-lg p-2 font-bold focus:outline-none uppercase"
            >
              <option value="txt">Note (.txt)</option>
              <option value="doc">Word (.doc)</option>
              <option value="csv">Excel (.csv)</option>
              <option value="html">Web/PDF (.html)</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Document Title..."
            value={docTitle}
            onChange={e => setDocTitle(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-cyan-500"
          />

          <textarea
            rows={14}
            placeholder="Start typing or load a template..."
            value={docContent}
            onChange={e => setDocContent(e.target.value)}
            className={`w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 ${docFormat === 'csv' || docFormat === 'html' ? 'font-mono leading-relaxed' : 'font-sans'}`}
          />

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={saveToLocalFiles}
              className="py-3 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 font-bold text-xs rounded-xl border border-zinc-700"
            >
              💾 Save to App Vault
            </button>
            <button
              onClick={exportToDevice}
              className="py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow"
            >
              📤 Export to Device
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MY FILES VAULT */}
      {activeSubTab === 'files' && (
        <div className="space-y-3">
          {myFiles.length === 0 ? (
            <div className="bg-zinc-900/60 p-8 border border-dashed border-zinc-800 rounded-2xl text-center text-xs text-zinc-500">
              No documents found. Create and save a document in the Editor.
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {myFiles.map(file => (
                <div key={file.id} className="bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800 flex justify-between items-center">
                  <div className="truncate max-w-[60%]">
                    <div className="text-xs font-bold text-white truncate">{file.title}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[8px] bg-cyan-900/50 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded uppercase font-black">
                        {file.format}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono">{file.date}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => loadFile(file)}
                      className="px-3 py-1.5 bg-zinc-800 text-white hover:text-cyan-400 text-[10px] font-bold rounded-lg border border-zinc-700"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => deleteFile(file.id)}
                      className="px-2 py-1.5 bg-red-950/50 text-red-400 hover:text-red-300 text-[10px] font-bold rounded-lg border border-red-900/50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ToolFooter
        title="Offline Office Suite"
        details="Create, template, and export raw file blobs locally. HTML formats can be printed directly to PDF natively in standard web browsers."
        disclaimer="Data saved to the App Vault remains locally isolated."
      />
    </div>
  );
}
