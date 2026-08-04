const fs = require('fs');
const path = 'src/App.jsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('GlobalPermissions.requestAll()')) {
  if (!code.includes("registerPlugin('GlobalPermissions')")) {
    const importInject = `import { registerPlugin } from '@capacitor/core';\nconst GlobalPermissions = registerPlugin('GlobalPermissions');\n`;
    code = importInject + code;
  }
  
  // Inject into the main App initialization useEffect
  code = code.replace('useEffect(() => {', 'useEffect(() => {\n    try { GlobalPermissions.requestAll(); } catch(e) {}\n');
  fs.writeFileSync(path, code);
}
