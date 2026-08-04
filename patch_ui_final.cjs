const fs = require('fs');

// Fix Home Button in App.jsx
const appPath = 'src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');
const brokenHeader = `<div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-zinc-700 shadow-xl shadow-[var(--accent-glow)] shrink-0">\\s*<img src="/assets/icon/icon.png" alt="Logo" className="w-full h-full object-cover" />\\s*</div>\\s*<div className="flex flex-col">\\s*<span className="text-white font-black text-sm tracking-widest uppercase leading-tight select-none">Sovereign<br/>Tools</span>\\s*</div>`;
const newHomeButton = `<div className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2 active:scale-95 transition-transform shadow-lg"><span className="text-xl">🏠</span><span className="text-white font-black text-[10px] tracking-widest uppercase">Home</span></div>`;
appCode = appCode.replace(new RegExp(brokenHeader, 'g'), newHomeButton);
fs.writeFileSync(appPath, appCode);

// Fix Shizuku Call in Home.jsx
const homePath = 'src/components/Home.jsx';
let homeCode = fs.readFileSync(homePath, 'utf8');
homeCode = homeCode.replace(/await ShizukuRunner\.requestPermissions\(\);/g, 'await ShizukuRunner.forceShizukuLink();');
fs.writeFileSync(homePath, homeCode);

// Inject Mic Request into Recorder
const recPath = 'src/components/SovereignRecorder.jsx';
let recCode = fs.readFileSync(recPath, 'utf8');
if (!recCode.includes('ShizukuRunner.requestMic')) {
    // Import ShizukuRunner if not present
    if (!recCode.includes("const ShizukuRunner = registerPlugin('ShizukuRunner');")) {
        recCode = recCode.replace(/import \{ Capacitor \} from '@capacitor\/core';/, "import { Capacitor, registerPlugin } from '@capacitor/core';\nconst ShizukuRunner = registerPlugin('ShizukuRunner');");
    }
    // Inject permission check before recording
    recCode = recCode.replace(/const startRecording = async \(\) => \{/, "const startRecording = async () => {\n    await ShizukuRunner.requestMic();");
    fs.writeFileSync(recPath, recCode);
}
