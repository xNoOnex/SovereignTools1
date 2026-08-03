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
    
    @PluginMethod
    public void checkStatus(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            if (Shizuku.pingBinder()) {
                boolean granted = Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED;
                ret.put("active", true);
                ret.put("granted", granted);
            } else {
                ret.put("active", false);
                ret.put("granted", false);
            }
        } catch (Exception e) {
            ret.put("active", false);
            ret.put("granted", false);
        }
        call.resolve(ret);
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
            
            // BYPASS: Use Java Reflection to unhide and invoke the private newProcess method
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
