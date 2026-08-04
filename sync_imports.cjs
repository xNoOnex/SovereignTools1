const fs = require('fs');
const path = require('path');

const appPath = 'src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');
const componentsDir = 'src/components';
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx'));

function fixComponent(oldName, keywords) {
    let targetFile = files.find(f => keywords.some(k => f.toLowerCase().includes(k)));
    
    if (!targetFile) {
        targetFile = files.find(f => {
            const content = fs.readFileSync(path.join(componentsDir, f), 'utf8').toLowerCase();
            return keywords.some(k => content.includes(k));
        });
    }
    
    if (!targetFile) return;

    const content = fs.readFileSync(path.join(componentsDir, targetFile), 'utf8');
    const match = content.match(/export (?:default )?function ([A-Za-z0-9_]+)/);
    const actualName = match ? match[1] : targetFile.replace('.jsx', '');

    const importRegex = new RegExp(`import\\s+\\{\\s*${oldName}\\s*\\}\\s+from\\s+["']./components/${oldName}["'];?`, 'g');
    appCode = appCode.replace(importRegex, `import { ${actualName} } from "./components/${targetFile.replace('.jsx', '')}";`);

    const tagRegex = new RegExp(`<${oldName}\\s+onNavigate=\\{navigateTo\\}\\s*/>`, 'g');
    appCode = appCode.replace(tagRegex, `<${actualName} onNavigate={navigateTo} />`);
}

// Fix CommLink and everything else that might trigger this error
fixComponent('CommLink', ['comm', 'p2p', 'message']);
fixComponent('SmartAI', ['ai', 'smart']);
fixComponent('SecureVault', ['vault', 'secure']);
fixComponent('EncryptedDocs', ['doc', 'markdown']);
fixComponent('SovereignCamera', ['camera']);
fixComponent('AESCipher', ['aes', 'cipher']);
fixComponent('StealthCalc', ['calc']);

fs.writeFileSync(appPath, appCode);
