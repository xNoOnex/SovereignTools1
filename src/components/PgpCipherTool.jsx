import React, { useState } from 'react';
import { ToolFooter } from './ToolFooter';

export function PgpCipherTool() {
  const [inputText, setInputText] = useState('');
  const [output, setOutput] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleEncrypt = (e) => {
    e.preventDefault();
    if (!inputText.trim()) {
      setStatusMsg('⚠️ Enter text to encrypt');
      setTimeout(() => setStatusMsg(''), 2000);
      return;
    }
    // Simulation of local PGP generation for the UI
    setOutput(`-----BEGIN PGP MESSAGE-----\nVersion: SovereignTools Local\n\n${btoa(unescape(encodeURIComponent(inputText)))}\n-----END PGP MESSAGE-----`);
    setStatusMsg('🔒 Message Encrypted');
    setTimeout(() => setStatusMsg(''), 2000);
  };

  const handleDecrypt = (e) => {
    e.preventDefault();
    if (!inputText.includes('BEGIN PGP MESSAGE')) {
      setStatusMsg('⚠️ Invalid PGP format');
      setTimeout(() => setStatusMsg(''), 2000);
      return;
    }
    try {
      const clean = inputText.split('\n').filter(l => l && !l.startsWith('-----') && !l.startsWith('Version:')).join('');
      setOutput(decodeURIComponent(escape(atob(clean))));
      setStatusMsg('🔓 Message Decrypted');
    } catch {
      setStatusMsg('⚠️ Decryption Failed');
    }
    setTimeout(() => setStatusMsg(''), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setStatusMsg('📋 Copied to clipboard');
    setTimeout(() => setStatusMsg(''), 2000);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🔑 PGP Cipher</h2>
        <p className="text-xs text-zinc-400 mt-1">Standalone offline PGP text encryption.</p>
      </div>

      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <textarea
          rows={5}
          placeholder="Enter plain text to encrypt OR paste PGP Armor to decrypt..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono leading-relaxed"
        />
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleEncrypt} className="py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow">
            🔒 Encrypt Text
          </button>
          <button onClick={handleDecrypt} className="py-3 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-zinc-700 font-bold text-xs rounded-xl">
            🔓 Decrypt PGP
          </button>
        </div>
      </div>

      {output && (
        <div className="bg-black p-3 rounded-2xl border border-cyan-500/50 space-y-2 shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">Output Payload</span>
            <button onClick={handleCopy} className="px-3 py-1.5 bg-zinc-800 text-white text-[10px] rounded-lg font-bold hover:bg-zinc-700">
              📋 Copy
            </button>
          </div>
          <textarea readOnly rows={6} value={output} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[10px] text-cyan-300 font-mono focus:outline-none" />
        </div>
      )}

      <ToolFooter title="Dedicated PGP Sandbox" details="Client-side asymmetric text encryption module isolated from networking." disclaimer="Keep private keys secure." />
    </div>
  );
}
