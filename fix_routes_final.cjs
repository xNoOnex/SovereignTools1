const fs = require('fs');
const appPath = 'src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');

// Force App.jsx to point to the modern files, not the legacy backups
const replacements = [
    // Fix NetSec
    { old: /import \{ NetSecOps \} from "\.\/components\/[^"]+";/, new: 'import { NetSecOpsHub } from "./components/NetSecOpsHub";' },
    { old: /<NetSecOps onNavigate=\{navigateTo\} \/>/, new: '<NetSecOpsHub onNavigate={navigateTo} />' },
    
    // Fix Comms (P2P Mesh)
    { old: /import \{ CommLink \} from "\.\/components\/[^"]+";/, new: 'import { P2PMeshLink } from "./components/P2PMeshLink";' },
    { old: /<CommLink onNavigate=\{navigateTo\} \/>/, new: '<P2PMeshLink onNavigate={navigateTo} />' },
    
    // Fix Camera
    { old: /import \{ SovereignCamera \} from "\.\/components\/[^"]+";/, new: 'import { StealthCamera } from "./components/StealthCamera";' },
    { old: /<SovereignCamera onNavigate=\{navigateTo\} \/>/, new: '<StealthCamera onNavigate={navigateTo} />' }
];

for (let r of replacements) {
    appCode = appCode.replace(r.old, r.new);
}

fs.writeFileSync(appPath, appCode);

// Fix the localSDP crash in the modern P2PMeshLink if it exists
const commsPath = 'src/components/P2PMeshLink.jsx';
if (fs.existsSync(commsPath)) {
    let commsCode = fs.readFileSync(commsPath, 'utf8');
    // Ensure onNavigate is destructured properly so exit buttons work
    if (!commsCode.includes('export function P2PMeshLink({ onNavigate })')) {
        commsCode = commsCode.replace(/export function P2PMeshLink\(\s*\)\s*\{/, 'export function P2PMeshLink({ onNavigate }) {');
    }
    fs.writeFileSync(commsPath, commsCode);
}
