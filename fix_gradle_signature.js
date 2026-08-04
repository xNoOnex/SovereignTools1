const fs = require('fs');
const path = 'android/app/build.gradle';
let gradle = fs.readFileSync(path, 'utf8');

if (!gradle.includes("storeFile file('debug.keystore')")) {
  const signingConfig = `
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
  `;
  
  // Inject signingConfigs block right before buildTypes
  gradle = gradle.replace(/buildTypes\s*\{/, signingConfig + '\n    buildTypes {');
  
  // Inject the specific signingConfig line into the debug build type
  gradle = gradle.replace(/debug\s*\{/, "debug {\n            signingConfig signingConfigs.debug");
  
  fs.writeFileSync(path, gradle);
  console.log("SUCCESS: Gradle wired to static debug.keystore");
} else {
  console.log("NOTICE: Gradle already configured for static keystore");
}
