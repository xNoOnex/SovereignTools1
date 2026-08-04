const fs = require('fs');

// 1. Fix Home Button in App.jsx (No Regex)
const appPath = 'src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');

const targetImg = '<img src="/assets/icon/icon.png" alt="Logo" className="w-full h-full object-cover" />';
const newIcon = '<span className="text-xl">🏠</span><span className="text-white font-black text-[12px] tracking-widest uppercase ml-2">HOME</span>';

if (appCode.includes(targetImg)) {
    appCode = appCode.split(targetImg).join(newIcon);
    appCode = appCode.split('Sovereign<br/>Tools').join('');
    fs.writeFileSync(appPath, appCode);
}

// 2. Fix Shizuku Call in Home.jsx (No Regex)
const homePath = 'src/components/Home.jsx';
let homeCode = fs.readFileSync(homePath, 'utf8');
homeCode = homeCode.split('await ShizukuRunner.requestPermissions();').join('await ShizukuRunner.forceShizukuLink();');
fs.writeFileSync(homePath, homeCode);

// 3. Inject Mic Request into Recorder (No Regex)
const recPath = 'src/components/SovereignRecorder.jsx';
let recCode = fs.readFileSync(recPath, 'utf8');
if (!recCode.includes('ShizukuRunner.requestMic')) {
    if (!recCode.includes("const ShizukuRunner = registerPlugin('ShizukuRunner');")) {
        recCode = recCode.split("import { Capacitor } from '@capacitor/core';").join("import { Capacitor, registerPlugin } from '@capacitor/core';\nconst ShizukuRunner = registerPlugin('ShizukuRunner');");
    }
    recCode = recCode.split("const startRecording = async () => {").join("const startRecording = async () => {\n    await ShizukuRunner.requestMic();");
    fs.writeFileSync(recPath, recCode);
}
