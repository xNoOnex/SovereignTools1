package com.sovereign.tools;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Force Capacitor to recognize our custom Kernel Plugin
        registerPlugin(SovereignGattPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
