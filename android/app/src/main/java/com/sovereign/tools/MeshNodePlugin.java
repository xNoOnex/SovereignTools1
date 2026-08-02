package com.sovereign.tools;

import android.content.Intent;
import android.os.Build;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MeshNode")
public class MeshNodePlugin extends Plugin {

    @PluginMethod
    public void startNode(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), MeshRelayService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }
        call.resolve();
    }

    @PluginMethod
    public void stopNode(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), MeshRelayService.class);
        getContext().stopService(serviceIntent);
        call.resolve();
    }
}
