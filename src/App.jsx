import React, { useState, useEffect } from 'react';
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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const [appMode, setAppMode] = useState(() => localStorage.getItem('sovereign_mode') || 'EXPERT');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('sovereign_accent') || 'cyan');

  useEffect(() => {
    document.body.className = `theme-${accentColor}`;
  }, [accentColor]);

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  return (
    <StorageProvider>
      <div className="min-h-screen bg-black text-white font-sans select-none pb-24">
        
        {/* Top Global Bar */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-900 bg-black/90 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black tracking-widest text-white">SOVEREIGN TOOLS</h1>
            <span className="text-[9px] font-bold theme-accent-badge px-2 py-0.5 rounded-full">{appMode}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(true)} className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95">
              ⚙️ Settings
            </button>
            <button onClick={() => navigateTo('home')} className="bg-zinc-900 border border-zinc-800 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95">
              🔒 Lock
            </button>
          </div>
        </div>

        {/* Screen Switcher */}
        {currentScreen === 'home' && <Home onNavigate={navigateTo} appMode={appMode} />}
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

        {/* Settings Modal */}
        {showSettings && (
          <Settings 
            closeSettings={() => setShowSettings(false)} 
            appMode={appMode} 
            setAppMode={setAppMode} 
            accentColor={accentColor} 
            setAccentColor={setAccentColor} 
          />
        )}

        {/* Bottom Navigation Dock */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-zinc-900 p-2 flex justify-around items-center z-40 overflow-x-auto no-scrollbar">
          {[
            { id: 'home', label: 'Home', icon: '🏠' },
            { id: 'camera', label: 'Camera', icon: '📷' },
            { id: 'gallery', label: 'Gallery', icon: '🖼️' },
            { id: 'vault', label: 'Vault', icon: '🔐' },
            { id: 'audio', label: 'Audio', icon: '🎵' },
            { id: 'docs', label: 'Docs', icon: '📝' },
            { id: 'fileviewer', label: 'Files', icon: '📂' },
            { id: 'calc', label: 'Calc', icon: '🧮' },
            { id: 'calendar', label: 'Calendar', icon: '📅' },
            { id: 'ai', label: 'AI', icon: '🤖' },
            { id: 'netsec', label: 'NetSec', icon: '🌐' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => navigateTo(tab.id)} 
              className={`flex flex-col items-center p-2 rounded-2xl transition-all shrink-0 ${currentScreen === tab.id ? 'theme-accent-text scale-110 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[9px] tracking-wider mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>

      </div>
    </StorageProvider>
  );
}
