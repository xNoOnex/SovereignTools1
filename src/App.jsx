import React, { useState } from 'react';
import { LockScreen } from './components/LockScreen';
import { ExifFreeCamera } from './components/ExifFreeCamera';
import { Gallery } from './components/Gallery';
import { PasswordManager } from './components/PasswordManager';
import { ShizukuDebloater } from './components/ShizukuDebloater';
import { PgpMessaging } from './components/PgpMessaging';
import { AesCipherTool } from './components/AesCipherTool';
import { FileShredder } from './components/FileShredder';
import { LocalAIAssistant } from './components/LocalAIAssistant';
import { PrivacyBrowser } from './components/PrivacyBrowser';
import { Settings } from './components/Settings';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentTab, setCurrentTab] = useState('camera');
  const appMode = localStorage.getItem('sovereign_mode') || 'expert';

  if (!isUnlocked) {
    return <LockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  if (currentTab === 'camera') {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <ExifFreeCamera onClose={() => setCurrentTab('gallery')} />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen text-white font-sans flex flex-col justify-between bg-cover bg-center bg-fixed relative select-none"
      style={{ backgroundImage: `url('./sovereign_logo.jpg')` }}
    >
      <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-0 pointer-events-none" />

      <header 
        className="bg-zinc-900/95 border-b border-zinc-800 px-4 pb-3 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 36px)' }}
      >
        <div className="flex items-center space-x-3">
          <img src="./sovereign_logo.jpg" alt="Logo" className="w-7 h-7 rounded-lg border border-cyan-500/50 object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
          <div>
            <h1 className="font-bold text-sm text-white tracking-wide">SOVEREIGN TOOLS</h1>
            <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">{appMode} mode</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentTab('settings')}
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium ${
              currentTab === 'settings' ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}
          >
            ⚙️ Settings
          </button>
          <button
            onClick={() => setIsUnlocked(false)}
            className="text-xs bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1.5 rounded-lg border border-zinc-700 font-medium"
          >
            🔒 Lock
          </button>
        </div>
      </header>

      <main className="flex-1 pb-32 relative z-10">
        {currentTab === 'browser' && <PrivacyBrowser />}
        {currentTab === 'gallery' && <Gallery />}
        {currentTab === 'vault' && <PasswordManager />}
        {currentTab === 'debloater' && <ShizukuDebloater />}
        {currentTab === 'pgp' && <PgpMessaging />}
        {currentTab === 'aes' && <AesCipherTool />}
        {currentTab === 'shredder' && <FileShredder />}
        {currentTab === 'ai' && <LocalAIAssistant />}
        {currentTab === 'settings' && <Settings onLock={() => setIsUnlocked(false)} />}
      </main>

      <nav 
        className="fixed bottom-0 inset-x-0 bg-zinc-900/95 border-t border-zinc-800 px-1 pt-1.5 flex justify-around text-[8px] font-bold z-40 backdrop-blur-md"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
      >
        <button
          onClick={() => setCurrentTab('camera')}
          className={`flex flex-col items-center py-1 px-1 rounded-lg ${currentTab === 'camera' ? 'text-emerald-400 bg-zinc-800/90' : 'text-zinc-400'}`}
        >
          <span className="text-sm">📷</span>
          Camera
        </button>
        <button
          onClick={() => setCurrentTab('browser')}
          className={`flex flex-col items-center py-1 px-1 rounded-lg ${currentTab === 'browser' ? 'text-emerald-400 bg-zinc-800/90' : 'text-zinc-400'}`}
        >
          <span className="text-sm">🌐</span>
          Browser
        </button>
        <button
          onClick={() => setCurrentTab('gallery')}
          className={`flex flex-col items-center py-1 px-1 rounded-lg ${currentTab === 'gallery' ? 'text-emerald-400 bg-zinc-800/90' : 'text-zinc-400'}`}
        >
          <span className="text-sm">🖼️</span>
          Gallery
        </button>
        <button
          onClick={() => setCurrentTab('vault')}
          className={`flex flex-col items-center py-1 px-1 rounded-lg ${currentTab === 'vault' ? 'text-emerald-400 bg-zinc-800/90' : 'text-zinc-400'}`}
        >
          <span className="text-sm">🔐</span>
          Vault
        </button>
        <button
          onClick={() => setCurrentTab('debloater')}
          className={`flex flex-col items-center py-1 px-1 rounded-lg ${currentTab === 'debloater' ? 'text-emerald-400 bg-zinc-800/90' : 'text-zinc-400'}`}
        >
          <span className="text-sm">⚡</span>
          Debloat
        </button>
        <button
          onClick={() => setCurrentTab('pgp')}
          className={`flex flex-col items-center py-1 px-1 rounded-lg ${currentTab === 'pgp' ? 'text-emerald-400 bg-zinc-800/90' : 'text-zinc-400'}`}
        >
          <span className="text-sm">📡</span>
          PGP
        </button>
        <button
          onClick={() => setCurrentTab('aes')}
          className={`flex flex-col items-center py-1 px-1 rounded-lg ${currentTab === 'aes' ? 'text-emerald-400 bg-zinc-800/90' : 'text-zinc-400'}`}
        >
          <span className="text-sm">🛡️</span>
          AES
        </button>
        <button
          onClick={() => setCurrentTab('shredder')}
          className={`flex flex-col items-center py-1 px-1 rounded-lg ${currentTab === 'shredder' ? 'text-red-400 bg-zinc-800/90' : 'text-zinc-400'}`}
        >
          <span className="text-sm">☣️</span>
          Shred
        </button>
        <button
          onClick={() => setCurrentTab('ai')}
          className={`flex flex-col items-center py-1 px-1 rounded-lg ${currentTab === 'ai' ? 'text-emerald-400 bg-zinc-800/90' : 'text-zinc-400'}`}
        >
          <span className="text-sm">🤖</span>
          AI
        </button>
      </nav>
    </div>
  );
}
