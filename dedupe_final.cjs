const fs = require('fs');
const path = 'src/App.jsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');
const seen = new Set();
const out = [];

for (let line of lines) {
    const match = line.match(/import\s+\{\s*([A-Za-z0-9_]+)\s*\}/);
    if (match) {
        const componentName = match[1];
        if (seen.has(componentName)) {
            continue; // Skip the duplicate
        }
        seen.add(componentName);
    }
    out.push(line);
}

fs.writeFileSync(path, out.join('\n'));
