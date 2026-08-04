import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LockScreen } from './components/LockScreen';
import { Home } from './components/Home';
import { StealthCalc } from './components/StealthCalc';
import { Calendar } from './components/Calendar';
import { SovereignRecorder } from './components/SovereignRecorder';
import { NetSec } from './components/NetSec';
import { UniversalExplorer } from './components/UniversalExplorer';
import { SovereignAudio } from './components/SovereignAudio';
import { Settings } from './components/Settings';

export function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('home');
  
  // Fully Safe Global Audio State
  const audioRef = useRef(null);
  const [globalTrackIndex, setGlobalTrackIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFiles, setAudioFiles] = useState([]);
  
  const currentTrack = globalTrackIndex !== null && audioFiles[globalTrackIndex] ? audioFiles[globalTrackIndex] : null;

  useEffect(() => {
    if (currentTrack && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: currentTrack.name || 'Sovereign Audio', artist: 'Sovereign Tools' });
      navigator.mediaSession.setActionHandler('play', () => { if(audioRef.current){ audioRef.current.play(); setIsPlaying(true); } });
      navigator.mediaSession.setActionHandler('pause', () => { if(audioRef.current){ audioRef.current.pause(); setIsPlaying(false); } });
      navigator.mediaSession.setActionHandler('previoustrack', handlePrevTrack);
      navigator.mediaSession.setActionHandler('nexttrack', handleNextTrack);
    }
  }, [globalTrackIndex, currentTrack]);

  const handlePlayTrack = (index, files = audioFiles) => {
    if(files.length > 0 && files[index]) {
       setAudioFiles(files); 
       setGlobalTrackIndex(index);
       setIsPlaying(true);
       if (audioRef.current) {
         audioRef.current.src = Capacitor.convertFileSrc(files[index].path);
         audioRef.current.play();
       }
    }
  };

  const handleNextTrack = () => { if (audioFiles.length > 0) handlePlayTrack((globalTrackIndex + 1) % audioFiles.length); };
  const handlePrevTrack = () => { if (audioFiles.length > 0) handlePlayTrack((globalTrackIndex - 1 + audioFiles.length) % audioFiles.length); };
  
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };
  
  const stopAudio = () => { 
    if (audioRef.current) { 
      audioRef.current.pause(); 
      audioRef.current.currentTime = 0; 
      setIsPlaying(false); 
    } 
  };

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
            {currentScreen === 'explorer' && <UniversalExplorer onNavigate={navigateTo} />}
            {currentScreen === 'audio' && (
              <SovereignAudio 
                onNavigate={navigateTo} 
                globalTrackIndex={globalTrackIndex} 
                isPlaying={isPlaying} 
                handlePlayTrack={handlePlayTrack} 
                togglePlay={togglePlay} 
                stopAudio={stopAudio} 
                handleNextTrack={handleNextTrack} 
                handlePrevTrack={handlePrevTrack} 
                audioRef={audioRef} 
              />
            )}
            {currentScreen === 'settings' && <Settings onNavigate={navigateTo} />}
          </main>

          {currentTrack && currentScreen !== 'audio' && (
             <div className="absolute bottom-16 inset-x-0 p-4 bg-gradient-to-t from-black via-black to-transparent z-50 animate-fadeIn">
                <div className="bg-zinc-900/95 border border-cyan-500/30 p-3 rounded-2xl flex items-center justify-between shadow-2xl backdrop-blur">
                   <div className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer" onClick={() => navigateTo('audio')}>
                      <span className="text-xl opacity-80">{isPlaying ? '🔊' : '🎵'}</span>
                      <div className="truncate">
                         <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">Now Playing</span>
                         <span className="text-xs font-bold text-white truncate block">{currentTrack.name || 'Unknown Track'}</span>
                      </div>
                   </div>
                   <div className="flex gap-2 shrink-0 ml-2">
                      <button onClick={handlePrevTrack} className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-[10px] border border-zinc-700 active:scale-95 text-white">⏮</button>
                      <button onClick={togglePlay} className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center text-xs font-black border border-cyan-500 active:scale-95 text-black shadow-lg">
                         {isPlaying ? '⏸' : '▶'}
                      </button>
                      <button onClick={handleNextTrack} className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-[10px] border border-zinc-700 active:scale-95 text-white">⏭</button>
                   </div>
                </div>
             </div>
          )}
          <audio ref={audioRef} onEnded={handleNextTrack} className="hidden" />

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
