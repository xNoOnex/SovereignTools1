const fs = require('fs');
const path = 'android/app/src/main/AndroidManifest.xml';
let xml = fs.readFileSync(path, 'utf8');

const providerStr = '<provider android:name="rikka.shizuku.ShizukuProvider" android:authorities="${applicationId}.shizuku" android:multiprocess="false" android:enabled="true" android:exported="true" android:permission="android.permission.INTERACT_ACROSS_USERS_FULL" />';

if (!xml.includes('rikka.shizuku.ShizukuProvider')) {
  xml = xml.replace('</application>', '    ' + providerStr + '\n    </application>');
  fs.writeFileSync(path, xml);
}
