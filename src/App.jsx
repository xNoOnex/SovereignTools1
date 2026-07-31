import React, { useState } from 'react';
import { LockScreen } from './components/LockScreen';
import { ExifFreeCamera } from './components/ExifFreeCamera';
import { PasswordManager } from './components/PasswordManager';
import { ShizukuDebloater } from './components/ShizukuDebloater';
import { PgpMessaging } from './components/PgpMessaging';
import { LocalAIAssistant } from './components/LocalAIAssistant';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentTab, setCurrentTab] = useState('camera');

  if (!isUnlocked) {
    return <LockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🛡️</span>
          <h1 className="font-bold text-sm text-white tracking-wide">SOVEREIGN TOOLS</h1>
        </div>
        <button 
          onClick={() => setIsUnlocked(false)} 
          className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 rounded border border-zinc-700"
        >
          🔒 Lock App
        </button>
      </header>

      {/* Main View Area */}
      <main className="flex-1 pb-20">
        {currentTab === 'camera' && <ExifFreeCamera />}
        {currentTab === 'vault' && <PasswordManager />}
        {currentTab === 'debloater' && <ShizukuDebloater />}
        {currentTab === 'pgp' && <PgpMessaging />}
        {currentTab === 'ai' && <LocalAIAssistant />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-zinc-900/95 border-t border-zinc-800 p-2 flex justify-around text-[10px] font-bold z-40 backdrop-blur">
        <button 
          onClick={() => setCurrentTab('camera')}
          className={`flex flex-col items-center py-1 px-2 rounded ${currentTab === 'camera' ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-400'}`}
        >
          <span className="text-base">📷</span>
          Camera
        </button>
        <button 
          onClick={() => setCurrentTab('vault')}
          className={`flex flex-col items-center py-1 px-2 rounded ${currentTab === 'vault' ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-400'}`}
        >
          <span className="text-base">🔐</span>
          Vault
        </button>
        <button 
          onClick={() => setCurrentTab('debloater')}
          className={`flex flex-col items-center py-1 px-2 rounded ${currentTab === 'debloater' ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-400'}`}
        >
          <span className="text-base">⚡</span>
          Debloater
        </button>
        <button 
          onClick={() => setCurrentTab('pgp')}
          className={`flex flex-col items-center py-1 px-2 rounded ${currentTab === 'pgp' ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-400'}`}
        >
          <span className="text-base">📡</span>
          PGP SMS
        </button>
        <button 
          onClick={() => setCurrentTab('ai')}
          className={`flex flex-col items-center py-1 px-2 rounded ${currentTab === 'ai' ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-400'}`}
        >
          <span className="text-base">🤖</span>
          Local AI
        </button>
      </nav>
    </div>
  );
}
