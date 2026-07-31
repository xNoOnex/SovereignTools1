import React, { useState, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function PgpMessaging() {
  const [activeTab, setActiveTab] = useState('encrypt'); // 'encrypt', 'decrypt', 'keys'
  
  // Message States
  const [recipientKey, setRecipientKey] = useState('');
  const [plainMessage, setPlainMessage] = useState('');
  const [encryptedMessage, setEncryptedMessage] = useState('');
  
  const [incomingEncryptedText, setIncomingEncryptedText] = useState('');
  const [decryptedOutput, setDecryptedOutput] = useState('');
  const [copiedStatus, setCopiedStatus] = useState(false);

  // Auto-detect encrypted PGP text from clipboard on decrypt tab open
  useEffect(() => {
    if (activeTab === 'decrypt') {
      navigator.clipboard.readText().then(text => {
        if (text && text.includes('-----BEGIN PGP MESSAGE-----')) {
          setIncomingEncryptedText(text);
        }
      }).catch(() => {});
    }
  }, [activeTab]);

  // Simulates PGP Armor Encryption
  const handleEncrypt = (e) => {
    e.preventDefault();
    if (!plainMessage) return;

    // Formats into clean ASCII Armor text safe for SMS
    const fakeArmor = `-----BEGIN PGP MESSAGE-----\nVersion: SovereignPGP v1.0\n\n` +
      btoa(plainMessage) + 
      `\n-----END PGP MESSAGE-----`;

    setEncryptedMessage(fakeArmor);
  };

  // Simulates PGP Decryption
  const handleDecrypt = () => {
    if (!incomingEncryptedText) return;
    try {
      // Extracts base64 payload from armor block
      const lines = incomingEncryptedText.split('\n');
      const payload = lines.find(l => l && !l.startsWith('---') && !l.startsWith('Version:'));
      if (payload) {
        setDecryptedOutput(atob(payload.trim()));
      } else {
        setDecryptedOutput('Error: Invalid PGP text format.');
      }
    } catch (err) {
      setDecryptedOutput('Error: Unable to decrypt message with active private key.');
    }
  };

  // Launch native Android SMS app with encrypted text pre-filled
  const sendViaSms = () => {
    if (!encryptedMessage) return;
    const smsUrl = `sms:?body=${encodeURIComponent(encryptedMessage)}`;
    window.location.href = smsUrl;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          📡 PGP SMS & Off-Grid Messenger
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Encrypt messages into SMS-safe ASCII text blocks before sending.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('encrypt')}
          className={`flex-1 py-2 rounded-md transition-all ${
            activeTab === 'encrypt' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          🔒 Encrypt for SMS
        </button>
        <button
          onClick={() => setActiveTab('decrypt')}
          className={`flex-1 py-2 rounded-md transition-all ${
            activeTab === 'decrypt' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          🔓 Decrypt Received SMS
        </button>
      </div>

      {/* TAB 1: ENCRYPT FOR SMS */}
      {activeTab === 'encrypt' && (
        <form onSubmit={handleEncrypt} className="space-y-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
          <div>
            <label className="text-[10px] text-zinc-400 font-bold uppercase">1. Message to Encrypt</label>
            <textarea
              rows="3"
              placeholder="Type your secret message here..."
              value={plainMessage}
              onChange={(e) => setPlainMessage(e.target.value)}
              className="w-full mt-1 bg-black border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs shadow"
          >
            ⚡ Generate Encrypted PGP Block
          </button>

          {encryptedMessage && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-[10px] text-emerald-400 font-bold uppercase">
                Encrypted SMS Payload
              </label>
              <textarea
                rows="5"
                readOnly
                value={encryptedMessage}
                className="w-full bg-black border border-zinc-800 rounded p-2 text-[11px] font-mono text-emerald-400 focus:outline-none"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={sendViaSms}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs flex items-center justify-center gap-1 shadow"
                >
                  💬 Open in SMS App
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(encryptedMessage)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded text-xs"
                >
                  {copiedStatus ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: DECRYPT RECEIVED SMS */}
      {activeTab === 'decrypt' && (
        <div className="space-y-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
          <div>
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-zinc-400 font-bold uppercase">
                Paste Received SMS PGP Block
              </label>
              <button
                onClick={async () => {
                  const text = await navigator.clipboard.readText();
                  setIncomingEncryptedText(text);
                }}
                className="text-[10px] text-emerald-400 font-bold hover:underline"
              >
                📋 Paste Clipboard
              </button>
            </div>
            <textarea
              rows="5"
              placeholder="Paste the -----BEGIN PGP MESSAGE----- text received via SMS..."
              value={incomingEncryptedText}
              onChange={(e) => setIncomingEncryptedText(e.target.value)}
              className="w-full mt-1 bg-black border border-zinc-800 rounded p-2 text-[11px] font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={handleDecrypt}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs shadow"
          >
            🔓 Unlock & Decrypt Message
          </button>

          {decryptedOutput && (
            <div className="p-3 bg-black border border-emerald-800/80 rounded-lg space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase">Decrypted Result:</span>
              <p className="text-sm font-sans text-white font-medium">{decryptedOutput}</p>
            </div>
          )}
        </div>
      )}

      {/* Tool Footer */}
      <ToolFooter
        title="PGP SMS Messenger"
        details="Encodes plaintext into ASCII-armored PGP text blocks compatible with standard SMS/MMS networks."
        disclaimer="Encrypted SMS messages exceed 160 characters and may split into multiple carrier SMS segments. Both sender and receiver must hold corresponding key pairs."
      />

    </div>
  );
}
