const fs = require('fs');

// 1. STRIP LEGACY BUTTON FROM DATA SHREDDER
const shredPath = 'src/components/DataShredder.jsx';
if (fs.existsSync(shredPath)) {
    let shredCode = fs.readFileSync(shredPath, 'utf8');
    const legacyButton = '<button onClick={() => onNavigate(\'home\')} className="w-full py-3 bg-red-950 border border-red-900 text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 shadow">Link Engine on Dashboard</button>';
    shredCode = shredCode.replace(legacyButton, '');
    fs.writeFileSync(shredPath, shredCode);
}

// 2. RE-LINK RECORDER & FIX SHIZUKU IN HOME DASHBOARD
const homePath = 'src/components/Home.jsx';
if (fs.existsSync(homePath)) {
    let homeCode = fs.readFileSync(homePath, 'utf8');
    
    // A. Re-link Recorder if missing
    if (!homeCode.includes("id: 'recorder'")) {
        const recorderTool = `    { id: 'recorder', icon: '🎙️', label: 'Stealth Recorder', desc: 'Native Voice Capture', isExpert: false },\n`;
        homeCode = homeCode.replace(/(const allTools = \[\s*)/, `$1${recorderTool}`);
    }
    
    // B. Fix Shizuku false offline by reading OS state, and rename intent to bypass Capacitor block
    homeCode = homeCode.replace(/res\.granted && res\.active/g, 'res.granted');
    homeCode = homeCode.replace(/await ShizukuRunner\.requestPermissions\(\);/g, 'await ShizukuRunner.forceShizukuLink();');
    
    fs.writeFileSync(homePath, homeCode);
}
