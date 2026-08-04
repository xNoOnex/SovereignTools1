const fs = require('fs');
const path = 'android/app/src/main/AndroidManifest.xml';
let xml = fs.readFileSync(path, 'utf8');
if (!xml.includes('com.android.alarm.permission.SET_ALARM')) {
  xml = xml.replace('<application', '    <uses-permission android:name="com.android.alarm.permission.SET_ALARM" />\n    <application');
  fs.writeFileSync(path, xml);
}
