const fs = require('fs');
const path = 'android/app/src/main/AndroidManifest.xml';
let xml = fs.readFileSync(path, 'utf8');

const perms = [
  'android.permission.CAMERA',
  'android.permission.RECORD_AUDIO',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION'
];

perms.forEach(p => {
  if (!xml.includes(p)) {
    xml = xml.replace('<application', `    <uses-permission android:name="${p}" />\n    <application`);
  }
});
fs.writeFileSync(path, xml);
