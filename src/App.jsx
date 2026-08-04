import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { LockScreen } from './components/LockScreen';
import { Home } from './components/Home';
import { StealthCalc } from './components/StealthCalc';
import { Calendar } from './components/Calendar';
import { SovereignRecorder } from './components/SovereignRecorder';
import { NetSec } from './components/NetSec';
import { DataShredder } from './components/DataShredder';
import { UniversalExplorer } from './components/UniversalExplorer';
import { SovereignAudio } from './components/SovereignAudio';
import { Settings } from './components/Settings';
import { useStorage } from './hooks/useStorage';

export function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('home');
  const { indexedFiles } = useStorage();

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans select-none overflow-x-hidden">
      {isLocked && <LockScreen onUnlock={() => setIsLocked(false)} />}
      
      {!isLocked && (
        <div className="relative min-h-screen pb-20">
          <header className="flex justify-between items-center px-4 py-3 border-b border-zinc-900 bg-black/80 sticky top-0 z-40 backdrop-blur">
            <h1 className="text-sm font-black tracking-widest text-white uppercase">Sovereign Tools</h1>
            <div className="flex items-center gap-3">
              <button onClick={() => navigateTo('settings')} className="text-xs text-zinc-400 hover:text-white uppercase font-bold tracking-widest bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">Settings</button>
              <button onClick={() => setIsLocked(true)} className="text-xs bg-red-950/40 text-rose-500 border border-rose-900/50 px-3 py-1.5 rounded-xl font-bold uppercase tracking-widest active:scale-95">Lock</button>
            </div>
          </header>

          <main className="pb-12">
            {currentScreen === 'home' && <Home onNavigate={navigateTo} />}
            {currentScreen === 'calc' && <StealthCalc onNavigate={navigateTo} />}
            {currentScreen === 'calendar' && <Calendar onNavigate={navigateTo} />}
            {currentScreen === 'recorder' && <SovereignRecorder onNavigate={navigateTo} />}
            {currentScreen === 'netsec' && <NetSec onNavigate={navigateTo} />}
            {currentScreen === 'shredder' && <DataShredder onNavigate={navigateTo} />}
            {currentScreen === 'explorer' && <UniversalExplorer onNavigate={navigateTo} />}
            {currentScreen === 'audio' && <SovereignAudio onNavigate={navigateTo} />}
            {currentScreen === 'settings' && <Settings onNavigate={navigateTo} />}
          </main>

          <nav className="fixed bottom-0 inset-x-0 bg-black/90 border-t border-zinc-900 p-3 flex justify-around items-center z-50 backdrop-blur">
            <button onClick={() => navigateTo('home')} className={`flex flex-col items-center gap-1 ${currentScreen === 'home' ? 'text-rose-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <span className="text-xl">🏠</span>
            </button>
            <button onClick={() => navigateTo('calc')} className={`flex flex-col items-center gap-1 ${currentScreen === 'calc' ? 'text-rose-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <span className="text-xl">🔢</span>
            </button>
            <button onClick={() => navigateTo('explorer')} className={`flex flex-col items-center gap-1 ${currentScreen === 'explorer' ? 'text-rose-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <span className="text-xl">📁</span>
            </button>
            <button onClick={() => navigateTo('audio')} className={`flex flex-col items-center gap-1 ${currentScreen === 'audio' ? 'text-rose-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <span className="text-xl">🎵</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

export default App;
