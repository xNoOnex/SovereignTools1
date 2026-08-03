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
import com.getcapacitor.Plugin;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Native OS Binding for Sovereign Plugins
        registerPlugin(ShizukuRunner.class);
        registerPlugin(WakeLockBridge.class);
    }
}
`;

try {
  fs.writeFileSync(mainActivityPath, cleanCode);
  console.log("SUCCESS: MainActivity.java rebuilt from scratch with clean plugin registration.");
} catch (e) {
  console.error("Failed to write clean MainActivity:", e);
}
