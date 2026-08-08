package com.sovereign.tools;

import android.Manifest;
import android.content.pm.PackageManager;
import android.media.MediaRecorder;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PermissionState;
import rikka.shizuku.Shizuku;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Method;

@CapacitorPlugin(
    name = "ShizukuRunner",
    permissions = {
        @Permission(strings = {"moe.shizuku.manager.permission.API_V23"}, alias = "shizuku"),
        @Permission(strings = {Manifest.permission.RECORD_AUDIO}, alias = "microphone")
    }
)
public class ShizukuRunner extends Plugin {

    private MediaRecorder mediaRecorder;
    private String currentRecordPath;

    @PluginMethod
    public void checkStatus(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            boolean osGranted = getContext().checkSelfPermission("moe.shizuku.manager.permission.API_V23") == PackageManager.PERMISSION_GRANTED;
            boolean binderAlive = false;
            try { binderAlive = Shizuku.pingBinder(); } catch (Exception ignored) {}

            ret.put("active", binderAlive);
            ret.put("granted", osGranted);
            call.resolve(ret);
        } catch (Exception e) {
            ret.put("active", false);
            ret.put("granted", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void forceShizukuLink(PluginCall call) {
        if (getPermissionState("shizuku") != PermissionState.GRANTED) {
            requestPermissionForAlias("shizuku", call, "shizukuCallback");
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PermissionCallback
    private void shizukuCallback(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", getPermissionState("shizuku") == PermissionState.GRANTED);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestMic(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "micCallback");
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PermissionCallback
    private void micCallback(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", getPermissionState("microphone") == PermissionState.GRANTED);
        call.resolve(ret);
    }

    @PluginMethod
    public void startNativeRecord(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            call.reject("Microphone permission denied.");
            return;
        }
        try {
            File cacheDir = getContext().getCacheDir();
            File audioFile = File.createTempFile("sovereign_rec", ".aac", cacheDir);
            currentRecordPath = audioFile.getAbsolutePath();

            mediaRecorder = new MediaRecorder();
            mediaRecorder.setAudioSource(MediaRecorder.AudioSource.UNPROCESSED);
            mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            mediaRecorder.setOutputFile(currentRecordPath);
            mediaRecorder.prepare();
            mediaRecorder.start();

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Engine boot failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopNativeRecord(PluginCall call) {
        try {
            if (mediaRecorder != null) {
                mediaRecorder.stop();
                mediaRecorder.release();
                mediaRecorder = null;
            }
            
            File file = new File(currentRecordPath);
            FileInputStream fis = new FileInputStream(file);
            byte[] bytes = new byte[(int) file.length()];
            fis.read(bytes);
            fis.close();
            
            String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
            file.delete(); 

            JSObject ret = new JSObject();
            ret.put("base64", base64);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Engine stop failed: " + e.getMessage());
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

            if (osGranted) {
                try {
                    Method newProcessMethod = null;
                    for (Method m : Shizuku.class.getDeclaredMethods()) {
                        if (m.getName().equals("newProcess") && m.getParameterCount() == 3) {
                            newProcessMethod = m;
                            break;
                        }
                    }
                    if (newProcessMethod != null) {
                        newProcessMethod.setAccessible(true);
                        String[] shellCmd = new String[]{"sh", "-c", cmd};
                        process = (Process) newProcessMethod.invoke(null, new Object[]{shellCmd, null, null});
                        engineUsed = "Shizuku (Root)";
                    }
                } catch (Exception e) {}
            }
            
            if (process == null) {
                process = Runtime.getRuntime().exec(new String[]{"sh", "-c", cmd});
            }
            
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) { output.append(line).append("\n"); }

            BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
            while ((line = errorReader.readLine()) != null) { output.append("STDERR: ").append(line).append("\n"); }
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
