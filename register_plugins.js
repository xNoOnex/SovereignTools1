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

try {
  let mainAct = fs.readFileSync(mainActivityPath, 'utf8');
  
  // Check if already registered
  if (!mainAct.includes('registerPlugin(ShizukuRunner.class)')) {
    
    // Inject the import and override the onCreate method to register the plugins
    const importStatements = `
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.ArrayList;
`;
    
    const onCreateOverride = `
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register Custom Native Bridges
        registerPlugin(ShizukuRunner.class);
        registerPlugin(WakeLockBridge.class);
    }
`;
    
    // Simple regex to inject into the class
    mainAct = mainAct.replace('import com.getcapacitor.BridgeActivity;', importStatements);
    mainAct = mainAct.replace('public class MainActivity extends BridgeActivity {', 'public class MainActivity extends BridgeActivity {\n' + onCreateOverride);
    
    fs.writeFileSync(mainActivityPath, mainAct);
    console.log("SUCCESS: Native plugins strictly registered in MainActivity.");
  } else {
    console.log("NOTICE: Plugins already registered.");
  }
} catch (e) {
  console.error("Failed to inject MainActivity:", e);
}
