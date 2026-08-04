const fs = require('fs');
const path = 'src/components/Home.jsx';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');
  if (!code.includes("id: 'recorder'")) {
    const recorderTool = `    { id: 'recorder', icon: '🎙️', label: 'Stealth Recorder', desc: 'Voice Capture Archive', isExpert: false },\n`;
    code = code.replace(/(const allTools = \[\s*)/, `$1${recorderTool}`);
    fs.writeFileSync(path, code);
  }
}
