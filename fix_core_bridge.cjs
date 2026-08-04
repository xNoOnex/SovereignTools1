const fs = require('fs');

const manifestPath = 'android/app/src/main/AndroidManifest.xml';
let pkgName = '';
try {
  const xml = fs.readFileSync(manifestPath, 'utf8');
  const match = xml.match(/package="([^"]*)"/);
  if (match) pkgName = match[1];
} catch (e) {
  console.error("Could not read package name:", e);
  process.exit(1);
}

const pkgPath = pkgName.replace(/\./g, '/');
const mainActivityPath = `android/app/src/main/java/${pkgPath}/MainActivity.java`;

const cleanCode = `package ${pkgName};

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 1. MUST boot the Capacitor core first to load Filesystem, Audio, etc.
        super.onCreate(savedInstanceState);
        
        // 2. Register native custom bridges AFTER the core is alive
        registerPlugin(ShizukuRunner.class);
        
        try {
            // Keep WakeLock if you have it in your project
            Class<?> wakeLockClass = Class.forName(getPackageName() + ".WakeLockBridge");
            registerPlugin((Class<? extends com.getcapacitor.Plugin>) wakeLockClass);
        } catch (ClassNotFoundException e) {
            // Ignore if WakeLockBridge doesn't exist
        }
    }
}
`;

try {
  fs.writeFileSync(mainActivityPath, cleanCode);
  console.log("SUCCESS: MainActivity repaired. Core Capacitor plugins will now boot correctly.");
} catch (e) {
  console.error("Failed to write clean MainActivity:", e);
}
