import React, { useState } from 'react';
import { Home } from './components/Home';
import { PrivacyBrowser } from './components/PrivacyBrowser';
import { SecureGallery } from './components/SecureGallery';
import { SovereignAudio } from './components/SovereignAudio';
import { FileShredder } from './components/FileShredder';
import { NetSec } from './components/NetSec';
import { AesEnclave } from './components/AesEnclave';
import { SystemDebloater } from './components/SystemDebloater';
import { SecureVault } from './components/SecureVault';
import { EncryptedComms } from './components/EncryptedComms';
import { LocalAiModule } from './components/LocalAiModule';

export default function App() {
  const [activeTab, setActiveTab] = useState('browser');

  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'browser', label: 'Browser', icon: '🌐' },
    { id: 'gallery', label: 'Gallery', icon: '🖼️' },
    { id: 'audio', label: 'Audio', icon: '🎧' },
    { id: 'vault', label: 'Vault', icon: '🔐' },
    { id: 'debloat', label: 'Debloat', icon: '⚡' },
    { id: 'comms', label: 'Comms', icon: '📡' },
    { id: 'aes', label: 'AES', icon: '🛡️' },
    { id: 'shred', label: 'Shred', icon: '☣️' },
    { id: 'netsec', label: 'NetSec', icon: '🔒' },
    { id: 'ai', label: 'AI', icon: '🤖' }
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between font-sans">
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'home' && <Home />}
        {activeTab === 'browser' && <PrivacyBrowser />}
        {activeTab === 'gallery' && <SecureGallery />}
        {activeTab === 'audio' && <SovereignAudio />}
        {activeTab === 'vault' && <SecureVault />}
        {activeTab === 'debloat' && <SystemDebloater />}
        {activeTab === 'comms' && <EncryptedComms />}
        {activeTab === 'aes' && <AesEnclave />}
        {activeTab === 'shred' && <FileShredder />}
        {activeTab === 'netsec' && <NetSec />}
        {activeTab === 'ai' && <LocalAiModule />}
      </main>

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
