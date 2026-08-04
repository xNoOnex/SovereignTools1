const fs = require('fs');

// 1. Safely wire into App.jsx
const appPath = 'src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');
if (!appCode.includes('SovereignRecorder')) {
    appCode = `import { SovereignRecorder } from "./components/SovereignRecorder";\n` + appCode;
    appCode = appCode.replace(/(<main[^>]*>)/, `$1\n        {currentScreen === 'recorder' && <SovereignRecorder onNavigate={navigateTo} />}`);
    fs.writeFileSync(appPath, appCode);
}

// 2. Safely wire into Home.jsx
const homePath = 'src/components/Home.jsx';
let homeCode = fs.readFileSync(homePath, 'utf8');
if (!homeCode.includes("id: 'recorder'")) {
    const recorderTool = `    { id: 'recorder', icon: '🎙️', label: 'Stealth Recorder', desc: 'Native Voice Capture', isExpert: false },\n`;
    homeCode = homeCode.replace(/(const allTools = \[\s*)/, `$1${recorderTool}`);
    fs.writeFileSync(homePath, homeCode);
}
