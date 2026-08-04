const fs = require('fs');
const path = 'android/app/src/main/AndroidManifest.xml';

try {
  let xml = fs.readFileSync(path, 'utf8');

  // 1. Wipe out any existing ShizukuProvider block to prevent duplicates
  xml = xml.replace(/<provider[^>]*rikka\.shizuku\.ShizukuProvider[^>]*\/>/g, '');

  // 2. Inject the perfect provider with the INTERACT_ACROSS_USERS_FULL permission
  const exactProvider = `
        <provider
            android:name="rikka.shizuku.ShizukuProvider"
            android:authorities="\${applicationId}.shizuku"
            android:multiprocess="false"
            android:enabled="true"
            android:exported="true"
            android:permission="android.permission.INTERACT_ACROSS_USERS_FULL" />
  `;
  
  xml = xml.replace('</application>', exactProvider + '\n    </application>');
  fs.writeFileSync(path, xml);
  
  console.log("SUCCESS: Provider upgraded with INTERACT_ACROSS_USERS_FULL permission.");
} catch (e) {
  console.error("ERROR modifying manifest:", e);
}
