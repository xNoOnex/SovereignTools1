const fs = require('fs');
const path = require('path');

// 1. FIX THE AUDIO PLAYER
const appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
    let app = fs.readFileSync(appPath, 'utf8');

    // Nuke the old invisible player
    const pStart = app.indexOf('{currentTrack &&');
    const pEnd = app.indexOf('<audio ref={audioRef}');
    if (pStart !== -1 && pEnd !== -1) {
        app = app.substring(0, pStart) + app.substring(pEnd);
    }

    // Inject the new massive, globally persistent, clickable player
    const newPlayer = `
      {currentTrack && (
         <div className="fixed bottom-20 inset-x-0 p-3 z-[9999] animate-fadeIn">
            <div className="bg-zinc-950/95 border-t border-cyan-500/50 p-4 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.9)] backdrop-blur-xl flex flex-col gap-3">
               <div className="flex items-center gap-4 overflow-hidden cursor-pointer" onClick={() => (typeof navigateTo === 'function' ? navigateTo('audio') : (typeof setCurrentScreen === 'function' ? setCurrentScreen('audio') : null))}>
                  <div className="w-12 h-12 bg-cyan-900/40 rounded-full flex items-center justify-center border border-cyan-500/50 shrink-0 shadow-inner">
                      <span className="text-2xl animate-pulse text-cyan-400">{isPlaying ? '🔊' : '🎵'}</span>
                  </div>
                  <div className="truncate flex-1">
                     <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest block mb-1">Now Playing</span>
                     <span className="text-sm font-bold text-white truncate block">{currentTrack.name || 'Unknown Track'}</span>
                  </div>
               </div>
               <div className="flex justify-between items-center px-2 mt-1">
                  <button onClick={(e) => { e.stopPropagation(); if (audioRef.current) audioRef.current.currentTime -= 15; }} className="text-zinc-400 hover:text-white font-black text-xl p-2 active:scale-90 transition-transform">⏪</button>
                  <div className="flex gap-4 items-center">
                     <button onClick={(e) => { e.stopPropagation(); handlePrevTrack(); }} className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-lg border border-zinc-700 active:scale-95 text-white shadow-md">⏮</button>
                     <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center text-2xl font-black border border-cyan-400 active:scale-95 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all">
                        {isPlaying ? '⏸' : '▶'}
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); handleNextTrack(); }} className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-lg border border-zinc-700 active:scale-95 text-white shadow-md">⏭</button>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); if (audioRef.current) audioRef.current.currentTime += 15; }} className="text-zinc-400 hover:text-white font-black text-xl p-2 active:scale-90 transition-transform">⏩</button>
               </div>
            </div>
         </div>
      )}
`;
    app = app.replace(/<audio ref=\{audioRef\}/, newPlayer + '\n      <audio ref={audioRef}');
    fs.writeFileSync(appPath, app);
}

// 2. FIX SHIZUKU COMMANDS & HOME DESCRIPTIONS
const compDir = 'src/components';
if (fs.existsSync(compDir)) {
    fs.readdirSync(compDir).forEach(file => {
        if (!file.endsWith('.jsx') && !file.endsWith('.js')) return;
        const p = path.join(compDir, file);
        let c = fs.readFileSync(p, 'utf8');
        let mod = false;

        // Bypass Android 10+ Security Restrictions
        if (c.includes('pm list packages') && !c.includes('--user 0')) {
            c = c.replace(/pm list packages/g, 'pm list packages --user 0');
            mod = true;
        }
        if (c.includes('netstat')) {
            c = c.replace(/netstat -[a-zA-Z]+/g, 'ss -tunlp');
            c = c.replace(/"netstat"/g, '"ss", "-tunlp"');
            c = c.replace(/'netstat'/g, "'ss -tunlp'");
            mod = true;
        }
        if (c.includes('arp')) {
            c = c.replace(/arp -a/g, 'ip neigh show');
            c = c.replace(/"arp", "-a"/g, '"ip", "neigh", "show"');
            c = c.replace(/"arp"/g, '"ip", "neigh", "show"');
            c = c.replace(/'arp'/g, "'ip neigh show'");
            mod = true;
        }

        // Translate to Layman Terms
        if (file.includes('Home')) {
            c = c.replace(/Freeze & Nuke System Bloat/gi, "Remove bloatware & hidden apps");
            c = c.replace(/Zero-fill Metadata Obfuscation/gi, "Permanently erase sensitive files");
            c = c.replace(/Network Map & Root Shell/gi, "Network scanners & diagnostics");
            c = c.replace(/P2P Encrypted Messaging/gi, "Secure offline chat");
            mod = true;
        }

        if (mod) fs.writeFileSync(p, c);
    });
}
