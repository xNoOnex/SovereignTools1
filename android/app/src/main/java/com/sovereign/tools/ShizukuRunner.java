package com.sovereign.tools;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import rikka.shizuku.Shizuku;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import android.content.pm.PackageManager;
import java.lang.reflect.Method;

@CapacitorPlugin(name = "ShizukuRunner")
public class ShizukuRunner extends Plugin {
    
    private static final int SHIZUKU_CODE = 88;

    @PluginMethod
    public void checkStatus(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            boolean osPermissionGranted = getContext().checkSelfPermission("moe.shizuku.manager.permission.API_V23") == PackageManager.PERMISSION_GRANTED;
            boolean binderAlive = false;
            try { binderAlive = Shizuku.pingBinder(); } catch (Exception ignored) {}

            boolean isConnected = osPermissionGranted || binderAlive;
            ret.put("active", isConnected);
            ret.put("granted", isConnected);
            call.resolve(ret);
        } catch (Exception e) {
            ret.put("active", false);
            ret.put("granted", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        try {
            if (getContext().checkSelfPermission("moe.shizuku.manager.permission.API_V23") == PackageManager.PERMISSION_GRANTED) {
                JSObject ret = new JSObject();
                ret.put("granted", true);
                call.resolve(ret);
                return;
            }
            if (Shizuku.pingBinder()) { Shizuku.requestPermission(SHIZUKU_CODE); }
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Permission request error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void executeCommand(PluginCall call) {
        String cmd = call.getString("command");
        JSObject ret = new JSObject();
        try {
            boolean osGranted = getContext().checkSelfPermission("moe.shizuku.manager.permission.API_V23") == PackageManager.PERMISSION_GRANTED;
            boolean binderAlive = false;
            try { binderAlive = Shizuku.pingBinder(); } catch (Exception ignored) {}

            Process process = null;
            String engineUsed = "Standard (User)";

            if (binderAlive && osGranted) {
                try {
                    // FIX: Pass the exact string as a direct array to prevent Shizuku parsing failures
                    String[] execCmd = {"sh", "-c", cmd};
                    Class<?> clazz = Class.forName("rikka.shizuku.Shizuku");
                    Method method = clazz.getDeclaredMethod("newProcess", String[].class, String[].class, String.class);
                    method.setAccessible(true);
                    
                    process = (Process) method.invoke(null, execCmd, null, null);
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
