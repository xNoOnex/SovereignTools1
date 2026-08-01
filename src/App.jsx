import React, { useState } from 'react';
import { Home } from './components/Home';
import { PrivacyBrowser } from './components/PrivacyBrowser';
import { SecureGallery } from './components/SecureGallery';
import { SovereignAudio } from './components/SovereignAudio';
import { FileShredder } from './components/FileShredder';
import { NetSec } from './components/NetSec';

// Fallback component renderer for auxiliary modules
const ToolPlaceholder = ({ title, icon, details }) => (
  <div className="p-6 text-center space-y-4 max-w-xl mx-auto mt-12">
    <div className="text-5xl">{icon}</div>
    <h2 className="text-xl font-bold text-white">{title}</h2>
    <p className="text-xs text-zinc-400">{details}</p>
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-mono text-cyan-400">
      ⚡ Sovereign Enclave Module Active
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('browser');

  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'camera', label: 'Camera', icon: '📷' },
    { id: 'browser', label: 'Browser', icon: '🌐' },
    { id: 'gallery', label: 'Gallery', icon: '🖼️' },
    { id: 'audio', label: 'Audio', icon: '🎧' },
    { id: 'docs', label: 'Docs', icon: '📝' },
    { id: 'calc', label: 'Calc', icon: '🧮' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'vault', label: 'Vault', icon: '🔐' },
    { id: 'debloat', label: 'Debloat', icon: '⚡' },
    { id: 'comms', label: 'Comms', icon: '📡' },
    { id: 'aes', label: 'AES', icon: '🛡️' },
    { id: 'shred', label: 'Shred', icon: '☣️' },
    { id: 'netsec', label: 'NetSec', icon: '🔒' },
    { id: 'ai', label: 'AI', icon: '🤖' },
    { id: 'support', label: 'Support', icon: '☕' }
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between font-sans">
      {/* MAIN VIEWPORT */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'home' && <Home />}
        {activeTab === 'camera' && <ToolPlaceholder title="Sovereign Camera" icon="📷" details="Zero-telemetry local viewfinder & scanner." />}
        {activeTab === 'browser' && <PrivacyBrowser />}
        {activeTab === 'gallery' && <SecureGallery />}
        {activeTab === 'audio' && <SovereignAudio />}
        {activeTab === 'docs' && <ToolPlaceholder title="Encrypted Docs" icon="📝" details="Offline local text & Markdown note vault." />}
        {activeTab === 'calc' && <ToolPlaceholder title="Stealth Calculator" icon="🧮" details="Standard calculator with hidden vault trigger." />}
        {activeTab === 'calendar' && <ToolPlaceholder title="Local Calendar" icon="📅" details="Offline schedule and event manager." />}
        {activeTab === 'vault' && <ToolPlaceholder title="Secure Vault" icon="🔐" details="AES-256 local password and credential store." />}
        {activeTab === 'debloat' && <ToolPlaceholder title="System Debloater" icon="⚡" details="ADB debloat package manager and process cleaner." />}
        {activeTab === 'comms' && <ToolPlaceholder title="Encrypted Comms" icon="📡" details="Local P2P mesh messaging interface." />}
        {activeTab === 'aes' && <ToolPlaceholder title="AES Enclave" icon="🛡️" details="Raw file & string encryption engine." />}
        {activeTab === 'shred' && <FileShredder />}
        {activeTab === 'netsec' && <NetSec />}
        {activeTab === 'ai' && <ToolPlaceholder title="Localized AI" icon="🤖" details="Local offline LLM inference interface." />}
        {activeTab === 'support' && <ToolPlaceholder title="Support & Logs" icon="☕" details="System status, debug logs, and developer info." />}
      </main>

      {/* HORIZONTALLY SCROLLABLE BOTTOM BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 z-50 py-1.5 px-1">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-2xl mx-auto px-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                  isActive
                    ? 'bg-zinc-800 text-cyan-400 font-bold scale-105 border border-cyan-500/30 shadow-lg'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className="text-base mb-0.5">{item.icon}</span>
                <span className="text-[9px] tracking-tight whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
