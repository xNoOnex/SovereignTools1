import React, { useState } from 'react';

export function AESCipher({ onNavigate }) {
  const [activeSubTab, setActiveSubTab] = useState('Encrypt'); // 'Encrypt' | 'Decrypt'
  
  // Encrypt Form
  const [secretNote, setSecretNote] = useState('');
  const [encryptPassword, setEncryptPassword] = useState('');
  const [generatedCipher, setGeneratedCipher] = useState('');

  // Decrypt Form
  const [cipherInput, setCipherInput] = useState('');
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decryptedText, setDecryptedText] = useState('');

  const [statusMsg, setStatusMsg] = useState('');

  // Native Web Crypto API Helpers (PBKDF2 + AES-GCM)
  const getCryptoKey = async (password, salt) => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };

  const handleEncrypt = async () => {
    if (!secretNote.trim() || !encryptPassword.trim()) {
      setStatusMsg('❌ Both note and master password are required.');
      setTimeout(() => setStatusMsg(''), 3000);
      return;
    }

    try {
      const enc = new TextEncoder();
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const key = await getCryptoKey(encryptPassword, salt);

      const encryptedContent = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(secretNote)
      );

      // Concatenate Salt + IV + Ciphertext
      const combined = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedContent), salt.length + iv.length);

      // Convert to Base64
      let binary = '';
      combined.forEach(b => binary += String.fromCharCode(b));
      const base64Str = btoa(binary);

      const formattedBlock = `-----BEGIN SOVEREIGN AES CIPHER-----\n${base64Str}\n-----END SOVEREIGN AES CIPHER-----`;
      setGeneratedCipher(formattedBlock);
      navigator.clipboard.writeText(formattedBlock);
      setStatusMsg('🔒 Generated & copied AES-256 cipher package!');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e) {
      setStatusMsg('❌ Encryption failed.');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const handleDecrypt = async () => {
    if (!cipherInput.trim() || !decryptPassword.trim()) {
      setStatusMsg('❌ Both cipher block and master password are required.');
      setTimeout(() => setStatusMsg(''), 3000);
      return;
    }

    try {
      const cleanBlock = cipherInput
        .replace('-----BEGIN SOVEREIGN AES CIPHER-----', '')
        .replace('-----END SOVEREIGN AES CIPHER-----', '')
        .replace(/\s+/g, '');

      const binary = atob(cleanBlock);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const salt = bytes.slice(0, 16);
      const iv = bytes.slice(16, 28);
      const ciphertext = bytes.slice(28);

      const key = await getCryptoKey(decryptPassword, salt);
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      const dec = new TextDecoder();
      setDecryptedText(dec.decode(decryptedBuffer));
      setStatusMsg('🔓 Cipher unlocked successfully!');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e) {
      setStatusMsg('❌ Decryption failed! Invalid password or corrupted cipher.');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const pasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCipherInput(text);
    } catch (e) {}
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      {/* HEADER */}
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🛡️ Cipher
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Military-grade symmetric encryption using AES-GCM and PBKDF2 password derivation.
        </p>
      </div>

      {/* TOAST NOTIFICATION */}
      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg animate-fadeIn">
          {statusMsg}
        </div>
      )}

      {/* SUBTAB TOGGLES (Matches Screenshot 4901.jpg & 4903.jpg) */}
      <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900">
        <button
          onClick={() => setActiveSubTab('Encrypt')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'Encrypt'
              ? 'bg-cyan-500 text-black shadow-md font-black'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          🔒 Encrypt Secret Note
        </button>
        <button
          onClick={() => setActiveSubTab('Decrypt')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'Decrypt'
              ? 'bg-cyan-500 text-black shadow-md font-black'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          🔓 Decrypt Cipher
        </button>
      </div>

      {/* SUBTAB 1: ENCRYPT SECRET NOTE (Matches Screenshot 4901.jpg) */}
      {activeSubTab === 'Encrypt' && (
        <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-mono block uppercase font-bold">
              SECRET NOTE / MESSAGE
            </label>
            <textarea
              value={secretNote}
              onChange={(e) => setSecretNote(e.target.value)}
              placeholder="Type sensitive text or notes..."
              className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-xs text-white font-mono h-32 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-mono block uppercase font-bold">
              ENCRYPTION PASSWORD
            </label>
            <input
              type="password"
              value={encryptPassword}
              onChange={(e) => setEncryptPassword(e.target.value)}
              placeholder="Enter strong master password..."
              className="w-full bg-black border border-zinc-800 rounded-2xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleEncrypt}
            className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-1.5 uppercase"
          >
            🔒 GENERATE AES CIPHER PACKAGE
          </button>

          {generatedCipher && (
            <div className="bg-black p-3.5 rounded-2xl border border-zinc-800 space-y-1">
              <span className="text-[10px] text-cyan-400 font-mono font-bold block">CIPHER BLOCK:</span>
              <p className="text-[10px] text-zinc-300 font-mono break-all select-all">{generatedCipher}</p>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: DECRYPT CIPHER (Matches Screenshot 4903.jpg) */}
      {activeSubTab === 'Decrypt' && (
        <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-zinc-400 font-mono block uppercase font-bold">
                PASTE CIPHER BLOCK
              </label>
              <button
                onClick={pasteClipboard}
                className="text-[10px] text-cyan-400 font-bold hover:underline flex items-center gap-1"
              >
                📋 Paste Clipboard
              </button>
            </div>
            <textarea
              value={cipherInput}
              onChange={(e) => setCipherInput(e.target.value)}
              placeholder="Paste -----BEGIN SOVEREIGN AES CIPHER----- block..."
              className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-xs text-white font-mono h-32 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-mono block uppercase font-bold">
              MASTER PASSWORD
            </label>
            <input
              type="password"
              value={decryptPassword}
              onChange={(e) => setDecryptPassword(e.target.value)}
              placeholder="Enter password used to encrypt..."
              className="w-full bg-black border border-zinc-800 rounded-2xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleDecrypt}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-1.5 uppercase"
          >
            🔒 UNLOCK AES CIPHER
          </button>

          {decryptedText && (
            <div className="bg-black p-3.5 rounded-2xl border border-zinc-800 space-y-1">
              <span className="text-[10px] text-emerald-400 font-mono font-bold block">DECRYPTED SECRET NOTE:</span>
              <p className="text-xs text-white font-mono whitespace-pre-wrap">{decryptedText}</p>
            </div>
          )}
        </div>
      )}

      {/* FOOTER & DISCLAIMER */}
      <div className="space-y-2 pt-2">
        <p className="text-[10px] text-zinc-400 flex items-start gap-1.5 px-1 leading-relaxed">
          <span className="text-cyan-400">ℹ️</span>
          <span>
            <strong>About AES-256 Secure Note & Cipher:</strong> Performs client-side encryption using the Web Crypto API. Combines PBKDF2 (100,000 iterations) with AES-GCM 256-bit authenticated encryption.
          </span>
        </p>
      </div>

    </div>
  );
}
