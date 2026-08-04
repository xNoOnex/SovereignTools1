const fs = require('fs');
const manifestPath = 'android/app/src/main/AndroidManifest.xml';
let pkgName = '';
try {
  const xml = fs.readFileSync(manifestPath, 'utf8');
  const match = xml.match(/package="([^"]*)"/);
  if (match) pkgName = match[1];
} catch (e) { process.exit(1); }

const pkgPath = pkgName.replace(/\./g, '/');
const mainActivityPath = `android/app/src/main/java/${pkgPath}/MainActivity.java`;

const cleanCode = `package ${pkgName};
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShizukuRunner.class);
        registerPlugin(StorageIntentBridge.class);
        registerPlugin(AlarmIntentBridge.class);
        registerPlugin(GlobalPermissionsBridge.class); // ADDED GLOBAL PERMISSIONS
        super.onCreate(savedInstanceState);
    }
}
`;
fs.writeFileSync(mainActivityPath, cleanCode);
