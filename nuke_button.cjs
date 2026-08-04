const fs = require('fs');
const shredPath = 'src/components/DataShredder.jsx';

if (fs.existsSync(shredPath)) {
    let shredCode = fs.readFileSync(shredPath, 'utf8');
    
    // [\s\S]*? allows the search to cross line breaks to kill the entire multi-line JSX element
    shredCode = shredCode.replace(/<button[^>]*>[\s\S]*?FORCE PERMISSION REQUEST[\s\S]*?<\/button>/gi, '');
    
    fs.writeFileSync(shredPath, shredCode);
}
