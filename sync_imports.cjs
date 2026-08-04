const fs = require('fs');
const path = require('path');

const appPath = 'src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');
const componentsDir = 'src/components';
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx'));

function fixComponent(oldName, keywords) {
    // 1. Search for matching filename
    let targetFile = files.find(f => keywords.some(k => f.toLowerCase().includes(k)));
    
    // 2. If filename fails, search inside file contents
    if (!targetFile) {
        targetFile = files.find(f => {
            const content = fs.readFileSync(path.join(componentsDir, f), 'utf8').toLowerCase();
            return keywords.some(k => content.includes(k));
        });
    }
    
    if (!targetFile) return;

    // Extract the exact component name exported by the file
    const content = fs.readFileSync(path.join(componentsDir, targetFile), 'utf8');
    const match = content.match(/export (?:default )?function ([A-Za-z0-9_]+)/);
    const actualName = match ? match[1] : targetFile.replace('.jsx', '');

    // Replace the broken hardcoded import with the dynamic, verified path
    const importRegex = new RegExp(`import\\s+\\{\\s*${oldName}\\s*\\}\\s+from\\s+["']./components/${oldName}["'];?`, 'g');
    appCode = appCode.replace(importRegex, `import { ${actualName} } from "./components/${targetFile.replace('.jsx', '')}";`);

    // Replace the broken JSX rendering tag
    const tagRegex = new RegExp(`<${oldName}\\s+onNavigate=\\{navigateTo\\}\\s*/>`, 'g');
    appCode = appCode.replace(tagRegex, `<${actualName} onNavigate={navigateTo} />`);
}

// Sync all potentially misnamed files
fixComponent('DataShredder', ['shred', 'annihilate']);
fixComponent('Debloat', ['debloat', 'eradication']);
fixComponent('Settings', ['setting']);
fixComponent('NetSecOps', ['netsec']);

fs.writeFileSync(appPath, appCode);
