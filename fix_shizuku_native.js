const fs = require('fs');

// 1. Update build.gradle
const gradlePath = 'android/app/build.gradle';
try {
  let gradle = fs.readFileSync(gradlePath, 'utf8');
  if (!gradle.includes('dev.rikka.shizuku:api')) {
    // Append dependencies inside the dependencies block
    const target = 'dependencies {';
    const replacement = 'dependencies {\n    implementation "dev.rikka.shizuku:api:13.1.5"\n    implementation "dev.rikka.shizuku:provider:13.1.5"';
    gradle = gradle.replace(target, replacement);
    fs.writeFileSync(gradlePath, gradle);
    console.log('SUCCESS: Shizuku Gradle dependencies added.');
  } else {
    console.log('NOTICE: Gradle dependencies already present.');
  }
} catch (e) {
  console.error('Error updating build.gradle:', e);
}

// 2. Update AndroidManifest.xml with ShizukuProvider
const xmlPath = 'android/app/src/main/AndroidManifest.xml';
try {
  let xml = fs.readFileSync(xmlPath, 'utf8');
  if (!xml.includes('rikka.shizuku.ShizukuProvider')) {
    const providerTag = `
        <provider
            android:name="rikka.shizuku.ShizukuProvider"
            android:authorities="\${applicationId}.shizuku-provider"
            android:enabled="true"
            android:exported="true"
            android:multiprocess="false" />
    `;
    xml = xml.replace('<application', '<application' + providerTag);
    fs.writeFileSync(xmlPath, xml);
    console.log('SUCCESS: ShizukuProvider added to AndroidManifest.');
  } else {
    console.log('NOTICE: ShizukuProvider already present in manifest.');
  }
} catch (e) {
  console.error('Error updating AndroidManifest:', e);
}
