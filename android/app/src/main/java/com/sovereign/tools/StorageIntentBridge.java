package com.sovereign.tools; // Ensure this matches your actual package name if different

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StorageIntentBridge")
public class StorageIntentBridge extends Plugin {

    @PluginMethod
    public void requestAllFilesAccess(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (!Environment.isExternalStorageManager()) {
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION);
                    intent.addCategory("android.intent.category.DEFAULT");
                    intent.setData(Uri.parse(String.format("package:%s", getContext().getPackageName())));
                    getActivity().startActivity(intent);
                    call.resolve();
                } catch (Exception e) {
                    Intent intent = new Intent();
                    intent.setAction(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION);
                    getActivity().startActivity(intent);
                    call.resolve();
                }
            } else {
                call.resolve();
            }
        } else {
            call.resolve(); // Not needed on older Androids
        }
    }
}
