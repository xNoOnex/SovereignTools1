const fs = require('fs');
const path = 'src/App.jsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');
const seen = new Set();
const out = [];

for (let line of lines) {
    // Check if the line is an import statement
    const match = line.match(/import\s+\{\s*([A-Za-z0-9_]+)\s*\}/);
    if (match) {
        const componentName = match[1];
        // If we already imported this component, skip this line and delete it
        if (seen.has(componentName)) {
            continue;
        }
        // Otherwise, mark it as seen and keep the line
        seen.add(componentName);
    }
    out.push(line);
}

fs.writeFileSync(path, out.join('\n'));
