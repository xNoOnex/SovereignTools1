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
        // 1. MUST register custom native bridges BEFORE initializing Capacitor
        registerPlugin(ShizukuRunner.class);
        
        // 2. Boot the Capacitor WebView and lock the plugin registry
        super.onCreate(savedInstanceState);
    }
}
`;

try {
  fs.writeFileSync(mainActivityPath, cleanCode);
  console.log("SUCCESS: MainActivity repaired with strict Capacitor boot sequence.");
} catch (e) {
  console.error("Failed to write clean MainActivity:", e);
}
