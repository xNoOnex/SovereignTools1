const fs = require('fs');
const path = 'android/app/build.gradle';

try {
  let gradle = fs.readFileSync(path, 'utf8');

  // Check if Shizuku dependencies are already there
  if (!gradle.includes('dev.rikka.shizuku:api')) {
    
    // Inject the exact dependencies you provided into the dependencies block
    const shizukuDeps = `
    def shizuku_version = '13.1.5'
    implementation "dev.rikka.shizuku:api:$shizuku_version"
    implementation "dev.rikka.shizuku:provider:$shizuku_version"
    `;

    // Safely insert before the closing bracket of the dependencies block
    gradle = gradle.replace(/dependencies\s*\{/, 'dependencies {\n' + shizukuDeps);
    
    fs.writeFileSync(path, gradle);
    console.log("SUCCESS: Shizuku Gradle dependencies injected.");
  } else {
    console.log("NOTICE: Gradle dependencies already present.");
  }
} catch (e) {
  console.error("ERROR modifying build.gradle:", e);
}
