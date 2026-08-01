import React, { useState } from 'react';
import { ToolFooter } from './ToolFooter';

export function AesCipherTool() {
  const [activeSubTab, setActiveSubTab] = useState('encrypt'); // 'encrypt' or 'decrypt'
  
  // Encrypt state
  const [secretText, setSecretText] = useState('');
  const [password, setPassword] = useState('');
  const [cipherOutput, setCipherOutput] = useState('');

  // Decrypt state
  const [cipherInput, setCipherInput] = useState('');
  const [decryptPassword, setDecryptPassword] = useState('');
  const [plainOutput, setPlainOutput] = useState('');
  
  const [statusMsg, setStatusMsg] = useState('');

  // Helper: Convert string to ArrayBuffer
  const str2ab = (str) => new TextEncoder().encode(str);
  const ab2str = (buf) => new TextDecoder().decode(buf);
  const ab2b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const b642ab = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

  // AES-GCM Encryption using Web Crypto API
  const handleEncrypt = async (e) => {
    e.preventDefault();
    if (!secretText || !password) {
      alert('Please enter both text and a security password.');
      return;
    }

    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      );

      const key = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
      );

      const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        enc.encode(secretText)
      );

      // Pack salt, iv, and ciphertext into a structured JSON package
      const packageObj = {
        v: 1,
        salt: ab2b64(salt),
        iv: ab2b64(iv),
        data: ab2b64(encrypted)
      };

      const finalCipher = `-----BEGIN SOVEREIGN AES CIPHER-----\n` +
        btoa(JSON.stringify(packageObj)) +
        `\n-----END SOVEREIGN AES CIPHER-----`;

      setCipherOutput(finalCipher);
      setStatusMsg('✅ Encrypted securely with AES-256-GCM!');
      setTimeout(() => setStatusMsg(''), 2500);
    } catch (err) {
      alert('Encryption failed: ' + err.message);
    }
  };

  // AES-GCM Decryption
  const handleDecrypt = async () => {
    if (!cipherInput || !decryptPassword) {
      alert('Please enter cipher block and password.');
      return;
    }

    try {
      // Clean up armor headers
      let clean = cipherInput.replace(/-----BEGIN SOVEREIGN AES CIPHER-----/g, '')
                             .replace(/-----END SOVEREIGN AES CIPHER-----/g, '')
                             .trim();
      
      const packageObj = JSON.parse(atob(clean));
      const salt = b642ab(packageObj.salt);
      const iv = b642ab(packageObj.iv);
      const data = b642ab(packageObj.data);

      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(decryptPassword),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      );

      const key = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
      );

      setPlainOutput(ab2str(decrypted));
      setStatusMsg('✅ Decrypted successfully!');
      setTimeout(() => setStatusMsg(''), 2500);
    } catch (err) {
      setPlainOutput('❌ Decryption failed! Incorrect password or corrupted cipher block.');
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setStatusMsg('📋 Copied to clipboard!');
    setTimeout(() => setStatusMsg(''), 2000);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24 select-none">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🛡️ AES-256 Secure Note & Cipher
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Military-grade symmetric encryption using AES-GCM and PBKDF2 password derivation.
        </p>
      </div>

      {statusMsg && (
        <div className="bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      {/* Sub-Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('encrypt')}
          className={`py-2 rounded-lg transition-all ${activeSubTab === 'encrypt' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400'}`}
        >
          🔒 Encrypt Secret Note
        </button>
        <button
          onClick={() => setActiveSubTab('decrypt')}
          className={`py-2 rounded-lg transition-all ${activeSubTab === 'decrypt' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400'}`}
        >
          🔓 Decrypt Cipher
        </button>
      </div>

      {/* ENCRYPT SECTION */}
      {activeSubTab === 'encrypt' && (
        <form onSubmit={handleEncrypt} className="space-y-4 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase">Secret Note / Message</label>
            <textarea
              rows="3"
              placeholder="Type sensitive text or notes..."
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              className="w-full mt-1 bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase">Encryption Password</label>
            <input
              type="password"
              placeholder="Enter strong master password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20"
          >
            🔒 Generate AES Cipher Package
          </button>

          {cipherOutput && (
            <div className="space-y-2 pt-3 border-t border-zinc-800">
              <label className="text-[10px] text-cyan-400 font-bold uppercase">Encrypted Cipher Block</label>
              <textarea
                rows="5"
                readOnly
                value={cipherOutput}
                className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-[10px] font-mono text-cyan-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => copyText(cipherOutput)}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl"
              >
                📋 Copy Cipher Block
              </button>
            </div>
          )}
        </form>
      )}

      {/* DECRYPT SECTION */}
      {activeSubTab === 'decrypt' && (
        <div className="space-y-4 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] text-zinc-400 font-bold uppercase">Paste Cipher Block</label>
              <button
                type="button"
                onClick={async () => {
                  const text = await navigator.clipboard.readText();
                  setCipherInput(text);
                }}
                className="text-[10px] text-cyan-400 font-bold hover:underline"
              >
                📋 Paste Clipboard
              </button>
            </div>
            <textarea
              rows="5"
              placeholder="Paste -----BEGIN SOVEREIGN AES CIPHER----- block..."
              value={cipherInput}
              onChange={(e) => setCipherInput(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-[10px] font-mono text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase">Master Password</label>
            <input
              type="password"
              placeholder="Enter password used to encrypt..."
              value={decryptPassword}
              onChange={(e) => setDecryptPassword(e.target.value)}
              className="w-full mt-1 bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleDecrypt}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20"
          >
            🔓 Unlock AES Cipher
          </button>

          {plainOutput && (
            <div className="p-3 bg-black border border-emerald-800/80 rounded-xl space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase">Decrypted Result:</span>
              <p className="text-sm font-sans text-white font-medium whitespace-pre-wrap">{plainOutput}</p>
            </div>
          )}
        </div>
      )}

      {/* Tool Footer */}
      <ToolFooter
        title="AES-256 Secure Note & Cipher"
        details="Performs client-side encryption using the Web Crypto API. Combines PBKDF2 (100,000 iterations) with AES-GCM 256-bit authenticated encryption."
        disclaimer="If you lose your master password, the encrypted cipher data cannot be recovered by any means."
      />
    </div>
  );
}
