import React from 'react';

// Custom Tech SVGs for the dashboard
const IconMap = {
  calc: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  calendar: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  ai: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
  debloat: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  comms: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>,
  aes: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  shred: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  netsec: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  camera: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  gallery: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  vault: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  audio: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>,
  docs: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  fileviewer: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
};

export function Home({ onNavigate, appMode }) {
  const tools = [
    { id: 'camera', label: 'Camera', desc: 'EXIF-Free & QR', icon: IconMap.camera, reqExpert: false },
    { id: 'gallery', label: 'Gallery', desc: 'Encrypted Media', icon: IconMap.gallery, reqExpert: false },
    { id: 'vault', label: 'Vault', desc: 'AES-256 Storage', icon: IconMap.vault, reqExpert: false },
    { id: 'audio', label: 'Audio', desc: 'Offline Player', icon: IconMap.audio, reqExpert: false },
    { id: 'docs', label: 'Docs', desc: 'Encrypted Notes', icon: IconMap.docs, reqExpert: false },
    { id: 'fileviewer', label: 'Files', desc: 'Universal Viewer', icon: IconMap.fileviewer, reqExpert: false },
    { id: 'calc', label: 'Calc', desc: 'Multi-Calculator', icon: IconMap.calc, reqExpert: false },
    { id: 'calendar', label: 'Calendar', desc: 'Zero Telemetry', icon: IconMap.calendar, reqExpert: false },
    { id: 'comms', label: 'Comms', desc: 'P2P Mesh Relay', icon: IconMap.comms, reqExpert: true },
    { id: 'netsec', label: 'Net/Sys', desc: 'SysOps & Auditor', icon: IconMap.netsec, reqExpert: true },
    { id: 'debloat', label: 'Debloat', desc: 'Telemetry Purge', icon: IconMap.debloat, reqExpert: true },
    { id: 'shred', label: 'Shred', desc: 'Sector Zero-Fill', icon: IconMap.shred, reqExpert: true },
    { id: 'aes', label: 'Cipher', desc: 'String Encryption', icon: IconMap.aes, reqExpert: true },
    { id: 'ai', label: 'AI Engine', desc: 'Smart Local AI', icon: IconMap.ai, reqExpert: true }
  ];

  const activeTools = appMode === 'EXPERT' ? tools : tools.filter(t => !t.reqExpert);

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-28 select-none font-sans text-white relative z-10 animate-fadeIn">
      
      <div className="theme-glass-panel p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center backdrop-blur-md relative overflow-hidden group">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-[0_0_20px_var(--glass-border)] border border-[var(--accent-text)] bg-black p-1 mb-4 z-10 group-hover:scale-105 transition-transform">
          <img src="/Appicon.jpg" alt="Logo" className="w-full h-full object-cover rounded-xl" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
        <h2 className="text-2xl font-black tracking-widest text-white uppercase z-10">SOVEREIGN TOOLS</h2>
        <p className="text-[10px] theme-accent-text font-bold tracking-[0.2em] uppercase mt-2 z-10">
          "Privacy is Sovereignty"
        </p>
        <p className="text-[10px] text-zinc-400 mt-4 max-w-xs leading-relaxed z-10">
          A 100% offline-first privacy utility suite designed to replace surveillance-heavy stock phone apps.
        </p>
      </div>

      <div>
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
          <span className="theme-accent-text text-lg">⚡</span> MASTER SUITE QUICK LAUNCH ({activeTools.length})
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {activeTools.map(tool => (
            <button 
              key={tool.id} 
              onClick={() => onNavigate(tool.id)} 
              className="theme-glass-panel p-4 rounded-3xl flex items-center gap-4 active:scale-95 transition-all shadow-lg hover:bg-[var(--glass-border)] group backdrop-blur-sm"
            >
              <div className="theme-accent-text drop-shadow-[0_0_8px_var(--accent-text)] group-hover:scale-110 transition-transform">
                {tool.icon}
              </div>
              <div className="text-left overflow-hidden">
                <h3 className="text-sm font-bold text-white tracking-wide">{tool.label}</h3>
                <p className="text-[9px] text-zinc-400 font-mono mt-0.5 truncate group-hover:text-zinc-200 transition-colors">{tool.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
