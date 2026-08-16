import { useSecureStorage } from '../hooks/useSecureStorage';
import React, { useState } from 'react';

export function LockScreen({ onUnlock }) {
  const [pinEntry, setPinEntry] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  
  const [savedPin] = useSecureStorage("sovereign_pin", "0000");
  const [duressPin] = useSecureStorage("sovereign_duress_pin", null);
  const [decoyPin] = useSecureStorage("sovereign_decoy_pin", null);
  const [limit] = useSecureStorage("sovereign_wipe_limit", "None");
  const [failedAttempts, setFailedAttempts] = useSecureStorage("sovereign_failed_attempts", "0");
  const [, setSessionMode] = useSecureStorage("sovereign_session_mode", "");


  const executeProtocol = async () => {
    // 1. Shred Vault Encryption Keys
    for(let i=0; i<localStorage.length; i++) {
        let k = localStorage.key(i);
        if(k && k.startsWith("sec_")) localStorage.setItem(k, window.crypto.getRandomValues(new Uint32Array(1))[0].toString(16));
    }
    localStorage.clear();
    sessionStorage.clear();
    
    // 2. Annihilate IndexedDB (Heavy Files)
    try {
        if (window.indexedDB && window.indexedDB.databases) {
            const dbs = await window.indexedDB.databases();
            for (let db of dbs) { window.indexedDB.deleteDatabase(db.name); }
        }
    } catch(e) {}
    
    // 3. Inject Kernel Panic
    document.body.innerHTML = "<div style='background:black;color:#00ff00;height:100vh;padding:20px;font-family:monospace;font-size:12px;z-index:9999;position:fixed;top:0;left:0;width:100%;overflow:hidden;'>Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)<br/>CPU: 0 PID: 1 Comm: init Not tainted Sovereign-OS<br/>Hardware name: Secure Enclave<br/>Call Trace:<br/> dump_stack+0x5c/0x7c<br/> panic+0x101/0x2c3<br/>---[ end Kernel panic - not syncing: Fatal exception ]---<br/><br/>[!] SHREDDING SECURE VOLUMES... DONE.<br/>[!] CRYPTOGRAPHIC KEYS PURGED.<br/>[!] SYSTEM HALTED.</div>";
    
    setTimeout(() => { window.location.reload(); }, 5000);
  };

  const handleKeyPress = (num) => {
    if (pinEntry.length < 15) {
      const newStr = pinEntry + num;
      setPinEntry(newStr);

      const mPin = (savedPin && savedPin !== "null") ? String(savedPin).trim() : "1234";
      const dPin = (duressPin && duressPin !== "null") ? String(duressPin).trim() : null;
      const cPin = (decoyPin && decoyPin !== "null") ? String(decoyPin).trim() : null;

      if (newStr === mPin) {
        setSessionMode("ARMED");
        localStorage.setItem("RAW_SESSION_STATE", "ARMED");
        setFailedAttempts("0");
        onUnlock();
        return;
      }
      if (dPin && newStr === dPin) {
        executeProtocol();
        return;
      }
      if (cPin && newStr === cPin) {
        setSessionMode("DECOY");
        localStorage.setItem("RAW_SESSION_STATE", "DECOY");
        setFailedAttempts("0");
        onUnlock();
        return;
      }

      const l1 = mPin.length;
      const l2 = dPin ? dPin.length : 0;
      const l3 = cPin ? cPin.length : 0;
      const maxLen = Math.max(l1, l2, l3);

      if (newStr.length >= maxLen) {
        let attempts = parseInt(failedAttempts || "0") + 1;
        setFailedAttempts(attempts.toString());
        
        if (limit && limit !== "None" && attempts >= parseInt(limit)) {
            executeProtocol();
            return;
        }
        
        setErrorShake(true);
        setTimeout(() => { setPinEntry(""); setErrorShake(false); }, 400);
      }
    }
  };

  return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-between p-8 font-sans select-none relative overflow-hidden" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.95)), url("/app_icon.jpg")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
    
    
      
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: "var(--bg-image)", backgroundSize: "var(--bg-size)", backgroundPosition: 'center', filter: 'contrast(1.5)' }}></div>

      {/* Terminal Header */}
      <div className="flex flex-col items-center mt-12 space-y-5 z-10 w-full animate-fadeIn">
        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-[0_0_30px_var(--glass-border)] border border-[var(--accent-text)] bg-black p-1">
          <img src="/Appicon.jpg" alt="Logo" className="w-full h-full object-cover rounded-xl opacity-90" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-[0.2em] theme-accent-text uppercase">SOVEREIGN</h1>
          <div className="inline-block bg-[var(--glass-bg)] border border-[var(--glass-border)] px-4 py-1 rounded-full">
            <p className="text-[10px] font-mono text-zinc-300 tracking-[0.4em] uppercase">Auth Required</p>
          </div>
        </div>
      </div>

      {/* Cyber PIN Pad */}
      <div className="flex flex-col items-center z-10 w-full max-w-[280px]">
        <div className={`flex gap-5 mb-10 ${errorShake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-sm border transition-all duration-200 ${i < pinEntry.length ? 'theme-accent-bg border-transparent scale-110 rotate-45' : 'border-zinc-700 bg-transparent rotate-45'}`} />
          ))}
        </div>
        
        <div className="grid grid-cols-3 gap-5 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} onClick={() => handleKeyPress(num.toString())} className="h-16 theme-glass-panel hover:bg-[var(--glass-border)] rounded-xl text-2xl font-mono font-bold text-white active:scale-95 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]">
              {num}
            </button>
          ))}
          <button onClick={() => setPinEntry('')} className="h-16 bg-black/40 border border-zinc-800 hover:border-red-900 rounded-xl text-xs font-bold text-red-500 active:scale-95 transition-all uppercase tracking-widest">
            CLR
          </button>
          <button onClick={() => handleKeyPress('0')} className="h-16 theme-glass-panel hover:bg-[var(--glass-border)] rounded-xl text-2xl font-mono font-bold text-white active:scale-95 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            0
          </button>
          <button onClick={() => setPinEntry(prev => prev.slice(0, -1))} className="h-16 bg-black/40 border border-zinc-800 hover:border-[var(--accent-text)] rounded-xl text-xl font-bold text-zinc-400 active:scale-95 transition-all flex items-center justify-center">
            ⌫
          </button>
        </div>
      </div>

      <div className="z-10 w-full flex flex-col items-center pb-6">
        <button onClick={() => setShowInfo(!showInfo)} className="text-[9px] uppercase font-mono font-bold text-zinc-500 hover:theme-accent-text px-4 py-2 transition-colors tracking-[0.2em]">
          {showInfo ? 'CLOSE PROTOCOL' : 'VIEW SECURE PROTOCOL'}
        </button>
        {showInfo && (
          <div className="absolute bottom-24 left-6 right-6 theme-glass-panel backdrop-blur-xl p-6 rounded-2xl shadow-2xl animate-fadeIn text-center border-l-4 border-l-[var(--accent-text)]">
            <h3 className="text-[11px] font-black theme-accent-text uppercase tracking-widest mb-3">Strict Offline Mode</h3>
            <p className="text-[10px] text-zinc-300 font-mono leading-relaxed text-justify">
              This terminal is disconnected from telemetry networks. Cryptographic keys are confined to the local hardware enclave. Unauthorized access attempts are logged locally.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
