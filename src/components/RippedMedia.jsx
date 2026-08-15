import React, { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';

export function RippedMedia({ onNavigate }) {
  const [vaultKey, setVaultKey] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [files, setFiles] = useState([]);
  const [activeMedia, setActiveMedia] = useState(null);

  // Core Cryptographic Engine (Matches Stealth Browser)
  const getCryptoKey = async (password) => {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
    return await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: enc.encode("sovereign_salt_99"), iterations: 100000, hash: "SHA-256" },
      keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
  };

  const unlockVault = async () => {
    if (!vaultKey) { alert("❌ Enter your Vault Key."); return; }
    
    try {
      // Ensure the hidden media directory exists
      try {
        await Filesystem.mkdir({ path: 'sovereign_media', directory: Directory.Data, recursive: true });
      } catch (e) { /* Directory already exists */ }
      
      await fetchFiles();
      setIsUnlocked(true);
    } catch (error) {
      alert("❌ Failed to initialize secure storage.");
    }
  };

  const fetchFiles = async () => {
    try {
      const result = await Filesystem.readdir({ path: 'sovereign_media', directory: Directory.Data });
      // Capacitor 5 returns objects, fallback to strings if older version
      const fileNames = result.files.map(f => f.name || f);
      setFiles(fileNames);
    } catch (error) {
      console.error("Failed to read directory", error);
    }
  };

  const playMedia = async (fileName) => {
    try {
      // 1. Read the encrypted Base64 string from the disk
      const { data } = await Filesystem.readFile({ path: `sovereign_media/${fileName}`, directory: Directory.Data });
      
      // 2. Convert Base64 back to raw binary
      const binaryString = atob(data);
      const combined = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) { combined[i] = binaryString.charCodeAt(i); }
      
      // 3. Extract Initialization Vector and Ciphertext
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);
      const key = await getCryptoKey(vaultKey);
      
      // 4. Decrypt in RAM (Never writes decrypted file to disk)
      const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ciphertext);
      
      // 5. Determine Mime Type and create Ephemeral Blob URL
      const ext = fileName.split('.').pop().toLowerCase();
      const mime = ext === 'mp3' ? 'audio/mpeg' : 'video/mp4'; 
      
      const blob = new Blob([decryptedBuffer], { type: mime });
      const url = URL.createObjectURL(blob);
      
      setActiveMedia({ name: fileName, url: url, type: mime });
    } catch (error) {
      alert("❌ Decryption Failed. Corrupt file or incorrect Vault Key.");
    }
  };

  const closePlayer = () => {
    if (activeMedia) {
      URL.revokeObjectURL(activeMedia.url); // Immediately destroy the blob in RAM
      setActiveMedia(null);
    }
  };

  const deleteFile = async (fileName) => {
    if (window.confirm(`Permanently eradicate ${fileName}?`)) {
      try {
        await Filesystem.deleteFile({ path: `sovereign_media/${fileName}`, directory: Directory.Data });
        fetchFiles();
      } catch (error) {
        alert("❌ Failed to delete file.");
      }
    }
  };

  // Cleanup blob from memory if component unmounts unexpectedly
  useEffect(() => {
    return () => {
      if (activeMedia) URL.revokeObjectURL(activeMedia.url);
    };
  }, [activeMedia]);

  return (
    <div className="flex flex-col h-full bg-black text-zinc-300 animate-fadeIn relative">
      <div className="bg-zinc-950 border-b border-zinc-800 shrink-0 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2 text-zinc-100"><span className="text-2xl">🗄️</span> Ripped Media</h2>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">AES-256 Encrypted Vault</p>
        </div>
        <button onClick={() => onNavigate('home')} className="text-zinc-500 hover:text-cyan-400 font-bold text-xs bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">EXIT</button>
      </div>

      {!isUnlocked ? (
        <div className="p-6 flex flex-col items-center justify-center h-full gap-4">
           <div className="text-6xl mb-4">🔒</div>
           <p className="text-xs font-mono text-zinc-500 text-center max-w-xs">All intercepted media is encrypted on the disk. Enter your Session Vault Key to decrypt files into volatile memory.</p>
           <div className="flex gap-2 w-full max-w-sm mt-4">
             <input type="password" value={vaultKey} onChange={(e) => setVaultKey(e.target.value)} placeholder="Session Vault Key..." className="flex-grow bg-black border border-cyan-900/50 rounded-lg px-4 py-3 text-sm font-mono text-cyan-400 focus:outline-none focus:border-cyan-500 shadow-inner" />
             <button onClick={unlockVault} className="bg-cyan-900/30 text-cyan-400 border border-cyan-900/50 px-5 rounded-lg text-xs font-bold tracking-widest uppercase active:scale-95">UNLOCK</button>
           </div>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-3 flex-grow overflow-y-auto">
          {files.length === 0 ? (
            <div className="text-center text-xs font-mono text-zinc-600 py-10 uppercase tracking-widest">Vault is empty.</div>
          ) : (
            files.map((file, idx) => (
              <div key={idx} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between shadow-md">
                 <div className="truncate pr-4 flex-grow cursor-pointer" onClick={() => playMedia(file)}>
                    <span className="text-sm font-mono text-cyan-400">{file}</span>
                    <p className="text-[10px] text-zinc-600 mt-1">Encrypted Binary Payload</p>
                 </div>
                 <button onClick={() => deleteFile(file)} className="text-red-500 bg-red-950/30 px-3 py-2 rounded border border-red-900/50 text-[10px] font-black uppercase tracking-widest active:scale-95">DELETE</button>
              </div>
            ))
          )}
        </div>
      )}

      {/* EPHEMERAL MEDIA PLAYER MODAL */}
      {activeMedia && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col animate-fadeIn">
           <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <span className="text-xs font-mono text-cyan-500 truncate pr-4">{activeMedia.name}</span>
              <button onClick={closePlayer} className="text-red-500 font-bold text-xs bg-red-950/30 px-4 py-2 rounded-lg border border-red-900/50">CLOSE & WIPE RAM</button>
           </div>
           <div className="flex-grow flex items-center justify-center p-4">
              {activeMedia.type.includes('video') ? (
                 <video src={activeMedia.url} controls autoPlay className="max-w-full max-h-full rounded-lg shadow-2xl border border-zinc-800" controlsList="nodownload" />
              ) : (
                 <audio src={activeMedia.url} controls autoPlay className="w-full" controlsList="nodownload" />
              )}
           </div>
        </div>
      )}
    </div>
  );
}

export default RippedMedia;
