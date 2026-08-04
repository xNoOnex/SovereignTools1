const fs = require('fs');
const path = 'android/app/src/main/AndroidManifest.xml';

try {
  let xml = fs.readFileSync(path, 'utf8');

  // Inject Legacy Storage flag for Android 11+ transition
  if (!xml.includes('requestLegacyExternalStorage="true"')) {
    xml = xml.replace('<application', '<application android:requestLegacyExternalStorage="true"');
  }

  // Inject full MANAGE_EXTERNAL_STORAGE for raw file access
  if (!xml.includes('MANAGE_EXTERNAL_STORAGE')) {
    xml = xml.replace('</manifest>', '    <uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />\n</manifest>');
  }

  fs.writeFileSync(path, xml);
  console.log("SUCCESS: Storage permissions escalated in AndroidManifest.");
} catch (e) {
  console.error("ERROR modifying manifest:", e);
}
