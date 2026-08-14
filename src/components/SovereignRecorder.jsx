import React, { useState, useEffect, useRef } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { VoiceRecorder } from 'capacitor-voice-recorder';

export function SovereignRecorder({ onNavigate }) {
  const [view, setView] = useState('record');
  const [vaultKey, setVaultKey] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [records, setRecords] = useState([]);
  const [activePlayback, setActivePlayback] = useState({ name: null, url: null });
  const [isDecrypting, setIsDecrypting] = useState(false);
  
  const timerRef = useRef(null);
  const FOLDER_PATH = "Sovereign_Records";

  useEffect(() => {
    initStorage();
  }, []);

  const initStorage = async () => {
    try {
      await Filesystem.mkdir({ path: FOLDER_PATH, directory: Directory.Documents, recursive: true });
    } catch (e) { /* Folder exists */ }
    loadRecords();
  };

  const loadRecords = async () => {
    try {
      const res = await Filesystem.readdir({ path: FOLDER_PATH, directory: Directory.Documents });
      const parsed = res.files.filter(f => f.name.endsWith('.enc')).map(f => ({ name: f.name, path: f.uri || f.path }));
      setRecords(parsed.reverse());
    } catch (e) { console.error("Archive load error", e); }
  };

  const getCryptoKey = async (password) => {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
    return await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: enc.encode("sovereign_salt_99"), iterations: 100000, hash: "SHA-256" },
      keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
  };

  const startRecording = async () => {
    if (!vaultKey) { alert("❌ YOU MUST SET A VAULT KEY FIRST to encrypt the payload."); return; }
    try {
      const hasPerm = await VoiceRecorder.requestAudioRecordingPermission();
      if (!hasPerm.value) { alert("Microphone blocked."); return; }
      await VoiceRecorder.startRecording();
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordTime(prev => prev + 1), 1000);
    } catch (error) { alert("Hardware failure."); }
  };

  const stopRecording = async () => {
    if (isRecording) {
      try {
        const result = await VoiceRecorder.stopRecording();
        setIsRecording(false);
        clearInterval(timerRef.current);
        setRecordTime(0);
        
        const rawBase64 = result.value.recordDataBase64;
        const key = await getCryptoKey(vaultKey);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(rawBase64));
        
        const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encryptedBuffer), iv.length);
        
        let binaryStr = '';
        for (let i = 0; i < combined.byteLength; i++) { binaryStr += String.fromCharCode(combined[i]); }
        const finalPayload = btoa(binaryStr);

        const fileName = `Record_${Date.now()}.enc`;
        await Filesystem.writeFile({ path: `${FOLDER_PATH}/${fileName}`, data: finalPayload, directory: Directory.Documents });
        
        loadRecords();
      } catch(e) { console.error("Encryption/Save Error", e); }
    }
  };

  const unlockAndPlay = async (record) => {
    if (!vaultKey) { alert("❌ Enter your Vault Key to decrypt this file."); return; }
    setIsDecrypting(true);
    try {
      const file = await Filesystem.readFile({ path: `${FOLDER_PATH}/${record.name}`, directory: Directory.Documents });
      const binaryString = atob(file.data);
      const combined = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) { combined[i] = binaryString.charCodeAt(i); }
      
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);
      const key = await getCryptoKey(vaultKey);
      const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ciphertext);
      const base64Audio = new TextDecoder().decode(decryptedBuffer);
      
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/aac' });
      const blobUrl = URL.createObjectURL(blob);
      
      setActivePlayback({ name: record.name, url: blobUrl });
    } catch (e) { alert("❌ Decryption Failed. Incorrect Vault Key."); }
    setIsDecrypting(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4 text-zinc-300 animate-fadeIn bg-black relative">
      <div className="border-b border-rose-900/50 pb-4 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-widest text-rose-500"><span className="text-2xl">🎙️</span> Stealth Recorder</h2>
            <p className="text-[10px] font-mono text-zinc-500">AES-256 GCM Encrypted Storage</p>
          </div>
          <button onClick={() => onNavigate('home')} className="text-zinc-500 hover:text-rose-400 font-bold text-xs bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">EXIT</button>
        </div>
        <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-lg border border-rose-900/30 shadow-inner">
          <span className="text-lg pl-1">🔑</span>
          <input type="password" value={vaultKey} onChange={(e) => setVaultKey(e.target.value)} placeholder="Set Session Vault Key..." className="w-full bg-transparent text-sm font-mono text-rose-400 focus:outline-none placeholder:text-zinc-600" />
        </div>
      </div>

      <div className="flex bg-zinc-950 rounded-xl border border-zinc-800 p-1 shrink-0 shadow-inner">
        <button onClick={() => setView('record')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all ${view === 'record' ? 'bg-rose-900/20 text-rose-500 shadow-md' : 'text-zinc-600 hover:text-zinc-400'}`}>RECORD</button>
        <button onClick={() => setView('archive')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all ${view === 'archive' ? 'bg-rose-900/20 text-rose-500 shadow-md' : 'text-zinc-600 hover:text-zinc-400'}`}>ARCHIVES</button>
      </div>

      {view === 'record' && (
        <div className="flex flex-col items-center justify-center flex-grow gap-10">
          <button onClick={isRecording ? stopRecording : startRecording} className={`w-40 h-40 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all active:scale-95 ${isRecording ? 'border-rose-500 animate-pulse bg-rose-950/30' : 'border-zinc-800 bg-zinc-900'}`}>
            <div className={`transition-all ${isRecording ? 'w-12 h-12 bg-rose-500 rounded-sm' : 'w-16 h-16 bg-rose-700 rounded-full'}`} />
          </button>
          <div className="text-center font-mono text-4xl text-zinc-400 drop-shadow-md">{formatTime(recordTime)}</div>
        </div>
      )}

      {view === 'archive' && (
        <div className="flex flex-col gap-3 flex-grow overflow-y-auto pb-10">
           {records.length === 0 ? (
              <div className="text-center text-xs font-mono text-zinc-600 py-10">No encrypted archives found.</div>
           ) : (
             records.map((rec, idx) => (
                <div key={idx} className="p-4 border border-zinc-800 rounded-xl bg-zinc-950 flex flex-col gap-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-400 truncate pr-4">🔒 {rec.name}</span>
                    <button onClick={() => unlockAndPlay(rec)} className="shrink-0 bg-rose-900/30 text-rose-400 border border-rose-900/50 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase active:scale-95">
                      {isDecrypting && activePlayback.name === rec.name ? 'DECRYPTING...' : 'UNLOCK'}
                    </button>
                  </div>
                  {activePlayback.name === rec.name && activePlayback.url && (
                    <audio controls src={activePlayback.url} className="w-full h-10 custom-audio animate-fadeIn mt-2" autoPlay />
                  )}
                </div>
             ))
           )}
        </div>
      )}
    </div>
  );
}

export default SovereignRecorder;
