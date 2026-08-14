package com.sovereign.tools;

import android.app.Dialog;
import android.graphics.Color;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StealthBrowser")
public class StealthBrowser extends Plugin {
    private Dialog browserDialog;

    @PluginMethod
    public void openNative(PluginCall call) {
        String url = call.getString("url");
        Boolean autoNuke = call.getBoolean("autoNuke", true);

        if (url == null || url.isEmpty()) {
            call.reject("No URL provided");
            return;
        }

        getActivity().runOnUiThread(() -> {
            if (browserDialog != null && browserDialog.isShowing()) {
                browserDialog.dismiss();
            }

            // Create a fullscreen black-box dialog
            browserDialog = new Dialog(getActivity(), android.R.style.Theme_NoTitleBar_Fullscreen);
            browserDialog.requestWindowFeature(Window.FEATURE_NO_TITLE);

            LinearLayout mainLayout = new LinearLayout(getActivity());
            mainLayout.setOrientation(LinearLayout.VERTICAL);
            mainLayout.setBackgroundColor(Color.BLACK);

            // Create a stealthy top navigation bar
            LinearLayout topBar = new LinearLayout(getActivity());
            topBar.setOrientation(LinearLayout.HORIZONTAL);
            topBar.setBackgroundColor(Color.parseColor("#09090b"));
            topBar.setGravity(Gravity.CENTER_VERTICAL);
            
            int heightPx = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 55, getActivity().getResources().getDisplayMetrics());
            topBar.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, heightPx));

            Button closeBtn = new Button(getActivity());
            closeBtn.setText("❌ CLOSE STEALTH");
            closeBtn.setTextColor(Color.parseColor("#f43f5e"));
            closeBtn.setBackgroundColor(Color.TRANSPARENT);
            closeBtn.setOnClickListener(v -> browserDialog.dismiss());
            topBar.addView(closeBtn);

            TextView urlText = new TextView(getActivity());
            urlText.setText(url);
            urlText.setTextColor(Color.parseColor("#52525b"));
            urlText.setPadding(30, 0, 0, 0);
            urlText.setSingleLine(true);
            topBar.addView(urlText);

            // Initialize the raw WebKit Engine
            WebView webView = new WebView(getActivity());
            webView.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT, 1.0f));
            
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);

            // Force all links to stay INSIDE this WebKit box, never opening external apps
            webView.setWebViewClient(new WebViewClient());
            webView.loadUrl(url);

            mainLayout.addView(topBar);
            mainLayout.addView(webView);

            browserDialog.setContentView(mainLayout);

            // The Nuke Sequence
            browserDialog.setOnDismissListener(d -> {
                if (autoNuke != null && autoNuke) {
                    webView.clearCache(true);
                    webView.clearHistory();
                    webView.clearFormData();
                    CookieManager.getInstance().removeAllCookies(null);
                    CookieManager.getInstance().flush();
                }
                webView.destroy();
            });

            browserDialog.show();
            call.resolve();
        });
    }
}
