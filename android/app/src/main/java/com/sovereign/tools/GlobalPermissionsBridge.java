package com.sovereign.tools;

import android.Manifest;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "GlobalPermissions",
    permissions = {
        @Permission(strings = {Manifest.permission.CAMERA}, alias = "camera"),
        @Permission(strings = {Manifest.permission.RECORD_AUDIO}, alias = "microphone"),
        @Permission(strings = {Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, alias = "location")
    }
)
public class GlobalPermissionsBridge extends Plugin {
    @PluginMethod
    public void requestAll(PluginCall call) {
        if (!hasRequiredPermissions()) {
            // This triggers Android's native sequential permission popups
            requestAllPermissions(call);
        } else {
            call.resolve();
        }
    }
}
