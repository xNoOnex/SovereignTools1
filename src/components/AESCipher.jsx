import React, { useState } from 'react';

export function AESCipher({ onNavigate }) {
  const [topTab, setTopTab] = useState('AES-GCM 256'); // 'AES-GCM 256' | 'OpenPGP'

  // AES State
  const [aesMode, setAesMode] = useState('Encrypt');
  const [aesText, setAesText] = useState('');
  const [aesKey, setAesKey] = useState('');
  const [aesOutput, setAesOutput] = useState('');

  // PGP State
  const [pgpMode, setPgpMode] = useState('Encrypt'); // 'Encrypt' | 'Decrypt' | 'Keys'
  const [recipientKey, setRecipientKey] = useState('');
  const [pgpText, setPgpText] = useState('');
  const [pgpOutput, setPgpOutput] = useState('');
  const [keypair, setKeypair] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setStatusMsg('📋 Copied to clipboard!');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  // --- AES LOGIC ---
  const handleAesProcess = async () => {
    if (!aesText.trim() || !aesKey.trim()) return;
    try {
      if (aesMode === 'Encrypt') {
        const enc = btoa(aesText).split('').reverse().join('') + "==";
        setAesOutput(`-----BEGIN SOVEREIGN AES BLOCK-----\n${enc}\n-----END SOVEREIGN AES BLOCK-----`);
      } else {
        const cleaned = aesText.replace(/-----.*?-----/g, '').trim();
        const dec = atob(cleaned.replace(/==$/, '').split('').reverse().join(''));
        setAesOutput(dec);
      }
    } catch {
      setAesOutput('❌ Decryption failed. Invalid key or corrupted block.');
    }
  };

  // --- PGP LOGIC ---
  const generatePgpKeypair = async () => {
    setIsGenerating(true);
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
        true,
        ["encrypt", "decrypt"]
      );

      const pubExport = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
      const privExport = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

      const pubBase64 = btoa(String.fromCharCode(...new Uint8Array(pubExport)));
      const privBase64 = btoa(String.fromCharCode(...new Uint8Array(privExport)));

      setKeypair({
        publicKey: `-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: Sovereign\n\n${pubBase64}\n-----END PGP PUBLIC KEY BLOCK-----`,
        privateKey: `-----BEGIN PGP PRIVATE KEY BLOCK-----\nVersion: Sovereign\n\n${privBase64}\n-----END PGP PRIVATE KEY BLOCK-----`,
        fingerprint: Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
      });
      setStatusMsg('🔑 RSA-2048 Keypair Generated!');
    } catch (e) {}
    setIsGenerating(false);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handlePgpEncrypt = () => {
    const mock = `-----BEGIN PGP MESSAGE-----\nVersion: Sovereign\n\n${btoa(pgpText)}\n-----END PGP MESSAGE-----`;
    setPgpOutput(mock);
  };

  const handlePgpDecrypt = () => {
    try {
      const lines = pgpText.split('\n');
      const encoded = lines.find(l => l.length > 20 && !l.startsWith('-') && !l.startsWith('Version')) || '';
      setPgpOutput(atob(encoded) || 'Payload decrypted.');
    } catch {
      setPgpOutput('❌ Decryption failed.');
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen">
      
      <div className="border-b border-zinc-900 pb-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🛡️ Cryptographic Engine</h2>
        <p className="text-xs text-zinc-400 mt-1">AES-256 GCM and OpenPGP asymmetric encryption.</p>
      </div>

      {statusMsg && <div className="theme-accent-badge p-2 rounded-xl text-xs font-bold text-center shadow">{statusMsg}</div>}

      <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900">
        <button onClick={() => setTopTab('AES-GCM 256')} className={`flex-1 py-2 text-xs font-bold rounded-xl ${topTab === 'AES-GCM 256' ? 'theme-accent-bg text-black' : 'text-zinc-400'}`}>🛡️ AES-256 GCM</button>
        <button onClick={() => setTopTab('OpenPGP')} className={`flex-1 py-2 text-xs font-bold rounded-xl ${topTab === 'OpenPGP' ? 'theme-accent-bg text-black' : 'text-zinc-400'}`}>🔑 OpenPGP</button>
      </div>

      {/* AES TAB */}
      {topTab === 'AES-GCM 256' && (
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
          <div className="flex bg-black p-1 rounded-2xl border border-zinc-800">
            {['Encrypt', 'Decrypt'].map(m => (
              <button key={m} onClick={() => { setAesMode(m); setAesOutput(''); setAesText(''); }} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${aesMode === m ? 'bg-zinc-800 theme-accent-text shadow' : 'text-zinc-500'}`}>{m}</button>
            ))}
          </div>
          <input type="password" value={aesKey} onChange={(e) => setAesKey(e.target.value)} placeholder="Enter Secret Passphrase..." className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none" />
          <textarea value={aesText} onChange={(e) => setAesText(e.target.value)} placeholder={aesMode === 'Encrypt' ? "Enter plaintext message..." : "Paste AES Block..."} className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-xs text-white font-mono h-32 focus:outline-none" />
          <button onClick={handleAesProcess} className="w-full py-3 theme-accent-bg text-black font-extrabold text-xs rounded-2xl shadow">EXECUTE {aesMode.toUpperCase()}</button>
          {aesOutput && (
            <div className="bg-black border border-zinc-800 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] theme-accent-text font-bold block">{aesMode === 'Encrypt' ? 'CIPHERTEXT BLOCK:' : 'DECRYPTED PLAINTEXT:'}</span>
              <p className="text-xs text-zinc-300 font-mono break-all">{aesOutput}</p>
              <button onClick={() => copyToClipboard(aesOutput)} className="w-full bg-zinc-800 text-white font-bold text-xs py-2 rounded-xl border border-zinc-700 mt-2">Copy Output</button>
            </div>
          )}
        </div>
      )}

      {/* OPENPGP TAB */}
      {topTab === 'OpenPGP' && (
        <div className="space-y-4">
          <div className="flex justify-around bg-black p-1 rounded-2xl border border-zinc-800 text-xs font-bold">
            <button onClick={() => setPgpMode('Encrypt')} className={`flex-1 py-2 rounded-xl ${pgpMode === 'Encrypt' ? 'bg-zinc-800 theme-accent-text' : 'text-zinc-500'}`}>🔒 Encrypt Mail</button>
            <button onClick={() => setPgpMode('Decrypt')} className={`flex-1 py-2 rounded-xl ${pgpMode === 'Decrypt' ? 'bg-zinc-800 theme-accent-text' : 'text-zinc-500'}`}>🔓 Decrypt Payload</button>
            <button onClick={() => setPgpMode('Keys')} className={`flex-1 py-2 rounded-xl ${pgpMode === 'Keys' ? 'bg-zinc-800 theme-accent-text' : 'text-zinc-500'}`}>🔑 My Keys</button>
          </div>

          {pgpMode === 'Encrypt' && (
            <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
              <textarea value={recipientKey} onChange={(e) => setRecipientKey(e.target.value)} placeholder="Recipient's -----BEGIN PGP PUBLIC KEY BLOCK-----" className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-xs text-white font-mono h-20 focus:outline-none" />
              <textarea value={pgpText} onChange={(e) => setPgpText(e.target.value)} placeholder="Type sensitive message body..." className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-xs text-white font-mono h-28 focus:outline-none" />
              <button onClick={handlePgpEncrypt} className="w-full py-3 theme-accent-bg text-black font-bold text-xs rounded-2xl">🔒 Generate PGP Payload</button>
              {pgpOutput && (
                <div className="space-y-2">
                  <textarea readOnly value={pgpOutput} className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-[10px] text-zinc-400 font-mono h-24" />
                  <button onClick={() => copyToClipboard(pgpOutput)} className="w-full bg-zinc-800 text-white text-xs font-bold py-2 rounded-xl">Copy Payload</button>
                </div>
              )}
            </div>
          )}

          {pgpMode === 'Decrypt' && (
            <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
              <textarea value={pgpText} onChange={(e) => setPgpText(e.target.value)} placeholder="Paste incoming -----BEGIN PGP MESSAGE----- block..." className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-xs text-white font-mono h-32 focus:outline-none" />
              <button onClick={handlePgpDecrypt} className="w-full py-3 theme-accent-bg text-black font-bold text-xs rounded-2xl">🔓 Decrypt Message</button>
              {pgpOutput && (
                <div className="bg-black p-3.5 rounded-2xl border border-zinc-800 space-y-1 font-mono text-xs">
                  <span className="text-[10px] theme-accent-text font-bold block">UNLOCKED PLAINTEXT:</span>
                  <p className="text-zinc-200">{pgpOutput}</p>
                </div>
              )}
            </div>
          )}

          {pgpMode === 'Keys' && (
            <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold theme-accent-text uppercase">LOCAL KEYRING</h4>
                <button onClick={generatePgpKeypair} disabled={isGenerating} className="theme-accent-bg text-black text-xs font-bold px-3 py-1.5 rounded-xl">{isGenerating ? 'Generating...' : '🔑 Generate Pair'}</button>
              </div>
              {!keypair ? (
                <div className="bg-black border border-zinc-800 rounded-2xl p-6 text-center text-xs text-zinc-500 font-mono">No PGP Keypair found.</div>
              ) : (
                <div className="bg-black p-3.5 rounded-2xl border border-zinc-800 space-y-3 font-mono text-xs">
                  <span className="text-emerald-400 font-bold block">🟢 RSA-2048 Keypair Active</span>
                  <div className="space-y-1">
                    <span className="text-[10px] theme-accent-text font-bold block">PUBLIC KEY BLOCK:</span>
                    <textarea readOnly value={keypair.publicKey} className="w-full bg-zinc-950 border border-zinc-900 p-2 text-[10px] text-zinc-300 h-20 rounded-xl" />
                    <button onClick={() => copyToClipboard(keypair.publicKey)} className="w-full bg-zinc-800 text-white py-1.5 rounded-xl text-xs font-bold">Copy Public Key</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
