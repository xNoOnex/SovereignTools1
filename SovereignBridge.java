import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.webkit.JavascriptInterface;
import org.json.JSONArray;
import java.util.List;

public class SovereignBridge {
    Context mContext;

    // Instantiate the interface and set the context
    SovereignBridge(Context c) {
        mContext = c;
    }

    // 1. Auto-Pull Android Packages for the Debloater
    @JavascriptInterface
    public String getSystemPackages() {
        PackageManager pm = mContext.getPackageManager();
        List<ApplicationInfo> packages = pm.getInstalledApplications(PackageManager.GET_META_DATA);
        
        JSONArray jsonArray = new JSONArray();
        for (ApplicationInfo packageInfo : packages) {
            jsonArray.put(packageInfo.packageName);
        }
        return jsonArray.toString(); // Returns a clean JSON array to your frontend
    }

    // 2. Auto-Pull Storage Files (Add more paths as needed)
    // Note: Requires READ_EXTERNAL_STORAGE permission in AndroidManifest
    @JavascriptInterface
    public String getMediaFiles() {
        // You can expand this Java logic to scan specific directories
        // For now, passing a simple status check to prove the bridge works
        return "[\"/storage/emulated/0/DCIM/test_image.jpg\"]"; 
    }

    // 3. Native Alarm/Notification Trigger
    @JavascriptInterface
    public void scheduleAlarm(String title, String timestamp) {
        // Trigger a native Android Toast to verify the bridge works tonight
        android.widget.Toast.makeText(mContext, "Event Logged: " + title, android.widget.Toast.LENGTH_LONG).show();
    }
}

