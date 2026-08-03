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
    private static final String PERMISSION = "moe.shizuku.manager.permission.API_V23";

    @PluginMethod
    public void checkStatus(PluginCall call) {
        try {
            if (Shizuku.pingBinder()) {
                if (Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED) {
                    JSObject ret = new JSObject();
                    ret.put("active", true);
                    ret.put("granted", true);
                    call.resolve(ret);
                } else {
                    // FIX: Explicitly check and request the exact permission string Android requires
                    if (Shizuku.shouldShowRequestPermissionRationale()) {
                        call.reject("User previously denied Shizuku permission. Please grant it in Android Settings.");
                        return;
                    }
                    
                    Shizuku.OnRequestPermissionResultListener listener = new Shizuku.OnRequestPermissionResultListener() {
                        @Override
                        public void onRequestPermissionResult(int requestCode, int grantResult) {
                            if (requestCode == SHIZUKU_CODE) {
                                JSObject ret = new JSObject();
                                ret.put("active", true);
                                ret.put("granted", grantResult == PackageManager.PERMISSION_GRANTED);
                                call.resolve(ret);
                                Shizuku.removeRequestPermissionResultListener(this);
                            }
                        }
                    };
                    Shizuku.addRequestPermissionResultListener(listener);
                    Shizuku.requestPermission(SHIZUKU_CODE); // Trigger prompt
                }
            } else {
                JSObject ret = new JSObject();
                ret.put("active", false);
                ret.put("granted", false);
                call.resolve(ret);
            }
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("active", false);
            ret.put("granted", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void executeCommand(PluginCall call) {
        String cmd = call.getString("command");
        JSObject ret = new JSObject();
        try {
            if (!Shizuku.pingBinder() || Shizuku.checkSelfPermission() != PackageManager.PERMISSION_GRANTED) {
                call.reject("Shizuku is not active or permission is denied.");
                return;
            }
            
            Class<?> clazz = Class.forName("rikka.shizuku.Shizuku");
            Method method = clazz.getDeclaredMethod("newProcess", String[].class, String[].class, String.class);
            method.setAccessible(true);
            
            Process process = (Process) method.invoke(null, new String[]{"sh", "-c", cmd}, null, null);
            
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
            process.waitFor();
            
            ret.put("output", output.toString());
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
}
