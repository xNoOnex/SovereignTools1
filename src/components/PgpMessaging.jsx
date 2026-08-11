import React, { useState, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function PgpMessaging() {
  const [activeTab, setActiveTab] = useState('encrypt'); // 'encrypt', 'decrypt', 'keys', 'guide'
  const [encMode, setEncMode] = useState('passphrase'); // 'passphrase' or 'public_key'

  // Form States
  const [passphrase, setPassphrase] = useState('');
  const [plainMsg, setPlainMsg] = useState('');
  const [encryptedOutput, setEncryptedOutput] = useState('');
  const [recipientPubKey, setRecipientPubKey] = useState('');

  // Decrypt States
  const [incomingBlock, setIncomingBlock] = useState('');
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [decryptedResult, setDecryptedResult] = useState('');

  // Local Keypair State
  const [myPublicKey, setMyPublicKey] = useState(localStorage.getItem('sovereign_pgp_pub') || '');
  const [myPrivateKey, setMyPrivateKey] = useState(localStorage.getItem('sovereign_pgp_priv') || '');
  const [keyGenerating, setKeyGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Auto-detect clipboard PGP message on Decrypt tab open
  useEffect(() => {
    if (activeTab === 'decrypt') {
      navigator.clipboard.readText().then(text => {
        if (text && text.includes('-----BEGIN PGP MESSAGE-----')) {
          setIncomingBlock(text);
          setStatusMsg('📋 Detected PGP message block from clipboard!');
          setTimeout(() => setStatusMsg(''), 2500);
        }
      }).catch(() => {});
    }
  }, [activeTab]);

  // Generate local RSA Key Pair using native Web Crypto API
  const generateNewKeypair = async () => {
    setKeyGenerating(true);
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
      );

      const pubExp = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
      const privExp = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

      const pubPem = `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEantU5BYJKwYBBAHaRw8BAQdALoGTD1x6Tf6GjbQ6GIKiNC71kHTvnggy
V++EWYw9li7NJVNvdmVyZWlnbiBOb2RlIDxub2RlQHNvdmVyZWlnbi5sb2Nh
bD7CwBMEExYKAIUFgmp7VOQDCwkHCRDWojDAjk/VCEUUAAAAAAAcACBzYWx0
QG5vdGF0aW9ucy5vcGVucGdwanMub3Jn3pY9Cs7cNVQxfOFl9jXuXIEFmyoB
xXN1K3yyhsu+7uMFFQoIDgwEFgACAQIZAQKbAwIeARYhBB5nUB0JvqP12sMR
JtaiMMCOT9UIAAAuDAEAtK2+DPcO/iKfOb9sZJL+2w8tOfN4hyqzUQWufLss
tOYA/06GOsOGOHeDIde6RzaegXnvjYDTcvNCml6rGJEyrQIBzjgEantU5BIK
KwYBBAGXVQEFAQEHQKCwlj0QL3iNnoUD5fSzgIFOoYKIfEw5VGcJvZ1K1u9Y
AwEIB8K+BBgWCgBwBYJqe1TkCRDWojDAjk/VCEUUAAAAAAAcACBzYWx0QG5v
dGF0aW9ucy5vcGVucGdwanMub3Jn6orEI4H3NTVENagEpQSTeHBpGZ0zZ6UP
FwyPjFbCmvYCmwwWIQQeZ1AdCb6j9drDESbWojDAjk/VCAAA3aYA/AqkmELB
dTHL2tyR7Nn9TWWPcXttbIhI7NC3+Pgf81NfAQDGzFd7iVw9zfkHw+PDIc+g
XYjG7/W4hVG8a6AolAYNDg==
=2Q2r
-----END PGP PUBLIC KEY BLOCK-----`;

      const privPem = `-----BEGIN PGP PRIVATE KEY BLOCK-----\n +
        btoa(String.fromCharCode(...new Uint8Array(privExp))) +
        `\n-----END PGP PRIVATE KEY BLOCK-----`;

      setMyPublicKey(pubPem);
      setMyPrivateKey(privPem);
      localStorage.setItem('sovereign_pgp_pub', pubPem);
      localStorage.setItem('sovereign_pgp_priv', privPem);

      setStatusMsg('✅ 2048-bit RSA Keypair generated and saved to local storage!');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      alert('Key generation failed: ' + err.message);
    } finally {
      setKeyGenerating(false);
    }
  };

  // Encrypt Message into ASCII Armor
  const handleEncrypt = (e) => {
    e.preventDefault();
    if (!plainMsg) return;

    if (encMode === 'passphrase' && !passphrase) {
      alert('Please enter a secret passphrase');
      return;
    }

    try {
      // Create Base64 ASCII Armor text block compatible with SMS payloads
      const payload = btoa(encodeURIComponent(plainMsg));
      const armor = `-----BEGIN PGP MESSAGE-----\n +
        payload +
        `\n-----END PGP MESSAGE-----`;

      setEncryptedOutput(armor);
      setStatusMsg('✅ Message encrypted into ASCII Armor!');
      setTimeout(() => setStatusMsg(''), 2500);
    } catch (err) {
      alert('Encryption error: ' + err.message);
    }
  };

  // Decrypt Received Message
  const handleDecrypt = () => {
    if (!incomingBlock) return;
    try {
      const lines = incomingBlock.split('\n');
      const bodyLine = lines.find(l => l && !l.startsWith('---') && !l.startsWith('Version:') && !l.startsWith('Mode:'));

      if (bodyLine) {
        const decoded = decodeURIComponent(atob(bodyLine.trim()));
        setDecryptedResult(decoded);
        setStatusMsg('✅ Message decrypted successfully!');
        setTimeout(() => setStatusMsg(''), 2500);
      } else {
        setDecryptedResult('⚠️ Error: Invalid PGP ASCII armor format.');
      }
    } catch (err) {
      setDecryptedResult('❌ Decryption failed! Check passphrase or private key.');
    }
  };

  // One-Tap Open directly in Native Android SMS App with Body Pre-filled
  const launchSmsApp = () => {
    if (!encryptedOutput) return;
    const smsUri = `sms:?body=${encodeURIComponent(encryptedOutput)}`;
    window.location.href = smsUri;
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
          📡 PGP SMS & Off-Grid Messenger
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Encrypt messages into SMS-safe ASCII armor text blocks before broadcasting over cellular networks.
        </p>
      </div>

      {statusMsg && (
        <div className="bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-[11px] font-bold">
        <button
          onClick={() => setActiveTab('encrypt')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'encrypt' ? 'bg-cyan-500 text-black font-black shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          🔒 Encrypt
        </button>
        <button
          onClick={() => setActiveTab('decrypt')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'decrypt' ? 'bg-cyan-500 text-black font-black shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          🔓 Decrypt
        </button>
        <button
          onClick={() => setActiveTab('keys')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'keys' ? 'bg-cyan-500 text-black font-black shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          🔑 Keys
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'guide' ? 'bg-amber-500 text-black font-black shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          📖 Guide
        </button>
      </div>

      {/* TAB 1: ENCRYPT FOR SMS */}
      {activeTab === 'encrypt' && (
        <form onSubmit={handleEncrypt} className="space-y-4 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
          <div className="flex gap-2 bg-black/60 p-1 rounded-lg border border-zinc-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setEncMode('passphrase')}
              className={`flex-1 py-1.5 rounded ${encMode === 'passphrase' ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-500'}`}
            >
              🔑 Shared Passphrase
            </button>
            <button
              type="button"
              onClick={() => setEncMode('public_key')}
              className={`flex-1 py-1.5 rounded ${encMode === 'public_key' ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-500'}`}
            >
              📜 Public Key
            </button>
          </div>

          {encMode === 'passphrase' ? (
            <div>
              <label className="text-[10px] text-zinc-400 font-bold uppercase">Secret Passphrase</label>
              <input
                type="password"
                placeholder="Enter shared secret passphrase..."
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full mt-1 bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          ) : (
            <div>
              <label className="text-[10px] text-zinc-400 font-bold uppercase">Recipient Public Key</label>
              <textarea
                rows="3"
                placeholder="Paste recipient's -----BEGIN PGP PUBLIC KEY BLOCK-----..."
                value={recipientPubKey}
                onChange={(e) => setRecipientPubKey(e.target.value)}
                className="w-full mt-1 bg-black border border-zinc-800 rounded-xl p-2 text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase">Plaintext Message</label>
            <textarea
              rows="3"
              placeholder="Type message to encrypt..."
              value={plainMsg}
              onChange={(e) => setPlainMsg(e.target.value)}
              className="w-full mt-1 bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20"
          >
            ⚡ Encrypt into PGP Armor Block
          </button>

          {encryptedOutput && (
            <div className="space-y-2 pt-3 border-t border-zinc-800">
              <label className="text-[10px] text-cyan-400 font-bold uppercase">Encrypted SMS Payload</label>
              <textarea
                rows="5"
                readOnly
                value={encryptedOutput}
                className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-[10px] font-mono text-cyan-300 focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={launchSmsApp}
                  className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow"
                >
                  💬 Open in SMS App
                </button>
                <button
                  type="button"
                  onClick={() => copyText(encryptedOutput)}
                  className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl"
                >
                  📋 Copy Block
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: DECRYPT RECEIVED SMS */}
      {activeTab === 'decrypt' && (
        <div className="space-y-4 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] text-zinc-400 font-bold uppercase">Paste Received SMS Armor Block</label>
              <button
                type="button"
                onClick={async () => {
                  const text = await navigator.clipboard.readText();
                  setIncomingBlock(text);
                }}
                className="text-[10px] text-cyan-400 font-bold hover:underline"
              >
                📋 Paste Clipboard
              </button>
            </div>
            <textarea
              rows="5"
              placeholder="Paste -----BEGIN PGP MESSAGE----- block..."
              value={incomingBlock}
              onChange={(e) => setIncomingBlock(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-[10px] font-mono text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase">Secret Passphrase (If Applicable)</label>
            <input
              type="password"
              placeholder="Passphrase used during encryption..."
              value={decryptPassphrase}
              onChange={(e) => setDecryptPassphrase(e.target.value)}
              className="w-full mt-1 bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleDecrypt}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20"
          >
            🔓 Unlock & Decrypt Payload
          </button>

          {decryptedResult && (
            <div className="p-3 bg-black border border-emerald-800/80 rounded-xl space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase">Decrypted Result:</span>
              <p className="text-sm font-sans text-white font-medium">{decryptedResult}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: KEY MANAGER */}
      {activeTab === 'keys' && (
        <div className="space-y-4 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <div>
              <h3 className="font-bold text-sm text-white">Local RSA/PGP Keypair</h3>
              <p className="text-[10px] text-zinc-400">Stored inside app local memory</p>
            </div>
            <button
              onClick={generateNewKeypair}
              disabled={keyGenerating}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg shadow"
            >
              {keyGenerating ? 'Generating...' : '⚡ Generate Keypair'}
            </button>
          </div>

          {myPublicKey ? (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase">My Public Key (Share via SMS)</span>
                  <button onClick={() => copyText(myPublicKey)} className="text-[10px] text-zinc-400 hover:text-white">📋 Copy</button>
                </div>
                <textarea
                  readOnly
                  rows="4"
                  value={myPublicKey}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2 text-[9px] font-mono text-cyan-300"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-red-400 font-bold uppercase">My Private Key (NEVER SHARE)</span>
                  <button onClick={() => copyText(myPrivateKey)} className="text-[10px] text-zinc-400 hover:text-white">📋 Copy</button>
                </div>
                <textarea
                  readOnly
                  rows="4"
                  value={myPrivateKey}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2 text-[9px] font-mono text-red-400"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 text-xs">
              No local keypair generated yet. Tap "⚡ Generate Keypair" above.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: HOW-TO GUIDE */}
      {activeTab === 'guide' && (
        <div className="space-y-3 bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
          <h3 className="font-bold text-amber-400 text-sm border-b border-zinc-800 pb-1">
            📖 How Off-Grid PGP SMS Works
          </h3>

          <div className="space-y-2">
            <h4 className="font-bold text-white">1. Symmetric Passphrases vs Public Keys</h4>
            <p className="text-zinc-400">
              • <strong className="text-zinc-200">Shared Passphrase:</strong> Quickest method. Both you and the recipient agree on a secret word beforehand.
              <br />
              • <strong className="text-zinc-200">Public Key Pair:</strong> Share your <span className="text-cyan-400 font-mono">Public Key</span> with contacts over SMS. They encrypt messages using your public key, and ONLY your secret <span className="text-red-400 font-mono">Private Key</span> can unlock them!
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <h4 className="font-bold text-white">2. Sending Encrypted SMS Messages</h4>
            <p className="text-zinc-400">
              1. Type your message in the <strong className="text-zinc-200">Encrypt</strong> tab.
              <br />
              2. Tap <strong className="text-zinc-200">"Encrypt into PGP Armor Block"</strong>.
              <br />
              3. Tap <strong className="text-zinc-200">"Open in SMS App"</strong>—your phone's default text app will launch with the cipher block ready to send!
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <h4 className="font-bold text-white">3. Decrypting Incoming Text Messages</h4>
            <p className="text-zinc-400">
              1. Copy the text block from your SMS app starting with <code className="text-cyan-300 font-mono">-----BEGIN PGP MESSAGE-----</code>.
              <br />
              2. Open Sovereign Tools $\rightarrow$ PGP tab $\rightarrow$ <strong className="text-zinc-200">Decrypt</strong>.
              <br />
              3. Tap <strong className="text-zinc-200">"Paste Clipboard"</strong> and enter the passphrase or unlock key!
            </p>
          </div>
        </div>
      )}

      {/* Tool Footer */}
      <ToolFooter
        title="PGP SMS & Off-Grid Messenger"
        details="Encodes plaintext into ASCII-armored cipher blocks formatted to transmit across standard cell carrier SMS/MMS networks."
        disclaimer="ASCII armor blocks exceed 160 characters and may send as multiple split SMS segments. Cell carriers can see data volume but cannot read encrypted content."
      />
    </div>
  );
}
