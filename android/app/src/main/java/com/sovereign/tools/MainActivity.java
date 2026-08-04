package com.sovereign.tools;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShizukuRunner.class);
        registerPlugin(StorageIntentBridge.class);
        registerPlugin(AlarmIntentBridge.class); // ADDED ALARM BRIDGE
        super.onCreate(savedInstanceState);
    }
}
