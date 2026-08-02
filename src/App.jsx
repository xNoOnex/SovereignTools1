import React, { useState } from 'react';
import { StorageProvider } from './context/StorageContext';
import { AudioProvider } from './context/AudioContext';

// Import All 16 Tools
import { Home } from './components/Home';
import { SovereignCamera } from './components/SovereignCamera';
import { PrivacyBrowser } from './components/PrivacyBrowser';
import { SecureGallery } from './components/SecureGallery';
import { SovereignAudio } from './components/SovereignAudio';
import { EncryptedDocs } from './components/EncryptedDocs';
import { StealthCalc } from './components/StealthCalc';
import { LocalCalendar } from './components/LocalCalendar';
import { SecureVault } from './components/SecureVault';
import { SystemDebloater } from './components/SystemDebloater';
import { EncryptedComms } from './components/EncryptedComms';
import { AESCipher } from './components/AESCipher';
import { FileShredder } from './components/FileShredder';
import { NetSecOps } from './components/NetSecOps';
import { SmartAI } from './components/SmartAI';
import { SupportCreator } from './components/SupportCreator';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

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
    { id: 'netsec', label: 'NetSec', icon: '🌐' },
    { id: 'ai', label: 'AI', icon: '🤖' },
    { id: 'support', label: 'Support', icon: '☕' }
  ];

  return (
    <StorageProvider>
      <AudioProvider>
        <div className="bg-black text-white min-h-screen font-sans antialiased flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
          
          {/* MAIN VIEWPORT CONTAINER */}
          <main className="flex-1 overflow-y-auto">
            {activeTab === 'home' && <Home onNavigate={setActiveTab} />}
            {activeTab === 'camera' && <SovereignCamera onNavigate={setActiveTab} />}
            {activeTab === 'browser' && <PrivacyBrowser onNavigate={setActiveTab} />}
            {activeTab === 'gallery' && <SecureGallery onNavigate={setActiveTab} />}
            {activeTab === 'audio' && <SovereignAudio onNavigate={setActiveTab} />}
            {activeTab === 'docs' && <EncryptedDocs onNavigate={setActiveTab} />}
            {activeTab === 'calc' && <StealthCalc onNavigate={setActiveTab} />}
            {activeTab === 'calendar' && <LocalCalendar onNavigate={setActiveTab} />}
            {activeTab === 'vault' && <SecureVault onNavigate={setActiveTab} />}
            {activeTab === 'debloat' && <SystemDebloater onNavigate={setActiveTab} />}
            {activeTab === 'comms' && <EncryptedComms onNavigate={setActiveTab} />}
            {activeTab === 'aes' && <AESCipher onNavigate={setActiveTab} />}
            {activeTab === 'shred' && <FileShredder onNavigate={setActiveTab} />}
            {activeTab === 'netsec' && <NetSecOps onNavigate={setActiveTab} />}
            {activeTab === 'ai' && <SmartAI onNavigate={setActiveTab} />}
            {activeTab === 'support' && <SupportCreator onNavigate={setActiveTab} />}
          </main>

          {/* DYNAMIC SCROLLABLE BOTTOM NAVIGATION BAR */}
          {activeTab !== 'camera' && (
            <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 z-30 px-2 py-1.5 shadow-2xl">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-2xl mx-auto">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[58px] transition-all shrink-0 ${
                        isActive
                          ? 'bg-zinc-800 border border-zinc-700 text-cyan-400 font-bold scale-105 shadow'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="text-[9px] font-mono tracking-wider mt-0.5">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          )}

        </div>
      </AudioProvider>
    </StorageProvider>
  );
}
