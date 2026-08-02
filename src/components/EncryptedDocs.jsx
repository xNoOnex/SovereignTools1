import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import CryptoJS from 'crypto-js';

export function EncryptedDocs({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('Editor');
  
  // Editor State
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [format, setFormat] = useState('TXT');
  const [password, setPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // Vault State
  const [vaultFiles, setVaultFiles] = useState([]);
  const [viewingFile, setViewingFile] = useState(null);
  const [unlockPassword, setUnlockPassword] = useState('');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('sovereign_docs') || '[]');
    setVaultFiles(saved);
  }, [activeTab]);

  const showStatus = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const getEncryptedBlock = (rawText, pass) => {
    const encrypted = CryptoJS.AES.encrypt(rawText, pass).toString();
    return `-----BEGIN SOVEREIGN AES BLOCK-----\n${encrypted}\n-----END SOVEREIGN AES BLOCK-----`;
  };

  const getDecryptedText = (encryptedBlock, pass) => {
    try {
      const cleanBlock = encryptedBlock.replace(/-----.*?-----/g, '').trim();
      const bytes = CryptoJS.AES.decrypt(cleanBlock, pass);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      if (!originalText) throw new Error("Bad password");
      return originalText;
    } catch (e) {
      return null;
    }
  };

  // Export to actual device hard drive
  const exportToDevice = () => {
    if (!text) return showStatus('❌ Document is empty.');
    let blob;
    let filename = `${title || 'Sovereign_Doc'}`;

    if (format === 'PDF') {
      const doc = new jsPDF();
      const lines = doc.splitTextToSize(text, 180);
      doc.text(lines, 10, 10);
      doc.save(`${filename}.pdf`);
      return showStatus('✅ PDF Exported to Device!');
    }

    if (format === 'ENC') {
      if (!password) return showStatus('❌ AES Password Required for .ENC');
      blob = new Blob([getEncryptedBlock(text, password)], { type: 'text/plain' });
      filename += '.enc';
    } else if (format === 'DOC') {
      const htmlDoc = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${text.replace(/\n/g, '<br>')}</body></html>`;
      blob = new Blob([htmlDoc], { type: 'application/msword' });
      filename += '.doc';
    } else if (format === 'EXCEL') {
      blob = new Blob([text], { type: 'text/csv' });
      filename += '.csv';
    } else {
      blob = new Blob([text], { type: 'text/plain' });
      filename += '.txt';
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showStatus(`✅ ${format} Exported to Device!`);
  };

  // Save to internal app memory (Vault)
  const saveToVault = () => {
    if (!text) return showStatus('❌ Document is empty.');
    if (format === 'ENC' && !password) return showStatus('❌ AES Password Required for .ENC');

    const finalPayload = format === 'ENC' ? getEncryptedBlock(text, password) : text;
    const newDoc = {
      id: Date.now(),
      title: title || 'Untitled Document',
      content: finalPayload,
      format: format,
      date: new Date().toLocaleDateString()
    };

    const updated = [newDoc, ...vaultFiles];
    setVaultFiles(updated);
    localStorage.setItem('sovereign_docs', JSON.stringify(updated));
    showStatus('✅ Saved to Secure Vault');
  };

  const deleteFromVault = (id) => {
    const updated = vaultFiles.filter(f => f.id !== id);
    setVaultFiles(updated);
    localStorage.setItem('sovereign_docs', JSON.stringify(updated));
    setViewingFile(null);
  };

  const handleUnlock = () => {
    const decrypted = getDecryptedText(viewingFile.content, unlockPassword);
    if (decrypted) {
      setViewingFile({ ...viewingFile, decryptedContent: decrypted, isUnlocked: true });
      setUnlockPassword('');
    } else {
      showStatus('❌ Invalid AES Password.');
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen flex flex-col">
      
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">📝 Encrypted Docs</h2>
        <p className="text-xs text-zinc-400 mt-1">Multi-format compiler & AES document vault.</p>
      </div>

      {statusMsg && <div className="theme-accent-badge p-2 rounded-xl text-xs font-bold text-center shadow animate-fadeIn">{statusMsg}</div>}

      <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 shrink-0">
        <button onClick={() => { setActiveTab('Editor'); setViewingFile(null); }} className={`flex-1 py-2 text-xs font-bold rounded-xl ${activeTab === 'Editor' ? 'theme-accent-bg text-black' : 'text-zinc-400'}`}>✍️ Document Editor</button>
        <button onClick={() => setActiveTab('Vault')} className={`flex-1 py-2 text-xs font-bold rounded-xl ${activeTab === 'Vault' ? 'theme-accent-bg text-black' : 'text-zinc-400'}`}>📁 My Vault ({vaultFiles.length})</button>
      </div>

      {activeTab === 'Editor' && (
        <div className="flex-1 flex flex-col space-y-3">
          
          <div className="flex gap-2">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document Title..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white font-bold focus:outline-none" />
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-xs font-bold theme-accent-text focus:outline-none cursor-pointer">
              <option value="TXT">NOTE (.TXT)</option>
              <option value="PDF">DOC (.PDF)</option>
              <option value="DOC">WORD (.DOC)</option>
              <option value="EXCEL">EXCEL (.CSV)</option>
              <option value="ENC">ENCRYPTED (.ENC)</option>
            </select>
          </div>

          {format === 'ENC' && (
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Required: Set AES-256 Password..." className="w-full bg-red-950/20 border border-red-900/50 rounded-xl px-4 py-3 text-xs text-red-200 font-mono focus:outline-none animate-fadeIn" />
          )}

          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Start typing... Data compiles entirely offline." className="flex-1 w-full bg-black border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-300 font-mono focus:outline-none min-h-[300px]" />

          <div className="flex gap-2 shrink-0 pt-2">
            <button onClick={saveToVault} className="flex-1 py-3 bg-zinc-900 border border-zinc-700 text-white font-bold text-xs rounded-xl active:scale-95 transition-transform">💾 Save to Vault</button>
            <button onClick={exportToDevice} className="flex-1 py-3 theme-accent-bg text-black font-extrabold text-xs rounded-xl shadow active:scale-95 transition-transform">📥 Export to Device</button>
          </div>
        </div>
      )}

      {activeTab === 'Vault' && !viewingFile && (
        <div className="space-y-2 overflow-y-auto">
          {vaultFiles.length === 0 ? (
            <div className="text-center text-zinc-500 font-mono text-xs py-12">Vault is empty.</div>
          ) : (
            vaultFiles.map(file => (
              <div key={file.id} onClick={() => setViewingFile(file)} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center cursor-pointer active:scale-95 transition-transform">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {file.format === 'ENC' ? '🔒' : '📄'} {file.title}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">{file.date} • {file.format}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'Vault' && viewingFile && (
        <div className="flex-1 flex flex-col space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
            <h3 className="font-bold text-sm text-white truncate">{viewingFile.title}</h3>
            <button onClick={() => setViewingFile(null)} className="text-xs text-zinc-400 font-bold px-2">Back</button>
          </div>

          {viewingFile.format === 'ENC' && !viewingFile.isUnlocked ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <span className="text-5xl">🔒</span>
              <p className="text-xs font-mono text-red-400">AES-256 Encrypted Payload</p>
              <input type="password" value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} placeholder="Enter AES Password..." className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-center text-white focus:outline-none" />
              <button onClick={handleUnlock} className="w-full py-3 theme-accent-bg text-black font-bold text-xs rounded-xl shadow">Decrypt Document</button>
            </div>
          ) : (
            <div className="flex-1 bg-black border border-zinc-800 rounded-2xl p-4 overflow-y-auto">
              <p className="text-xs font-mono text-zinc-300 whitespace-pre-wrap">
                {viewingFile.isUnlocked ? viewingFile.decryptedContent : viewingFile.content}
              </p>
            </div>
          )}

          <button onClick={() => deleteFromVault(viewingFile.id)} className="w-full py-3 bg-red-950/40 border border-red-900 text-red-400 font-bold text-xs rounded-xl mt-auto">
            Delete from Vault
          </button>
        </div>
      )}
    </div>
  );
}
