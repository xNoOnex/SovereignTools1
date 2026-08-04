package com.sovereign.tools;

import android.Manifest;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

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
            // FIX: Provide the mandatory callback string as the second argument
            requestAllPermissions(call, "permissionComplete");
        } else {
            call.resolve();
        }
    }

    // FIX: Define the required callback function to resolve the promise
    @PermissionCallback
    private void permissionComplete(PluginCall call) {
        call.resolve();
    }
}
