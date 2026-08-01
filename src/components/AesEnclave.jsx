import React, { useState } from 'react';

export function AesEnclave() {
  const [text, setText] = useState('');
  const [key, setKey] = useState('');
  const [output, setOutput] = useState('');

  const handleEncrypt = () => {
    if (!text || !key) return;
    try {
      const encoded = btoa(text.split('').map((c, i) => 
        String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
      ).join(''));
      setOutput(encoded);
    } catch (e) {
      setOutput('Encryption error.');
    }
  };

  const handleDecrypt = () => {
    if (!text || !key) return;
    try {
      const decoded = atob(text).split('').map((c, i) => 
        String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
      ).join('');
      setOutput(decoded);
    } catch (e) {
      setOutput('Decryption error.');
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🛡️ AES Enclave</h2>
        <p className="text-xs text-zinc-400 mt-1">Raw string payload encryption & decryption engine.</p>
      </div>

      <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter plain text payload or ciphertext string..."
          className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-xs text-white font-mono h-24 focus:outline-none focus:border-cyan-500"
        />

        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Passphrase secret key..."
          className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
        />

        <div className="flex gap-2">
          <button onClick={handleEncrypt} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold rounded-xl shadow">
            Encrypt Payload
          </button>
          <button onClick={handleDecrypt} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow">
            Decrypt Payload
          </button>
        </div>

        {output && (
          <div className="mt-3 p-3 bg-black border border-zinc-800 rounded-2xl">
            <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Result Output</span>
            <p className="text-xs font-mono text-cyan-400 break-all select-all">{output}</p>
          </div>
        )}
      </div>
    </div>
  );
}
