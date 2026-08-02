import React, { useState, useEffect } from 'react';
import { LockScreen } from './components/LockScreen';
import { Home } from './components/Home';
import { StealthCalc } from './components/StealthCalc';
import { Calendar } from './components/Calendar';
import { SmartAI } from './components/SmartAI';
import { Support } from './components/Support';
import { Debloat } from './components/Debloat';
import { Comms } from './components/Comms';
import { AESCipher } from './components/AESCipher';
import { Shredder } from './components/Shredder';
import { NetSecOps } from './components/NetSecOps';
import { SovereignCamera } from './components/SovereignCamera';
import { SecureGallery } from './components/SecureGallery';
import { Vault } from './components/Vault';
import { SovereignAudio } from './components/SovereignAudio';
import { EncryptedDocs } from './components/EncryptedDocs';
import { FileViewer } from './components/FileViewer';
import { Settings } from './components/Settings';
import { StorageProvider } from './context/StorageContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { AudioProvider } from './context/AudioContext';

function AppContent() {
  const [isLocked, setIsLocked] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  
  const { mode, accentColor, setAccentColor, setMode, textSize, setTextSize } = useSettings();

  useEffect(() => {
    // Inject the theme, text scale, and global background image class
    document.body.className = `theme-${accentColor} text-scale-${textSize} app-bg-watermark`;
  }, [accentColor, textSize]);

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  // Filter bottom dock icons based on mode
  const allDockTabs = [
    { id: 'home', label: 'Home', icon: '🏠', reqExpert: false },
    { id: 'camera', label: 'Camera', icon: '📷', reqExpert: false },
    { id: 'gallery', label: 'Gallery', icon: '🖼️', reqExpert: false },
    { id: 'vault', label: 'Vault', icon: '🔐', reqExpert: false },
    { id: 'comms', label: 'Comms', icon: '📡', reqExpert: true },
    { id: 'docs', label: 'Docs', icon: '📝', reqExpert: false },
    { id: 'fileviewer', label: 'Files', icon: '📂', reqExpert: false },
    { id: 'audio', label: 'Audio', icon: '🎵', reqExpert: false },
    { id: 'calc', label: 'Calc', icon: '🧮', reqExpert: false },
    { id: 'calendar', label: 'Calendar', icon: '📅', reqExpert: false },
    { id: 'ai', label: 'AI', icon: '🤖', reqExpert: true },
    { id: 'netsec', label: 'NetSec', icon: '🌐', reqExpert: true }
  ];
  
  const activeDockTabs = mode === 'EXPERT' ? allDockTabs : allDockTabs.filter(t => !t.reqExpert);

  return (
    <div className="min-h-screen text-white font-sans select-none pb-24 relative z-10">
      <div className="flex justify-between items-center p-4 border-b border-zinc-900 bg-black/90 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-black tracking-widest text-white uppercase">SOVEREIGN TOOLS</h1>
          <span className="text-[9px] font-bold theme-accent-badge px-2 py-0.5 rounded-full uppercase">{mode}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(true)} className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 flex items-center gap-1.5">
            <span className="text-sm">⚙️</span> Settings
          </button>
          <button onClick={() => { setIsLocked(true); setCurrentScreen('home'); }} className="bg-zinc-900 border border-zinc-800 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 flex items-center gap-1.5">
            <span className="text-sm">🔒</span> Lock
          </button>
        </div>
      </div>

      {currentScreen === 'home' && <Home onNavigate={navigateTo} appMode={mode} />}
      {currentScreen === 'calc' && <StealthCalc onNavigate={navigateTo} />}
      {currentScreen === 'calendar' && <Calendar onNavigate={navigateTo} />}
      {currentScreen === 'ai' && <SmartAI onNavigate={navigateTo} />}
      {currentScreen === 'support' && <Support onNavigate={navigateTo} />}
      {currentScreen === 'debloat' && <Debloat onNavigate={navigateTo} />}
      {currentScreen === 'comms' && <Comms onNavigate={navigateTo} />}
      {currentScreen === 'aes' && <AESCipher onNavigate={navigateTo} />}
      {currentScreen === 'shred' && <Shredder onNavigate={navigateTo} />}
      {currentScreen === 'netsec' && <NetSecOps onNavigate={navigateTo} />}
      {currentScreen === 'camera' && <SovereignCamera onNavigate={navigateTo} />}
      {currentScreen === 'gallery' && <SecureGallery onNavigate={navigateTo} />}
      {currentScreen === 'vault' && <Vault onNavigate={navigateTo} />}
      {currentScreen === 'audio' && <SovereignAudio onNavigate={navigateTo} />}
      {currentScreen === 'docs' && <EncryptedDocs onNavigate={navigateTo} />}
      {currentScreen === 'fileviewer' && <FileViewer onNavigate={navigateTo} />}

      {showSettings && (
        <Settings closeSettings={() => setShowSettings(false)} appMode={mode} setAppMode={setMode} accentColor={accentColor} setAccentColor={setAccentColor} textSize={textSize} setTextSize={setTextSize} />
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-zinc-900 p-2 flex justify-start gap-4 items-center z-40 overflow-x-auto no-scrollbar px-4">
        {activeDockTabs.map(tab => (
          <button key={tab.id} onClick={() => navigateTo(tab.id)} className={`flex flex-col items-center p-2 rounded-2xl transition-all shrink-0 ${currentScreen === tab.id ? 'theme-accent-text scale-110 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[9px] tracking-wider mt-0.5">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <StorageProvider>
        <AudioProvider>
          <AppContent />
        </AudioProvider>
      </StorageProvider>
    </SettingsProvider>
  );
}
