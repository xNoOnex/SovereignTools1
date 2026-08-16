import { Filesystem, Directory } from '@capacitor/filesystem';
import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';
const StealthBrowser = registerPlugin('StealthBrowser');

export function SovereignBrowser({ onNavigate }) {
  const [address, setAddress] = useState('https://');
  const [showSettings, setShowSettings] = useState(false);
  
  // Security & Proxy State (RESTORED!)
  const [autoNuke, setAutoNuke] = useState(true);
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [proxyHost, setProxyHost] = useState('127.0.0.1');
  const [proxyPort, setProxyPort] = useState('9050');
  
  // AES-256 Vault State
  const [vaultKey, setVaultKey] = useState('');
  const [bookmarks, setBookmarks] = useState([]);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const getCryptoKey = async (password) => {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
    return await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: enc.encode("sovereign_salt_99"), iterations: 100000, hash: "SHA-256" },
      keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
  };

  const unlockVault = async () => {
    if (!vaultKey) { alert("❌ Enter a Vault Key."); return; }
    if (localStorage.getItem('sovereign_bookmarks')) {
       localStorage.removeItem('sovereign_bookmarks');
    }

    try {
      const savedEnc = localStorage.getItem('sovereign_bookmarks_enc');
      if (!savedEnc) { setIsUnlocked(true); return; }
      
      const binaryString = atob(savedEnc);
      const combined = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) { combined[i] = binaryString.charCodeAt(i); }
      
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);
      const key = await getCryptoKey(vaultKey);
      
      const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ciphertext);
      const decStr = new TextDecoder().decode(decryptedBuffer);
      setBookmarks(JSON.parse(decStr));
      setIsUnlocked(true);
    } catch (e) {
      alert("❌ Decryption Failed. Incorrect Vault Key.");
    }
  };

  const saveEncryptedBookmarks = async (newBookmarks) => {
    try {
      const dataStr = JSON.stringify(newBookmarks);
      const key = await getCryptoKey(vaultKey);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const enc = new TextEncoder();
      const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(dataStr));
      
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      let binaryStr = '';
      for (let i = 0; i < combined.byteLength; i++) { binaryStr += String.fromCharCode(combined[i]); }
      localStorage.setItem('sovereign_bookmarks_enc', btoa(binaryStr));
    } catch(e) { console.error("Encryption failed", e); }
  };

  const toggleBookmark = async () => {
    if (!isUnlocked) { alert("❌ Unlock vault first."); return; }
    let updated = bookmarks.includes(address) ? bookmarks.filter(b => b !== address) : [...bookmarks, address];
    setBookmarks(updated);
    await saveEncryptedBookmarks(updated);
  };

  
  useEffect(() => {
    const listener = StealthBrowser.addListener('onMediaDetected', async (info) => {
        if (window.confirm(`🚨 TARGET STREAM ACQUIRED! 🚨\n\nURL: ${info.url.substring(0, 50)}...\n\nExecute ripping sequence to Encrypted Vault?`)) {
            
        try {
            if (!vaultKey) {
                alert("❌ Vault is Locked. Enter Session Vault Key first.");
                return;
            }
            
            alert("⬇️ Intercepting target stream into volatile RAM...");
            
            // Fetch the raw video file
            const res = await fetch(info.url);
            const arrayBuffer = await res.arrayBuffer();
            
            alert("🔐 Encrypting payload with AES-256-GCM...");
            
            // Encrypt the payload using the current vault key
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const key = await getCryptoKey(vaultKey);
            const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, arrayBuffer);
            
            // Combine IV and Ciphertext
            const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(encryptedBuffer), iv.length);
            
            // Fast convert to Base64 to save to disk
            const reader = new FileReader();
            reader.onloadend = async () => {
                const b64 = reader.result.split(',')[1];
                const ext = info.url.includes('.webm') ? 'webm' : (info.url.includes('.mp3') ? 'mp3' : 'mp4');
                const fName = `rip_${Date.now()}.${ext}`;
                
                try { 
                    await Filesystem.mkdir({ path: 'sovereign_media', directory: Directory.Data, recursive: true }); 
                } catch(e) { /* Directory exists */ }
                
                await Filesystem.writeFile({ 
                    path: `sovereign_media/${fName}`, 
                    data: b64, 
                    directory: Directory.Data 
                });
                
                alert("✅ Target Neutralized & Vaulted!\nFile encrypted safely on disk.");
            };
            reader.readAsDataURL(new Blob([combined]));
            
        } catch(e) {
            alert("❌ Extraction Failed: " + e.message);
        }
    
        }
    });
    return () => {
        if (listener && listener.remove) listener.remove();
    };
  }, [vaultKey]);

  const handleNavigate = async (targetUrl = address) => {
    let finalUrl = targetUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    setAddress(finalUrl);
    setShowSettings(false);
    
    try {
      // Because proxy variables exist again, this will no longer crash!
      await StealthBrowser.openNative({ 
        url: finalUrl, 
        autoNuke: autoNuke,
        proxyHost: proxyEnabled ? proxyHost : "", 
        proxyPort: proxyEnabled ? parseInt(proxyPort) : 0 
      });
    } catch (error) {
      alert("Native Engine Error: " + error.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-zinc-300 animate-fadeIn relative">
      <div className="bg-zinc-950 border-b border-zinc-800 shrink-0 p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2 text-zinc-100"><span className="text-2xl">🌐</span> Stealth Browser</h2>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Standalone WebKit Engine</p>
          </div>
          <button onClick={() => onNavigate('home')} className="text-zinc-500 hover:text-cyan-400 font-bold text-xs bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">EXIT</button>
        </div>
        
        {!isUnlocked ? (
          <div className="flex items-center gap-2 bg-black p-2 rounded-lg border border-cyan-900/50 shadow-inner animate-fadeIn">
            <span className="text-lg pl-1">🔑</span>
            <input type="password" value={vaultKey} onChange={(e) => setVaultKey(e.target.value)} placeholder="Set Session Vault Key..." className="flex-grow bg-transparent text-sm font-mono text-cyan-400 focus:outline-none placeholder:text-zinc-600" />
            <button onClick={unlockVault} className="bg-cyan-900/30 text-cyan-400 border border-cyan-900/50 px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase active:scale-95">UNLOCK</button>
          </div>
        ) : (
          <div className="flex gap-2 relative animate-fadeIn">
            <button onClick={() => setShowSettings(!showSettings)} className={`px-3 rounded-md border transition-all flex items-center justify-center ${showSettings ? 'bg-cyan-900 border-cyan-500 text-cyan-400' : 'bg-zinc-900 border-zinc-700 text-zinc-400'}`}>⚙️</button>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleNavigate()} placeholder="Enter web address..." className="flex-grow bg-black border border-zinc-700 rounded-md px-3 py-3 text-sm font-mono text-zinc-300 focus:outline-none focus:border-cyan-500" />
            <button onClick={() => handleNavigate()} className="px-3 rounded-md bg-cyan-900/30 border border-cyan-900/50 text-cyan-400 font-bold text-xs tracking-widest active:scale-95 transition-all">GO</button>
            <button onClick={toggleBookmark} className={`px-3 rounded-md border transition-all flex items-center justify-center text-lg ${bookmarks.includes(address) ? 'bg-amber-900/30 border-amber-500 text-amber-400' : 'bg-zinc-900 border-zinc-700 text-zinc-600 hover:text-amber-500'}`}>★</button>
          </div>
        )}
      </div>

      {showSettings && isUnlocked && (
        <div className="absolute top-[160px] left-3 right-3 bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-2xl z-50 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">🔥 Auto-Nuke Session on Close</span>
            <input type="checkbox" checked={autoNuke} onChange={() => setAutoNuke(!autoNuke)} className="w-5 h-5 accent-rose-600" />
          </div>
          <div className="h-px bg-zinc-800 w-full" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">🕵️ Route via SOCKS5 Proxy</span>
              <input type="checkbox" checked={proxyEnabled} onChange={() => setProxyEnabled(!proxyEnabled)} className="w-5 h-5 accent-cyan-500" />
            </div>
            {proxyEnabled && (
              <div className="flex gap-2 mt-2">
                <input type="text" value={proxyHost} onChange={(e) => setProxyHost(e.target.value)} className="w-2/3 bg-black border border-zinc-700 rounded-md px-3 py-2 text-xs font-mono text-zinc-300" placeholder="Host IP (e.g. 127.0.0.1)" />
                <input type="text" value={proxyPort} onChange={(e) => setProxyPort(e.target.value)} className="w-1/3 bg-black border border-zinc-700 rounded-md px-3 py-2 text-xs font-mono text-zinc-300" placeholder="Port" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 flex-grow overflow-y-auto">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Vaulted Locations</h3>
        {!isUnlocked ? (
          <div className="text-center text-xs font-mono text-zinc-600 py-10">Vault is locked.</div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center text-xs font-mono text-zinc-600 py-10">No secure bookmarks saved.</div>
        ) : (
          bookmarks.map((bm, idx) => (
            <div key={idx} onClick={() => { setAddress(bm); handleNavigate(bm); }} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-mono text-cyan-400 truncate cursor-pointer hover:border-cyan-500 active:scale-95 transition-all shadow-md">{bm}</div>
          ))
        )}
      </div>
    </div>
  );
}

export default SovereignBrowser;
