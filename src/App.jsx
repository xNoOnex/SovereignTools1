import React, { useState } from 'react';
import { StorageProvider } from './context/StorageContext';
import { AudioProvider } from './context/AudioContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';

// Import Tools
import { Home } from './components/Home';
import { SovereignClock } from './components/SovereignClock';
import { SovereignCamera } from './components/SovereignCamera';
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
import { SettingsModal } from './components/SettingsModal';
import { LockScreen } from './components/LockScreen';

function MainLayout() {
  const [activeTab, setActiveTab] = useState('home');
  const [isLocked, setIsLocked] = useState(true);
  const { mode, currentTheme, currentFont, setIsSettingsOpen } = useSettings();

  const allNavItems = [
    { id: 'home', label: 'Home', icon: '🏠', easy: true },
    { id: 'clock', label: 'Clock', icon: '⏰', easy: true },
    { id: 'camera', label: 'Camera', icon: '📷', easy: true },
    { id: 'gallery', label: 'Gallery', icon: '🖼️', easy: true },
    { id: 'vault', label: 'Vault', icon: '🔐', easy: true },
    { id: 'audio', label: 'Audio', icon: '🎧', easy: true },
    { id: 'docs', label: 'Docs', icon: '📝', easy: true },
    { id: 'calc', label: 'Calc', icon: '🧮', easy: true },
    { id: 'calendar', label: 'Calendar', icon: '📅', easy: true },
    { id: 'ai', label: 'AI', icon: '🤖', easy: true },
    { id: 'support', label: 'Support', icon: '☕', easy: true },
    { id: 'debloat', label: 'Debloat', icon: '⚡', easy: false },
    { id: 'comms', label: 'Comms', icon: '📡', easy: false },
    { id: 'aes', label: 'AES', icon: '🛡️', easy: false },
    { id: 'shred', label: 'Shred', icon: '☣️', easy: false },
    { id: 'netsec', label: 'NetSec', icon: '🌐', easy: false }
  ];

  const navItems = mode === 'easy'
    ? allNavItems.filter(item => item.easy)
    : allNavItems;

  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className={`bg-black text-white min-h-screen font-sans antialiased flex flex-col justify-between ${currentFont}`}>
      
      <SettingsModal />

      {activeTab !== 'home' && activeTab !== 'camera' && (
        <div className="flex justify-between items-center px-4 py-2 bg-zinc-950 border-b border-zinc-900 shrink-0">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
            <span className="text-xs font-black tracking-wider text-white">SOVEREIGN TOOLS</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${currentTheme.badge}`}>
              {mode === 'easy' ? 'EASY' : 'EXPERT'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-xs font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-xl"
            >
              ⚙️ Settings
            </button>
            <button
              onClick={() => setIsLocked(true)}
              className="text-xs font-bold text-amber-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-xl"
            >
              🔒 Lock
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        {activeTab === 'home' && <Home onNavigate={setActiveTab} onLock={() => setIsLocked(true)} />}
        {activeTab === 'clock' && <SovereignClock onNavigate={setActiveTab} />}
        {activeTab === 'camera' && <SovereignCamera onNavigate={setActiveTab} />}
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
                      ? `bg-zinc-800 border border-zinc-700 font-bold scale-105 shadow ${currentTheme.text}`
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
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <StorageProvider>
        <AudioProvider>
          <MainLayout />
        </AudioProvider>
      </StorageProvider>
    </SettingsProvider>
  );
}
