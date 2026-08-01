import React, { useState } from 'react';
import { LockScreen } from './components/LockScreen';
import { ExifFreeCamera } from './components/ExifFreeCamera';
import { PasswordManager } from './components/PasswordManager';
import { ShizukuDebloater } from './components/ShizukuDebloater';
import { PgpMessaging } from './components/PgpMessaging';
import { AesCipherTool } from './components/AesCipherTool';
import { LocalAIAssistant } from './components/LocalAIAssistant';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentTab, setCurrentTab] = useState('camera');

  if (!isUnlocked) {
    return <LockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div 
      className="min-h-screen text-white font-sans flex flex-col justify-between bg-cover bg-center bg-fixed relative select-none"
      style={{ backgroundImage: `url('./sovereign_logo.jpg')` }}
    >
      <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-0 pointer-events-none" />

      {/* Top Header */}
      <header className="bg-zinc-900/90 border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <img src="./sovereign_logo.jpg" alt="Logo" className="w-7 h-7 rounded-lg border border-cyan-500/50 object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
          <h1 className="font-bold text-sm text-white tracking-wide">SOVEREIGN TOOLS</h1>
        </div>
        <button
          onClick={() => setIsUnlocked(false)}
          className="text-xs bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 font-medium"
        >
          🔒 Lock
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 relative z-10">
        {currentTab === 'camera' && <ExifFreeCamera />}
        {currentTab === 'vault' && <PasswordManager />}
        {currentTab === 'debloater' && <ShizukuDebloater />}
        {currentTab === 'pgp' && <PgpMessaging />}
        {currentTab === 'aes' && <AesCipherTool />}
        {currentTab === 'ai' && <LocalAIAssistant />}
      </main>

      {/* Bottom Nav Dock */}
      <nav className="fixed bottom-0 inset-x-0 bg-zinc-900/90 border-t border-zinc-800 p-1.5 flex justify-around text-[9px] font-bold z-40 backdrop-blur-md">
        <button
          onClick={() => setCurrentTab('camera')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${currentTab === 'camera' ? 'text-emerald-400 bg-zinc-800/90' : 'text-zinc-400'}`}
        >
          <span className="text-base">📷</span>
          Camera
        </button>
        <button
          onClick={() => setCurrentTab('vault')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${currentTab === 'vault' ? 'text-emerald-400 bg-zinc-800/90' : 'text-zinc-400'}`}
        >
          <span className="text-base">🔐</span>
          Vault
        </button>
        <button
          onClick={() => setCurrentTab('debloater')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${currentTab === 'debloater' ? 'text-emerald-400 bg-zinc-800/90' : 'text-zinc-400'}`}
        >
          <span className="text-base">⚡</span>
          Debloat
        </button>
        <button
          onClick={() => setCurrentTab('pgp')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${currentTab === 'pgp' ? 'text-emerald-400 bg-zinc-800/90' : 'text-zinc-400'}`}
        >
          <span className="text-base">📡</span>
          PGP SMS
        </button>
        <button
          onClick={() => setCurrentTab('aes')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${currentTab === 'aes' ? 'text-emerald-400 bg-zinc-800/90' : 'text-zinc-400'}`}
        >
          <span className="text-base">🛡️</span>
          AES Cipher
        </button>
        <button
          onClick={() => setCurrentTab('ai')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${currentTab === 'ai' ? 'text-emerald-400 bg-zinc-800/90' : 'text-zinc-400'}`}
        >
          <span className="text-base">🤖</span>
          Local AI
        </button>
      </nav>
    </div>
  );
}
