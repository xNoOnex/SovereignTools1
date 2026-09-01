import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export function DataUtils({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('SHA-256');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const tabs = ['SHA-256', 'BASE64 ENC', 'BASE64 DEC', 'HEX ENC', 'HEX DEC', 'UUID', 'FILE ENC', 'FILE DEC'];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setInputText('');
    setOutputText('');
    setSelectedFile(null);
    setPassphrase('');
  };

  const processText = () => {
    if (!inputText && activeTab !== 'UUID') return;
    
    try {
      let result = '';
      switch (activeTab) {
        case 'SHA-256':
          result = CryptoJS.SHA256(inputText).toString(CryptoJS.enc.Hex);
          break;
        case 'BASE64 ENC':
          result = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(inputText));
          break;
        case 'BASE64 DEC':
          result = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(inputText));
          break;
        case 'HEX ENC':
          result = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(inputText));
          break;
        case 'HEX DEC':
          result = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Hex.parse(inputText));
          break;
        case 'UUID':
          result = crypto.randomUUID();
          break;
        default:
          break;
      }
      setOutputText(result);
    } catch (e) {
      setOutputText('ERROR: Invalid input or encoding format.');
    }
  };

  const processFile = async () => {
    if (!selectedFile || !passphrase) return alert("File and Passphrase required.");
    setIsProcessing(true);

    try {
      if (activeTab === 'FILE ENC') {
        // 1. Read file to Base64
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
          reader.readAsDataURL(selectedFile);
        });

        // 2. Package metadata and data
        const payload = JSON.stringify({
          name: selectedFile.name,
          type: selectedFile.type,
          data: base64Data
        });

        // 3. Encrypt the entire package
        const encrypted = CryptoJS.AES.encrypt(payload, passphrase).toString();

        // 4. Write to public Documents folder
        const outName = `${selectedFile.name}.aes`;
        await Filesystem.writeFile({
          path: outName,
          data: encrypted,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });

        setOutputText(`✅ SUCCESS: File encrypted.\n\nSaved to your device's Documents folder as:\n${outName}\n\nYou can now safely delete the original unencrypted file from your device.`);
      } 
      
      else if (activeTab === 'FILE DEC') {
        // 1. Read the .aes text file
        const textData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
          reader.readAsText(selectedFile);
        });

        // 2. Decrypt it
        const bytes = CryptoJS.AES.decrypt(textData, passphrase);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedStr) throw new Error("Incorrect passphrase or corrupted file.");

        // 3. Parse the original wrapper
        const parsed = JSON.parse(decryptedStr);

        // 4. Convert Base64 back to Blob
        const response = await fetch(parsed.data);
        const blob = await response.blob();

        // 5. Read blob as base64 for Filesystem API (Filesystem requires base64 string without the prefix)
        const pureBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        });

        // 6. Write the original file back to Documents
        const outName = `decrypted_${parsed.name}`;
        await Filesystem.writeFile({
          path: outName,
          data: pureBase64,
          directory: Directory.Documents
        });

        setOutputText(`✅ SUCCESS: File decrypted.\n\nRestored to your device's Documents folder as:\n${outName}`);
      }
    } catch (e) {
      console.error(e);
      setOutputText(`❌ ERROR: ${e.message || "Cryptographic operation failed."}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-5 pb-24 font-sans select-none overflow-y-auto animate-fadeIn">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-zinc-900 pb-4 pt-2">
        <div>
          <h1 className="text-xl font-bold tracking-wide flex items-center gap-2">
            <span className="text-red-500 text-2xl">🧰</span> Data Utilities
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Offline Hash & Encoding Engine</p>
        </div>
        <button onClick={() => onNavigate('home')} className="bg-zinc-900 border border-zinc-700 text-xs font-bold px-4 py-2 rounded-full hover:border-white transition-all active:scale-95">
          Exit
        </button>
      </div>

      {/* Scrolling Tab Bar */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all shrink-0 ${
              activeTab === tab 
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                : 'bg-zinc-900/50 text-zinc-500 border border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dynamic Input Area */}
      <div className="space-y-6">
        
        {/* TEXT INPUT MODES */}
        {!['FILE ENC', 'FILE DEC'].includes(activeTab) && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase ml-1">Raw Payload</label>
            <textarea 
              placeholder={activeTab === 'UUID' ? "No input required. Tap execute." : "Enter string to process..."}
              disabled={activeTab === 'UUID'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 font-mono text-sm text-zinc-300 focus:outline-none focus:border-cyan-500 transition-colors resize-none shadow-inner"
            />
          </div>
        )}

        {/* FILE INPUT MODES */}
        {['FILE ENC', 'FILE DEC'].includes(activeTab) && (
          <div className="space-y-4 bg-zinc-950 p-5 rounded-3xl border border-zinc-800 shadow-xl">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-cyan-500 tracking-widest uppercase ml-1">1. Select Payload</label>
              <input 
                type="file" 
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full text-xs text-zinc-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer"
              />
              {selectedFile && <p className="text-[10px] text-zinc-500 font-mono pl-1">Target: {selectedFile.name}</p>}
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-900">
              <label className="text-[10px] font-bold text-amber-500 tracking-widest uppercase ml-1">2. AES-256 Passphrase</label>
              <input 
                type="password"
                placeholder="Enter encryption key..."
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-sm font-mono text-amber-500 focus:outline-none focus:border-amber-500 tracking-widest"
              />
            </div>
          </div>
        )}

        {/* Execute Button */}
        <button 
          onClick={['FILE ENC', 'FILE DEC'].includes(activeTab) ? processFile : processText}
          disabled={isProcessing}
          className={`w-full font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
            isProcessing 
              ? 'bg-cyan-900 text-cyan-500 cursor-wait' 
              : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.2)]'
          }`}
        >
          {isProcessing ? (
            <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span> Crunching...</>
          ) : (
            <>⚡ Execute Operation</>
          )}
        </button>

        {/* Output Area */}
        <div className="space-y-2 pb-10">
          <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase ml-1">Generated Output</label>
          <textarea 
            readOnly
            value={outputText}
            placeholder="Awaiting execution..."
            className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 font-mono text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors resize-none shadow-inner select-all"
          />
          {outputText && !['FILE ENC', 'FILE DEC'].includes(activeTab) && (
            <button 
              onClick={() => {
                navigator.clipboard.writeText(outputText);
                alert("Copied to clipboard.");
              }}
              className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest hover:text-cyan-400 ml-1"
            >
              📋 Copy to Clipboard
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
