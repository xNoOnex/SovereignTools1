import React from 'react';
import { ToolFooter } from './ToolFooter';

export function Home({ onSelectTab }) {
  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-28 select-none">
      
      {/* HERO SECTION */}
      <div className="text-center space-y-3 bg-zinc-900/90 p-6 rounded-3xl border border-cyan-500/30 shadow-2xl backdrop-blur-md">
        <img 
          src="./sovereign_logo.jpg" 
          alt="Sovereign Tools Logo" 
          className="w-20 h-20 mx-auto rounded-2xl border-2 border-cyan-400 shadow-lg shadow-cyan-500/20 object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <h1 className="text-2xl font-black text-white tracking-wider">SOVEREIGN TOOLS</h1>
        <p className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest">
          "Privacy is Sovereignty. Absolute Local Control."
        </p>
        <p className="text-xs text-zinc-300 leading-relaxed max-w-md mx-auto font-sans">
          A 100% offline-first, tracker-free privacy utility suite designed to replace surveillance-heavy stock phone apps. Operates entirely on-device with zero telemetry.
        </p>
      </div>

      {/* QUICK LAUNCH MATRIX */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
          ⚡ Master Suite Quick Launch
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {[
            { id: 'camera', label: '📷 Camera', desc: 'EXIF-Free & QR' },
            { id: 'browser', label: '🌐 Browser', desc: 'Zero Telemetry' },
            { id: 'gallery', label: '🖼️ Gallery', desc: 'Albums & Video' },
            { id: 'vault', label: '🔐 Vault', desc: 'AES-256 Storage' },
            { id: 'debloater', label: '⚡ Debloat', desc: 'Shizuku ADB' },
            { id: 'pgp', label: '📡 PGP', desc: 'SMS Encryption' },
            { id: 'aes', label: '🛡️ AES Cipher', desc: 'Text Encryption' },
            { id: 'shredder', label: '☣️ Shredder', desc: 'Sector Zeroing' },
            { id: 'ai', label: '🤖 AI Assistant', desc: 'Smart Local RAG' },
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => onSelectTab(tool.id)}
              className="bg-zinc-900/90 hover:bg-zinc-800 p-3 rounded-2xl border border-zinc-800 hover:border-cyan-500/50 transition-all text-left flex flex-col justify-between"
            >
              <span className="text-xs font-bold text-white">{tool.label}</span>
              <span className="text-[9px] font-mono text-cyan-400 mt-1 font-bold">{tool.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SYSTEM DISCLAIMER & SECURITY WARNINGS */}
      <div className="bg-zinc-950 p-4 rounded-2xl border border-red-500/30 space-y-2 font-mono text-[11px]">
        <div className="text-red-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-xs">
          <span>⚠️ Important Disclaimers & Security Rules</span>
        </div>
        <ul className="text-zinc-400 space-y-1.5 list-disc list-inside text-[10px]">
          <li><strong>Zero Cloud Backups:</strong> All Vault secrets and media are stored exclusively inside your phone's local hardware memory.</li>
          <li><strong>Permanent Destruction:</strong> The Hardware Shredder overwrites disk sectors with binary zeroes. Shredded files cannot be recovered by any tool.</li>
          <li><strong>Local Execution:</strong> No analytics, telemetry, or user tracking is ever collected or transmitted.</li>
        </ul>
      </div>

      <ToolFooter
        title="Sovereign Master Utility Suite"
        details="Designed for high-security local mobile operations."
        disclaimer="100% On-Device • Zero Telemetry • Open Source"
      />
    </div>
  );
}
