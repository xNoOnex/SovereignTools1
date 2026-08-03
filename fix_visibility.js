const fs = require('fs');
const path = 'android/app/src/main/AndroidManifest.xml';

try {
  let xml = fs.readFileSync(path, 'utf8');

  if (!xml.includes('moe.shizuku.manager')) {
    const queriesBlock = `
    <queries>
        <!-- Required for Android 11+ to see Shizuku Manager -->
        <package android:name="moe.shizuku.manager" />
        <provider android:authorities="moe.shizuku.manager.shizuku" />
    </queries>
    <application`;
    
    xml = xml.replace('<application', queriesBlock);
    fs.writeFileSync(path, xml);
    console.log("SUCCESS: Package Visibility blindfold removed.");
  } else {
    console.log("NOTICE: Queries block already exists.");
  }
} catch (e) {
  console.error("ERROR:", e);
}
