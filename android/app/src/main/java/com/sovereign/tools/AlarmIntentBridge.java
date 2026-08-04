package com.sovereign.tools;

import android.content.Intent;
import android.provider.AlarmClock;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AlarmIntentBridge")
public class AlarmIntentBridge extends Plugin {

    @PluginMethod
    public void setNativeAlarm(PluginCall call) {
        try {
            int hour = call.getInt("hour", 0);
            int minute = call.getInt("minute", 0);
            String message = call.getString("message", "Sovereign Schedule");
            boolean skipUi = call.getBoolean("skipUi", true);

            Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM)
                    .putExtra(AlarmClock.EXTRA_MESSAGE, message)
                    .putExtra(AlarmClock.EXTRA_HOUR, hour)
                    .putExtra(AlarmClock.EXTRA_MINUTES, minute)
                    .putExtra(AlarmClock.EXTRA_SKIP_UI, skipUi);
            
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to set native alarm: " + e.getMessage());
        }
    }
}
