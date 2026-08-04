const fs = require('fs');

// 1. MANIFEST FIX: Anchor to the absolute end of the file
const manifestPath = 'android/app/src/main/AndroidManifest.xml';
if (fs.existsSync(manifestPath)) {
    let manifest = fs.readFileSync(manifestPath, 'utf8');
    if (!manifest.includes('moe.shizuku.manager.permission.API_V23')) {
        manifest = manifest.replace('</manifest>', '    <uses-permission android:name="moe.shizuku.manager.permission.API_V23" />\n    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n</manifest>');
        fs.writeFileSync(manifestPath, manifest);
    }
}

// 2. APP.JSX ROUTER FIX: Anchor directly to the Home route
const appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
    let appCode = fs.readFileSync(appPath, 'utf8');
    if (!appCode.includes('<SovereignRecorder')) {
        appCode = appCode.replace(/import\s*\{\s*Home\s*\}\s*from\s*["']\.\/components\/Home["'];?/, 'import { Home } from "./components/Home";\nimport { SovereignRecorder } from "./components/SovereignRecorder";');
        appCode = appCode.replace(/\{currentScreen\s*===\s*['"]home['"]\s*&&\s*<Home[^>]*>\}/, '{currentScreen === \'recorder\' && <SovereignRecorder onNavigate={navigateTo} />}\n        {currentScreen === \'home\' && <Home onNavigate={navigateTo} />}');
        fs.writeFileSync(appPath, appCode);
    }
}

// 3. HOME.JSX FIX: Force the Shizuku method update
const homePath = 'src/components/Home.jsx';
if (fs.existsSync(homePath)) {
    let homeCode = fs.readFileSync(homePath, 'utf8');
    homeCode = homeCode.replace(/res\.granted && res\.active/g, 'res.granted');
    homeCode = homeCode.replace(/await ShizukuRunner\.requestPermissions\(\);/g, 'await ShizukuRunner.forceShizukuLink();');
    if (!homeCode.includes("id: 'recorder'")) {
        homeCode = homeCode.replace(/(const allTools = \[\s*)/, `$1    { id: 'recorder', icon: '🎙️', label: 'Stealth Recorder', desc: 'Native Voice Capture', isExpert: false },\n`);
    }
    fs.writeFileSync(homePath, homeCode);
}

// 4. SHREDDER FIX: Bruteforce line deletion
const shredPath = 'src/components/DataShredder.jsx';
if (fs.existsSync(shredPath)) {
    const lines = fs.readFileSync(shredPath, 'utf8').split('\n');
    const cleanLines = lines.filter(line => !line.includes('FORCE PERMISSION REQUEST') && !line.includes('Link Engine on Dashboard'));
    fs.writeFileSync(shredPath, cleanLines.join('\n'));
}
