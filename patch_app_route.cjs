const fs = require('fs');
const path = 'src/App.jsx';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');
  if (!code.includes('<SovereignRecorder')) {
    if (!code.includes('import { SovereignRecorder }')) {
      code = `import { SovereignRecorder } from "./components/SovereignRecorder";\n` + code;
    }
    code = code.replace(
      /(<main className="pt-20 pb-8 flex-1 overflow-y-auto overflow-x-hidden">)/, 
      `$1\n        {currentScreen === 'recorder' && <SovereignRecorder onNavigate={navigateTo} />}`
    );
    fs.writeFileSync(path, code);
  }
}
