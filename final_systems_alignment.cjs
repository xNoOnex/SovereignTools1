const fs = require('fs');
const path = require('path');

// ==========================================
// 1. FORCE JAVA BACKEND TO USE SHIZUKU
// ==========================================
const manifestPath = 'android/app/src/main/AndroidManifest.xml';
const manifest = fs.readFileSync(manifestPath, 'utf8');
const pkgMatch = manifest.match(/package="([^"]+)"/);
if (pkgMatch) {
    const javaPath = `android/app/src/main/java/${pkgMatch[1].replace(/\./g, '/')}/ShizukuRunner.java`;
    if (fs.existsSync(javaPath)) {
        let javaCode = fs.readFileSync(javaPath, 'utf8');
        
        // Strip the flaky binder check and force newProcess if OS granted permission
        const badExecutionBlock = /if\s*\(binderAlive\s*&&\s*osGranted\)\s*\{[\s\S]*?\} else \{ process = Runtime\.getRuntime\(\)\.exec\(new String\[\]\{"sh", "-c", cmd\}\);\s*\}/;
        
        const ironcladExecutionBlock = `
            if (osGranted) {
                try {
                    Method newProcessMethod = null;
                    for (Method m : Shizuku.class.getDeclaredMethods()) {
                        if (m.getName().equals("newProcess") && m.getParameterCount() == 3) {
                            newProcessMethod = m;
                            break;
                        }
                    }
                    if (newProcessMethod != null) {
                        newProcessMethod.setAccessible(true);
                        String[] shellCmd = new String[]{"sh", "-c", cmd};
                        process = (Process) newProcessMethod.invoke(null, new Object[]{shellCmd, null, null});
                        engineUsed = "Shizuku (Root)";
                    }
                } catch (Exception e) {}
            }
            if (process == null) {
                process = Runtime.getRuntime().exec(new String[]{"sh", "-c", cmd});
            }
        `;
        
        javaCode = javaCode.replace(badExecutionBlock, ironcladExecutionBlock);
        fs.writeFileSync(javaPath, javaCode);
    }
}

// ==========================================
// 2. SWEEP ALL JSX COMPONENTS FOR OFFLINE BUG
// ==========================================
const componentsDir = 'src/components';
if (fs.existsSync(componentsDir)) {
    const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx'));
    for (let file of files) {
        const filePath = path.join(componentsDir, file);
        let code = fs.readFileSync(filePath, 'utf8');
        if (code.includes('res.granted && res.active')) {
            code = code.replace(/res\.granted && res\.active/g, 'res.granted');
            fs.writeFileSync(filePath, code);
        }
    }
}

// ==========================================
// 3. RE-INJECT GLOBAL AUDIO PLAYER INTO APP.JSX
// ==========================================
const appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
    let app = fs.readFileSync(appPath, 'utf8');

    // Ensure useRef is imported
    if (!app.includes('useRef')) {
        app = app.replace(/import React, \{\s*useState,\s*useEffect\s*\}\s*from\s*["']react["'];/, 'import React, { useState, useEffect, useRef } from "react";');
    }

    // Inject Audio State
    if (!app.includes('globalTrackIndex')) {
        const stateInjection = `
  const audioRef = useRef(null);
  const [globalTrackIndex, setGlobalTrackIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioFiles = indexedFiles.filter(f => ['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg', 'wma'].includes(f.ext?.toLowerCase()));
  const currentTrack = globalTrackIndex !== null ? audioFiles[globalTrackIndex] : null;

  useEffect(() => {
    if (currentTrack && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: currentTrack.name, artist: 'Sovereign Audio' });
      navigator.mediaSession.setActionHandler('play', () => { if(audioRef.current){ audioRef.current.play(); setIsPlaying(true); } });
      navigator.mediaSession.setActionHandler('pause', () => { if(audioRef.current){ audioRef.current.pause(); setIsPlaying(false); } });
      navigator.mediaSession.setActionHandler('previoustrack', handlePrevTrack);
      navigator.mediaSession.setActionHandler('nexttrack', handleNextTrack);
    }
  }, [globalTrackIndex, currentTrack]);

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
`;
        app = app.replace(/const \[currentScreen, setCurrentScreen\] = useState\('home'\);/, `const [currentScreen, setCurrentScreen] = useState('home');\n${stateInjection}`);
    }

    // Pass Props to SovereignAudio route
    app = app.replace(/<SovereignAudio onNavigate=\{navigateTo\}\s*\/>/g, `<SovereignAudio onNavigate={navigateTo} globalTrackIndex={globalTrackIndex} isPlaying={isPlaying} handlePlayTrack={handlePlayTrack} togglePlay={togglePlay} stopAudio={stopAudio} handleNextTrack={handleNextTrack} handlePrevTrack={handlePrevTrack} audioRef={audioRef} />`);

    // Inject UI Player
    if (!app.includes('absolute bottom-0 inset-x-0 p-4')) {
        const uiInjection = `
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
      <audio ref={audioRef} onEnded={handleNextTrack} className="hidden" />
`;
        app = app.replace(/({\s*isLocked\s*&&\s*\([\s\S]*?\)\s*})/m, `${uiInjection}\n      $1`);
    }
    fs.writeFileSync(appPath, app);
}
