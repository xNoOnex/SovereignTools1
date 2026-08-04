const fs = require('fs');

// Inject Shizuku Permission into Manifest
const manifestPath = 'android/app/src/main/AndroidManifest.xml';
if (fs.existsSync(manifestPath)) {
    let manifestCode = fs.readFileSync(manifestPath, 'utf8');
    if (!manifestCode.includes('moe.shizuku.manager.permission.API_V23')) {
        manifestCode = manifestCode.replace(
            /<uses-permission android:name="android\.permission\.INTERNET"\s*\/>/,
            '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="moe.shizuku.manager.permission.API_V23" />\n    <uses-permission android:name="android.permission.RECORD_AUDIO" />'
        );
        fs.writeFileSync(manifestPath, manifestCode);
    }
}

// Strip Force Request Button from Shredder
const shredPath = 'src/components/DataShredder.jsx';
if (fs.existsSync(shredPath)) {
    let shredCode = fs.readFileSync(shredPath, 'utf8');
    shredCode = shredCode.replace(/<button[^>]*>\s*FORCE PERMISSION REQUEST\s*<\/button>/gi, '');
    fs.writeFileSync(shredPath, shredCode);
}
