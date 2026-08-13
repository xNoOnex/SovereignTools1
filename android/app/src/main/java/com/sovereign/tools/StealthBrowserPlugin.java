package com.sovereign.tools;

import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StealthBrowser")
public class StealthBrowserPlugin extends Plugin {
    @PluginMethod
    public void openNative(PluginCall call) {
        String url = call.getString("url");
        if (url == null) {
            call.reject("Must provide a URL payload");
            return;
        }
        
        // Launch the isolated Java engine
        Intent intent = new Intent(getContext(), BrowserActivity.class);
        intent.putExtra("url", url);
        getContext().startActivity(intent);
        call.resolve();
    }
}
