const fs = require('fs');
const path = 'src/App.jsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('<SovereignRecorder')) {
  // Add Import
  if (!code.includes('import { SovereignRecorder }')) {
    code = `import { SovereignRecorder } from "./components/SovereignRecorder";\n` + code;
  }
  // Add Route
  code = code.replace(
    /(<main className="pt-20 pb-8 flex-1 overflow-y-auto overflow-x-hidden">)/, 
    `$1\n        {currentScreen === 'recorder' && <SovereignRecorder onNavigate={navigateTo} />}`
  );
  fs.writeFileSync(path, code);
}
