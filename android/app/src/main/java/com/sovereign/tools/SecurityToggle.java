package com.sovereign.tools;

import android.view.WindowManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SecurityToggle")
public class SecurityToggle extends Plugin {
    @PluginMethod
    public void enableSecureFlag(PluginCall call) {
        if (getActivity() != null) {
            getActivity().runOnUiThread(() -> {
                getActivity().getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
                call.resolve();
            });
        } else {
            call.reject("Android Activity is null");
        }
    }

    @PluginMethod
    public void disableSecureFlag(PluginCall call) {
        if (getActivity() != null) {
            getActivity().runOnUiThread(() -> {
                getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                call.resolve();
            });
        } else {
            call.reject("Android Activity is null");
        }
    }
}
