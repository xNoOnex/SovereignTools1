const fs = require('fs');
const path = 'android/app/src/main/AndroidManifest.xml';

try {
  let xml = fs.readFileSync(path, 'utf8');

  if (!xml.includes('moe.shizuku.manager.permission.API_V23')) {
    // Inject the Shizuku permission right alongside the storage permissions
    xml = xml.replace('<application', '    <uses-permission android:name="moe.shizuku.manager.permission.API_V23" />\n    <application');
    fs.writeFileSync(path, xml);
    console.log("SUCCESS: Shizuku API_V23 permission formally declared.");
  } else {
    console.log("NOTICE: Permission already declared.");
  }
} catch (e) {
  console.error("ERROR modifying manifest:", e);
}
