package com.sovereign.tools;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 1. MUST register custom native bridges BEFORE initializing Capacitor
        registerPlugin(ShizukuRunner.class);
        registerPlugin(WakeLockBridge.class);
        
        // 2. Boot the Capacitor WebView and load standard plugins (Filesystem, etc.)
        super.onCreate(savedInstanceState);
    }
}
