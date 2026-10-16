import React, { useState, useMemo } from 'react';
import { useSecureStorage } from '../hooks/useSecureStorage';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { jsPDF } from 'jspdf';
import CryptoJS from 'crypto-js';

export function EncryptedDocs({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('Editor');

  // Editor State
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [format, setFormat] = useState('TXT');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Vault & Embedded Viewer State (Fixes ReferenceError crash)
  const [vaultFiles, setVaultFiles] = useSecureStorage('sovereign_docs', []);
  const [viewingFile, setViewingFile] = useState(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showUnlockPass, setShowUnlockPass] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const showStatus = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3200);
  };

  const getEncryptedBlock = (rawText, pass) => {
    const encrypted = CryptoJS.AES.encrypt(rawText, pass).toString();
    return `-----BEGIN SOVEREIGN AES BLOCK-----\n${encrypted}\n-----END SOVEREIGN AES BLOCK-----`;
  };

  const getDecryptedText = (encryptedBlock, pass) => {
    try {
      const cleanBlock = (encryptedBlock || '').replace(/-----.*?-----/g, '').trim();
      const bytes = CryptoJS.AES.decrypt(cleanBlock, pass);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      if (!originalText) throw new Error('Bad password');
      return originalText;
    } catch (e) {
      return null;
    }
  };

  const triggerBrowserDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToDevice = async (customDoc = null) => {
    const targetText = customDoc ? (customDoc.isUnlocked ? customDoc.decryptedContent : customDoc.content) : text;
    const targetTitle = (customDoc ? customDoc.title : title) || 'Sovereign_Doc';
    const targetFormat = customDoc ? customDoc.format : format;

    if (!targetText) return showStatus('❌ Document is empty.');

    const safeName = targetTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
    let filename = safeName;
    let payloadString = targetText;
    let mimeType = 'text/plain';

    if (targetFormat === 'PDF') {
      const doc = new jsPDF();
      const lines = doc.splitTextToSize(targetText, 180);
      doc.text(lines, 10, 15);
      doc.save(`${safeName}.pdf`);
      return showStatus('✅ PDF Exported to Device!');
    }

    if (targetFormat === 'ENC') {
      if (!customDoc && !password) return showStatus('❌ AES Password Required for .ENC');
      payloadString = customDoc ? customDoc.content : getEncryptedBlock(targetText, password);
      filename += '.enc';
    } else if (targetFormat === 'DOC') {
      payloadString = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${targetText.replace(/\n/g, '<br>')}</body></html>`;
      mimeType = 'application/msword';
      filename += '.doc';
    } else if (targetFormat === 'EXCEL') {
      mimeType = 'text/csv';
      filename += '.csv';
    } else {
      filename += '.txt';
    }

    try {
      await Filesystem.writeFile({
        path: filename,
        data: payloadString,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      showStatus(`✅ Saved ${filename} to Documents!`);
    } catch {
      const blob = new Blob([payloadString], { type: mimeType });
      triggerBrowserDownload(blob, filename);
      showStatus(`✅ ${targetFormat} Exported to Device!`);
    }
  };

  const saveToVault = () => {
    if (!text.trim()) return showStatus('❌ Document is empty.');
    if (format === 'ENC' && !password) return showStatus('❌ AES Password Required for .ENC');

    const finalPayload = format === 'ENC' ? getEncryptedBlock(text, password) : text;
    const nowStr = new Date().toLocaleDateString();

    if (editingId) {
      const updated = (vaultFiles || []).map(f =>
        f.id === editingId
          ? { ...f, title: title || 'Untitled Document', content: finalPayload, format, date: nowStr }
          : f
      );
      setVaultFiles(updated);
      setEditingId(null);
      showStatus('✅ Updated Document in Vault');
    } else {
      const newDoc = {
        id: Date.now(),
        title: title || 'Untitled Document',
        content: finalPayload,
        format,
        date: nowStr
      };
      setVaultFiles([newDoc, ...(vaultFiles || [])]);
      showStatus('✅ Saved to Secure Vault');
    }
  };

  const deleteFromVault = (id) => {
    if (!window.confirm('Permanently delete this document from the Vault?')) return;
    const updated = (vaultFiles || []).filter(f => f.id !== id);
    setVaultFiles(updated);
    setViewingFile(null);
    showStatus('🗑️ Deleted from Vault');
  };

  const handleUnlock = () => {
    if (!viewingFile) return;
    const decrypted = getDecryptedText(viewingFile.content, unlockPassword);
    if (decrypted !== null) {
      setViewingFile({ ...viewingFile, decryptedContent: decrypted, isUnlocked: true });
      setUnlockPassword('');
      showStatus('🔓 Payload Decrypted into RAM');
    } else {
      showStatus('❌ Invalid AES Password.');
    }
  };

  const loadIntoEditor = (file) => {
    if (file.format === 'ENC' && !file.isUnlocked) {
      return showStatus('❌ Unlock .ENC payload before editing.');
    }
    setEditingId(file.id);
    setTitle(file.title);
    setFormat(file.format);
    setText(file.isUnlocked ? file.decryptedContent : file.content);
    setViewingFile(null);
    setActiveTab('Editor');
    showStatus('✎ Loaded into Document Editor');
  };

  const clearEditor = () => {
    setEditingId(null);
    setTitle('');
    setText('');
    setPassword('');
    showStatus('✨ Editor Cleared');
  };

  const parseCSV = (content) => {
    if (!content) return [];
    return content.split('\n').map(row => row.split(','));
  };

  const filteredVault = useMemo(() => {
    const list = Array.isArray(vaultFiles) ? vaultFiles : [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(f => (f.title || '').toLowerCase().includes(q) || (f.format || '').toLowerCase().includes(q));
  }, [vaultFiles, searchQuery]);

  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [text]);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-36 select-none font-sans text-white bg-black min-h-screen flex flex-col">
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">📝 Encrypted Docs & Vault</h2>
          <p className="text-xs text-zinc-400 mt-1">Multi-format compiler & embedded vault file viewer.</p>
        </div>
        {activeTab === 'Editor' && (title || text || editingId) && (
          <button
            onClick={clearEditor}
            className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-[10px] font-mono text-zinc-300 active:scale-95"
          >
            + New
          </button>
        )}
      </div>

      {statusMsg && (
        <div className="theme-accent-badge p-2.5 rounded-xl text-xs font-bold text-center shadow animate-fadeIn">
          {statusMsg}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 shrink-0">
        <button
          onClick={() => { setActiveTab('Editor'); setViewingFile(null); }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'Editor' ? 'theme-accent-bg text-black' : 'text-zinc-400'
          }`}
        >
          ✍️ Document Editor {editingId ? '(Editing)' : ''}
        </button>
        <button
          onClick={() => setActiveTab('Vault')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'Vault' ? 'theme-accent-bg text-black' : 'text-zinc-400'
          }`}
        >
          📁 Notes Vault ({(vaultFiles || []).length})
        </button>
      </div>

      {/* EDITOR TAB */}
      {activeTab === 'Editor' && (
        <div className="flex-1 flex flex-col space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document Title..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
            />
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-xs font-bold theme-accent-text focus:outline-none cursor-pointer"
            >
              <option value="TXT">NOTE (.TXT)</option>
              <option value="PDF">DOC (.PDF)</option>
              <option value="DOC">WORD (.DOC)</option>
              <option value="EXCEL">EXCEL (.CSV)</option>
              <option value="ENC">ENCRYPTED (.ENC)</option>
            </select>
          </div>

          {format === 'ENC' && (
            <div className="flex gap-2 items-center animate-fadeIn">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Required: Set AES-256 Password..."
                className="flex-1 bg-red-950/20 border border-red-900/50 rounded-xl px-4 py-3 text-xs text-red-200 font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="px-3 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start typing... Data compiles entirely offline."
            className="flex-1 w-full bg-black border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-600 min-h-[280px]"
          />

          <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-1">
            <span>{wordCount} words • {text.length} chars</span>
            <span>MODE: {format}</span>
          </div>

          {/* Split Action Bar avoids overlapping center floating Home icon */}
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <button
              onClick={saveToVault}
              className="flex-1 py-3 bg-zinc-900 border border-zinc-700 text-white font-bold text-xs rounded-xl active:scale-95 transition-transform"
            >
              💾 {editingId ? 'Update Vault' : 'Save to Vault'}
            </button>
            <div className="w-12 shrink-0" />
            <button
              onClick={() => exportToDevice(null)}
              className="flex-1 py-3 theme-accent-bg text-black font-extrabold text-xs rounded-xl shadow active:scale-95 transition-transform"
            >
              📥 Export to Device
            </button>
          </div>
        </div>
      )}

      {/* VAULT LIST TAB */}
      {activeTab === 'Vault' && !viewingFile && (
        <div className="space-y-3 overflow-y-auto">
          {(vaultFiles || []).length > 0 && (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Vault notes..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          )}

          {filteredVault.length === 0 ? (
            <div className="text-center text-zinc-500 font-mono text-xs py-12">
              Vault is empty.
            </div>
          ) : (
            filteredVault.map(file => (
              <div
                key={file.id}
                onClick={() => { setUnlockPassword(''); setViewingFile(file); }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center cursor-pointer active:scale-95 transition-transform"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">
                    {file.format === 'ENC' ? '🔒' : file.format === 'EXCEL' ? '📊' : file.format === 'PDF' ? '📕' : '📄'}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{file.title}</h4>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {file.date} • {file.format} FORMAT
                    </p>
                  </div>
                </div>
                <span className="text-xs theme-accent-text font-bold shrink-0 ml-2">Open →</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* EMBEDDED FILE VIEWER INSIDE VAULT */}
      {activeTab === 'Vault' && viewingFile && (
        <div className="flex-1 flex flex-col space-y-3 animate-fadeIn">
          <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-2xl border border-zinc-800 shrink-0 gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-xs text-white truncate">{viewingFile.title}</h3>
              <span className="text-[9px] text-zinc-400 font-mono uppercase">
                {viewingFile.format} FORMAT VIEWER
              </span>
            </div>
            <button
              onClick={() => setViewingFile(null)}
              className="theme-accent-bg text-black px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
            >
              ← Back
            </button>
          </div>

          <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl p-4 overflow-auto min-h-[300px] flex items-center justify-center">
            {viewingFile.format === 'ENC' && !viewingFile.isUnlocked ? (
              <div className="w-full flex flex-col items-center justify-center space-y-4">
                <span className="text-5xl">🔒</span>
                <p className="text-xs font-mono text-red-400">AES-256 Encrypted Payload Locked</p>
                <div className="w-full flex gap-2">
                  <input
                    type={showUnlockPass ? 'text' : 'password'}
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    placeholder="Enter AES Password..."
                    className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-center text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUnlockPass(!showUnlockPass)}
                    className="px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs"
                  >
                    {showUnlockPass ? '🙈' : '👁️'}
                  </button>
                </div>
                <button
                  onClick={handleUnlock}
                  className="w-full py-3 theme-accent-bg text-black font-bold text-xs rounded-xl shadow"
                >
                  🔓 Decrypt Payload
                </button>
              </div>
            ) : viewingFile.format === 'EXCEL' ? (
              <div className="w-full self-start overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <tbody>
                    {parseCSV(viewingFile.isUnlocked ? viewingFile.decryptedContent : viewingFile.content).map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-zinc-900">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2 border-r border-zinc-900 text-zinc-300">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="w-full h-full self-start font-mono text-xs text-zinc-300 whitespace-pre-wrap overflow-y-auto select-text">
                {viewingFile.isUnlocked ? viewingFile.decryptedContent : viewingFile.content}
              </div>
            )}
          </div>

          {/* Viewer Actions (Edit, Copy, Export, Delete) */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <button
              onClick={() => loadIntoEditor(viewingFile)}
              className="py-2.5 bg-zinc-900 border border-zinc-700 text-white font-bold text-xs rounded-xl"
            >
              ✎ Edit in Editor
            </button>
            <button
              onClick={() => {
                const raw = viewingFile.isUnlocked ? viewingFile.decryptedContent : viewingFile.content;
                navigator.clipboard?.writeText(raw || '');
                showStatus('📋 Copied to Clipboard');
              }}
              className="py-2.5 bg-zinc-900 border border-zinc-700 text-zinc-200 font-bold text-xs rounded-xl"
            >
              📋 Copy Text
            </button>
            <button
              onClick={() => exportToDevice(viewingFile)}
              className="py-2.5 bg-cyan-950/40 border border-cyan-700 text-cyan-300 font-bold text-xs rounded-xl"
            >
              📥 Export File
            </button>
            <button
              onClick={() => deleteFromVault(viewingFile.id)}
              className="py-2.5 bg-red-950/40 border border-red-900 text-red-400 font-bold text-xs rounded-xl"
            >
              🗑️ Delete File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EncryptedDocs;
