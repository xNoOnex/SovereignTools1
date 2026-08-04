const fs = require('fs');

// 1. ALIGN SHREDDER AND RIP OUT LEFTOVER BUTTON
const shredPath = 'src/components/DataShredder.jsx';
if (fs.existsSync(shredPath)) {
    let shredCode = fs.readFileSync(shredPath, 'utf8');
    
    // Fix the method name
    shredCode = shredCode.replace(/ShizukuRunner\.requestPermissions?\(\)/g, 'ShizukuRunner.forceShizukuLink()');
    
    // Nuke the "FORCE PERMISSION REQUEST" button line completely
    const lines = shredCode.split('\n');
    const cleanLines = lines.filter(line => !line.includes('FORCE PERMISSION REQUEST'));
    fs.writeFileSync(shredPath, cleanLines.join('\n'));
}

// 2. ALIGN HOME DASHBOARD
const homePath = 'src/components/Home.jsx';
if (fs.existsSync(homePath)) {
    let homeCode = fs.readFileSync(homePath, 'utf8');
    
    // Fix the method name so the dashboard button actually fires
    homeCode = homeCode.replace(/ShizukuRunner\.requestPermissions?\(\)/g, 'ShizukuRunner.forceShizukuLink()');
    
    fs.writeFileSync(homePath, homeCode);
}
