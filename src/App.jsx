import { SovereignRecorder } from "./components/SovereignRecorder";
import { WorldClock } from "./components/WorldClock";
import React, { useState, useEffect } from 'react';
import { LockScreen } from './components/LockScreen';
import { Home } from "./components/Home";
import { SovereignRecorder } from "./components/SovereignRecorder";
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
import { CommsProvider } from './context/CommsContext';

function AppContent() {
  const [isLocked, setIsLocked] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  
  const { mode, accentColor, textSize, setAccentColor, setMode, setTextSize } = useSettings();

  useEffect(() => {
    document.documentElement.className = `theme-${accentColor} text-scale-${textSize}`;
    
    // Dynamic Wallpaper Engine
    const bgImages = {
      cyan: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1080&auto=format&fit=crop)',
      emerald: 'url(https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1080&auto=format&fit=crop)',
      amber: 'url(https://images.unsplash.com/photo-1614064016629-8798cb3d77ad?q=80&w=1080&auto=format&fit=crop)',
      purple: 'url(https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1080&auto=format&fit=crop)',
      rose: 'url(https://images.unsplash.com/photo-1618044733300-9472054094ee?q=80&w=1080&auto=format&fit=crop)'
    };
    
    document.body.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.95)), ${bgImages[accentColor] || bgImages.cyan}`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
  }, [accentColor, textSize]);

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
    setShowSettings(false);
    window.scrollTo(0, 0);
  };

  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className="min-h-screen text-white font-sans select-none pb-24 relative z-10">
      
      <div className="flex justify-between items-center p-4 border-b border-zinc-900 bg-black/90 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-black tracking-widest text-white uppercase">SOVEREIGN TOOLS</h1>
          <span className="text-[9px] font-bold theme-accent-badge px-2 py-0.5 rounded-full uppercase">{mode}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(true)} className="theme-glass-panel text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 flex items-center gap-1.5 shadow">
            <span className="text-sm">⚙️</span> Settings
          </button>
          <button onClick={() => { setIsLocked(true); setCurrentScreen('home'); }} className="bg-red-950/40 border border-red-900/50 text-red-400 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 flex items-center gap-1.5 shadow">
            <span className="text-sm">🔒</span> Lock
          </button>
        </div>
      </div>

      {currentScreen === 'recorder' && <SovereignRecorder onNavigate={navigateTo} />}
        {currentScreen === 'home' && <Home onNavigate={navigateTo} />}
      {currentScreen === 'calc' && <StealthCalc onNavigate={navigateTo} />}
      {currentScreen === 'calendar' && <Calendar onNavigate={navigateTo} />}
      {currentScreen === 'worldclock' && <WorldClock onNavigate={navigateTo} />}
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
        <Settings 
          closeSettings={() => setShowSettings(false)} 
          appMode={mode} 
          setAppMode={setMode} 
          accentColor={accentColor} 
          setAccentColor={setAccentColor} 
          textSize={textSize} 
          setTextSize={setTextSize}
          onNavigate={navigateTo} 
        />
      )}

      {currentScreen !== 'home' && !showSettings && (
        <button 
          onClick={() => navigateTo('home')} 
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-black/80 backdrop-blur-xl border border-zinc-700 rounded-full flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(0,0,0,0.8)] z-50 active:scale-95 transition-transform hover:border-[var(--accent-text)] group"
        >
          <span className="opacity-80 group-hover:opacity-100 transition-opacity">🏠</span>
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <StorageProvider>
        <AudioProvider>
          <CommsProvider>
            <AppContent />
          </CommsProvider>
        </AudioProvider>
      </StorageProvider>
    </SettingsProvider>
  );
}
