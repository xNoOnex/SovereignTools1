package com.sovereign.tools;

import android.os.PowerManager;
import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WakeLockBridge")
public class WakeLockBridge extends Plugin {
    private PowerManager.WakeLock wakeLock;

    @PluginMethod
    public void acquire(PluginCall call) {
        if (wakeLock == null) {
            PowerManager powerManager = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SovereignAudio::BackgroundPlay");
        }
        if (!wakeLock.isHeld()) {
            wakeLock.acquire();
        }
        call.resolve();
    }

    @PluginMethod
    public void release(PluginCall call) {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        call.resolve();
    }
}
