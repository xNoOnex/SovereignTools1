const fs = require('fs');
const path = 'android/app/src/main/AndroidManifest.xml';

try {
  let xml = fs.readFileSync(path, 'utf8');
  
  if (!xml.includes('moe.shizuku.manager.permission.API_V23')) {
    // Inject the Shizuku permission right before the closing manifest tag so it cannot fail
    xml = xml.replace('</manifest>', '    <uses-permission android:name="moe.shizuku.manager.permission.API_V23" />\n</manifest>');
    fs.writeFileSync(path, xml);
    console.log('SUCCESS: Shizuku permission hard-injected into AndroidManifest.xml');
  } else {
    console.log('NOTICE: Permission already exists in manifest.');
  }
} catch (e) {
  console.error('CRITICAL ERROR: Could not find or modify AndroidManifest.xml', e);
}
