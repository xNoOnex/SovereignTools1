import React, { useState, useEffect, useRef } from "react";
import { registerPlugin, Capacitor } from '@capacitor/core';
import { StorageProvider, useStorage } from './context/StorageContext';

// Restoring ALL Component Imports
import { Home } from "./components/Home";
import { SovereignAudio } from "./components/SovereignAudio";
import { SovereignRecorder } from "./components/SovereignRecorder";
import { SecureGallery } from "./components/SecureGallery";
import { NetSec } from "./components/NetSec";
import { Debloat } from "./components/Debloat";
import { FileShredder } from "./components/FileShredder";
import { WorldClock } from "./components/WorldClock";
import { Calendar } from "./components/Calendar";
import { UniversalExplorer } from "./components/UniversalExplorer";
import { Settings } from "./components/Settings";
import { SmartAI } from "./components/SmartAI";
import { SecureVault } from "./components/SecureVault";
import { EncryptedDocs } from "./components/EncryptedDocs";
import { CommLink } from "./components/CommLink";
import { SovereignCamera } from "./components/SovereignCamera";
import { AESCipher } from "./components/AESCipher";
import { StealthCalc } from "./components/StealthCalc";

const StorageIntentBridge = registerPlugin('StorageIntentBridge');

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isLocked, setIsLocked] = useState(false);
  const [appMode, setAppMode] = useState('EXPERT');

  const { indexedFiles } = useStorage();
  const audioRef = useRef(null);
  const [globalTrackIndex, setGlobalTrackIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioFiles = indexedFiles.filter(f => ['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg', 'wma'].includes(f.ext?.toLowerCase()));
  const currentTrack = globalTrackIndex !== null ? audioFiles[globalTrackIndex] : null;

  useEffect(() => {
    const savedMode = localStorage.getItem('sovereign_mode') || 'EXPERT';
    setAppMode(savedMode);
  }, []);

  useEffect(() => {
    if (currentTrack && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: currentTrack.name, artist: 'Sovereign Audio', album: currentTrack.folder || 'Storage' });
      navigator.mediaSession.setActionHandler('play', () => { if(audioRef.current){ audioRef.current.play(); setIsPlaying(true); } });
      navigator.mediaSession.setActionHandler('pause', () => { if(audioRef.current){ audioRef.current.pause(); setIsPlaying(false); } });
      navigator.mediaSession.setActionHandler('previoustrack', handlePrevTrack);
      navigator.mediaSession.setActionHandler('nexttrack', handleNextTrack);
    }
  }, [globalTrackIndex]);

  const handlePlayTrack = (index) => {
    setGlobalTrackIndex(index);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = Capacitor.convertFileSrc(audioFiles[index].path);
      audioRef.current.play();
    }
  };

  const handleNextTrack = () => { if (audioFiles.length > 0) handlePlayTrack((globalTrackIndex + 1) % audioFiles.length); };
  const handlePrevTrack = () => { if (audioFiles.length > 0) handlePlayTrack((globalTrackIndex - 1 + audioFiles.length) % audioFiles.length); };
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); } 
    else { audioRef.current.play(); setIsPlaying(true); }
  };
  const stopAudio = () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; setIsPlaying(false); } };

  const navigateTo = (screen) => setCurrentScreen(screen);

  return (
    <div className="flex flex-col h-screen bg-black font-sans relative overflow-hidden">
      <audio ref={audioRef} onEnded={handleNextTrack} className="hidden" />

      <header className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black via-black/90 to-transparent z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 mt-2 cursor-pointer" onClick={() => navigateTo('home')}>
          <div className="bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-xl flex items-center gap-2 active:scale-95 shadow-lg">
             <span className="text-xl">🏠</span>
             <span className="text-white font-black text-[10px] tracking-widest uppercase">Home</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] font-bold text-white bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg uppercase tracking-widest shadow select-none">{appMode}</span>
          <button onClick={() => navigateTo('settings')} className="text-zinc-400 hover:text-white px-2 py-1.5 active:scale-95 transition-transform flex items-center gap-1.5 rounded-lg border border-transparent hover:border-zinc-800 bg-black/50">
            <span className="text-sm">⚙️</span>
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline select-none">Settings</span>
          </button>
          <button onClick={() => setIsLocked(true)} className="bg-red-950/40 text-red-500 border border-red-900 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform shadow select-none">
            <span>🔒</span> Lock
          </button>
        </div>
      </header>

      <main className="pt-20 pb-16 flex-1 overflow-y-auto overflow-x-hidden">
        {/* RESTORED ALL UI ROUTES */}
        {currentScreen === 'home' && <Home onNavigate={navigateTo} />}
        {currentScreen === 'worldclock' && <WorldClock onNavigate={navigateTo} />}
        {currentScreen === 'calendar' && <Calendar onNavigate={navigateTo} />}
        {currentScreen === 'recorder' && <SovereignRecorder onNavigate={navigateTo} />}
        {currentScreen === 'netsec' && <NetSec onNavigate={navigateTo} />}
        {currentScreen === 'debloat' && <Debloat onNavigate={navigateTo} />}
        {currentScreen === 'shred' && <FileShredder onNavigate={navigateTo} />}
        {currentScreen === 'fileviewer' && <UniversalExplorer onNavigate={navigateTo} />}
        {currentScreen === 'gallery' && <SecureGallery onNavigate={navigateTo} />}
        {currentScreen === 'settings' && <Settings onNavigate={navigateTo} />}
        {currentScreen === 'ai' && <SmartAI onNavigate={navigateTo} />}
        {currentScreen === 'vault' && <SecureVault onNavigate={navigateTo} />}
        {currentScreen === 'docs' && <EncryptedDocs onNavigate={navigateTo} />}
        {currentScreen === 'comms' && <CommLink onNavigate={navigateTo} />}
        {currentScreen === 'camera' && <SovereignCamera onNavigate={navigateTo} />}
        {currentScreen === 'aes' && <AESCipher onNavigate={navigateTo} />}
        {currentScreen === 'calc' && <StealthCalc onNavigate={navigateTo} />}
        
        {currentScreen === 'audio' && (
           <SovereignAudio 
              onNavigate={navigateTo} globalTrackIndex={globalTrackIndex} isPlaying={isPlaying}
              handlePlayTrack={handlePlayTrack} togglePlay={togglePlay} stopAudio={stopAudio}
              handleNextTrack={handleNextTrack} handlePrevTrack={handlePrevTrack} audioRef={audioRef}
           />
        )}
      </main>

      {currentTrack && currentScreen !== 'audio' && (
         <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black to-transparent z-50 animate-fadeIn">
            <div className="bg-zinc-900/95 border border-cyan-500/30 p-3 rounded-2xl flex items-center justify-between shadow-2xl backdrop-blur">
               <div className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer" onClick={() => navigateTo('audio')}>
                  <span className="text-xl opacity-80">{isPlaying ? '🔊' : '🎵'}</span>
                  <div className="truncate">
                     <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">Now Playing</span>
                     <span className="text-xs font-bold text-white truncate block">{currentTrack.name}</span>
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

      {isLocked && (
        <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center p-6 select-none animate-fadeIn">
           <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-2 text-center">Sovereign</h1>
           <p className="text-xs font-mono text-zinc-500 mb-12 tracking-widest text-center">SYSTEM LOCKED</p>
           <button onClick={() => setIsLocked(false)} className="bg-zinc-900 border border-zinc-700 text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest active:scale-95 hover:bg-zinc-800 shadow-xl">
              Unlock Interface
           </button>
        </div>
      )}
    </div>
  );
}

export default function App() { return <StorageProvider><AppContent /></StorageProvider>; }
