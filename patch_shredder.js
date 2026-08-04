const fs = require('fs');
const path = 'src/components/DataShredder.jsx';
let code = fs.readFileSync(path, 'utf8');

// Remove the legacy force permission button from the Shredder
const blockToRemove = `<button onClick={() => onNavigate('home')} className="w-full py-3 bg-red-950 border border-red-900 text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 shadow">Link Engine on Dashboard</button>`;
code = code.replace(blockToRemove, '');

fs.writeFileSync(path, code);
