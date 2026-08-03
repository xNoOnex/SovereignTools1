package com.sovereign.tools;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import rikka.shizuku.Shizuku;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.File;
import android.content.pm.PackageManager;

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
            
            // FIX: Explicitly cast the final parameter to (File) null 
            // so the compiler routes to the public method instead of the private String one.
            Process process = Shizuku.newProcess(new String[]{"sh", "-c", cmd}, null, (File) null);
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
