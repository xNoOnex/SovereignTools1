const fs = require('fs');
const path = 'android/app/src/main/AndroidManifest.xml';

try {
  let xml = fs.readFileSync(path, 'utf8');

  // 1. Sanitize the mangled XML from our previous faulty injection
  xml = xml.replace(/<application\s*<provider[\s\S]*?multiprocess="false" \/>/g, '<application');

  // 2. Safely inject the Shizuku Provider cleanly BEFORE the closing application tag
  if (!xml.includes('rikka.shizuku.ShizukuProvider')) {
      const provider = `
        <provider
            android:name="rikka.shizuku.ShizukuProvider"
            android:authorities="${applicationId}.shizuku"
            android:multiprocess="false"
            android:enabled="true"
            android:exported="true" />
    </application>`;
      xml = xml.replace('</application>', provider);
  }

  // 3. Guarantee Storage Permissions are registered for the Scanners
  if (!xml.includes('READ_EXTERNAL_STORAGE')) {
      const perms = `
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
</manifest>`;
      xml = xml.replace('</manifest>', perms);
  }

  fs.writeFileSync(path, xml);
  console.log("SUCCESS: Manifest sanitized, repaired, and native permissions linked.");
} catch (e) {
  console.error("CRITICAL ERROR modifying manifest:", e);
}
