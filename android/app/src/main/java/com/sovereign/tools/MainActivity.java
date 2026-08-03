package com.sovereign.tools;

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
