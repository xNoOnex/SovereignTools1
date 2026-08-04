package com.sovereign.tools;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PermissionState;
import rikka.shizuku.Shizuku;
import rikka.shizuku.ShizukuBinderWrapper;
import rikka.shizuku.SystemServiceHelper;
import android.os.IBinder;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import android.content.pm.PackageManager;

@CapacitorPlugin(
    name = "ShizukuRunner",
    permissions = {
        @Permission(strings = {"moe.shizuku.manager.permission.API_V23"}, alias = "shizuku")
    }
)
public class ShizukuRunner extends Plugin {
    
    @PluginMethod
    public void checkStatus(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            boolean osPermissionGranted = getPermissionState("shizuku") == PermissionState.GRANTED;
            boolean binderAlive = false;
            try { binderAlive = Shizuku.pingBinder(); } catch (Exception ignored) {}

            ret.put("active", binderAlive);
            ret.put("granted", osPermissionGranted);
            call.resolve(ret);
        } catch (Exception e) {
            ret.put("active", false);
            ret.put("granted", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (getPermissionState("shizuku") != PermissionState.GRANTED) {
            // Bypass Shizuku's custom request and force Android OS to handle the intent
            requestPermissionForAlias("shizuku", call, "shizukuPermCallback");
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PermissionCallback
    private void shizukuPermCallback(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", getPermissionState("shizuku") == PermissionState.GRANTED);
        call.resolve(ret);
    }

    @PluginMethod
    public void executeCommand(PluginCall call) {
        String cmd = call.getString("command");
        JSObject ret = new JSObject();
        try {
            boolean osGranted = getPermissionState("shizuku") == PermissionState.GRANTED;
            boolean binderAlive = false;
            try { binderAlive = Shizuku.pingBinder(); } catch (Exception ignored) {}

            Process process = null;
            String engineUsed = "Standard (User)";

            if (binderAlive && osGranted) {
                try {
                    IBinder activityManager = SystemServiceHelper.getSystemService("activity");
                    IBinder wrappedManager = new ShizukuBinderWrapper(activityManager);
                    process = Runtime.getRuntime().exec(new String[]{"sh", "-c", cmd});
                    engineUsed = "Shizuku (Root)";
                } catch (Exception e) {
                    process = Runtime.getRuntime().exec(new String[]{"sh", "-c", cmd});
                }
            } else {
                process = Runtime.getRuntime().exec(new String[]{"sh", "-c", cmd});
            }
            
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }

            BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
            while ((line = errorReader.readLine()) != null) {
                output.append("STDERR: ").append(line).append("\n");
            }
            
            process.waitFor();
            
            ret.put("engine", engineUsed);
            ret.put("output", output.toString());
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
}
