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

import androidx.webkit.ProxyConfig;
import androidx.webkit.ProxyController;
import androidx.webkit.WebViewFeature;

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
        
        // Grab proxy settings from React
        String proxyHost = call.getString("proxyHost", "");
        Integer proxyPort = call.getInt("proxyPort", 0);

        if (url == null || url.isEmpty()) {
            call.reject("No URL provided");
            return;
        }

        getActivity().runOnUiThread(() -> {
            if (browserDialog != null && browserDialog.isShowing()) {
                browserDialog.dismiss();
            }

            // --- PROXY INTERCEPTOR LOGIC ---
            if (proxyHost != null && !proxyHost.isEmpty() && proxyPort != null && proxyPort > 0) {
                if (WebViewFeature.isFeatureSupported(WebViewFeature.PROXY_OVERRIDE)) {
                    
                    // Default to SOCKS protocol (Tor/Orbot standard) if user just typed an IP
                    final String proxyUrl = proxyHost;
                    

                    // Strict routing: NO fallback to direct IP if proxy fails
                    ProxyConfig strictProxy = new ProxyConfig.Builder()
                            .addProxyRule((proxyUrl.startsWith("http") || proxyUrl.startsWith("socks") ? proxyUrl : "socks://" + proxyUrl) + ":" + proxyPort)
                            .build();

                    ProxyController.getInstance().setProxyOverride(strictProxy, command -> command.run(), () -> {
                        System.out.println("🛡️ TOR/PROXY ENGAGED: " + proxyUrl + ":" + proxyPort);
                    });
                }
            } else {
                // Clear proxy if toggle is off
                if (WebViewFeature.isFeatureSupported(WebViewFeature.PROXY_OVERRIDE)) {
                    ProxyController.getInstance().clearProxyOverride(command -> command.run(), () -> {});
                }
            }

            // --- BUILD THE STEALTH UI ---
            browserDialog = new Dialog(getActivity(), android.R.style.Theme_NoTitleBar_Fullscreen);
            browserDialog.requestWindowFeature(Window.FEATURE_NO_TITLE);

            LinearLayout mainLayout = new LinearLayout(getActivity());
            mainLayout.setOrientation(LinearLayout.VERTICAL);
            mainLayout.setBackgroundColor(Color.BLACK);

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
            urlText.setText((proxyPort > 0 ? "🔒 [PROXY ON] " : "") + url);
            urlText.setTextColor(Color.parseColor("#22d3ee"));
            urlText.setPadding(30, 0, 0, 0);
            urlText.setSingleLine(true);
            topBar.addView(urlText);

            WebView webView = new WebView(getActivity());
            webView.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT, 1.0f));
            
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);

            
            webView.setWebChromeClient(new android.webkit.WebChromeClient());
            settings.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setDatabaseEnabled(true);
            
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onReceivedSslError(WebView view, android.webkit.SslErrorHandler handler, android.net.http.SslError error) {
                    // Bypass strict SSL checks so Proxied/Tor traffic does not instantly abort
                    handler.proceed();
                }
            });
            webView.loadUrl(url);

            mainLayout.addView(topBar);
            mainLayout.addView(webView);
            browserDialog.setContentView(mainLayout);

            // --- AUTO-NUKE SEQUENCE ---
            browserDialog.setOnDismissListener(d -> {
                if (autoNuke != null && autoNuke) {
                    webView.clearCache(true);
                    webView.clearHistory();
                    webView.clearFormData();
                    CookieManager.getInstance().removeAllCookies(null);
                    CookieManager.getInstance().flush();
                }
                webView.destroy();
                
                // Reset proxy system on close to prevent leaking to other components
                if (WebViewFeature.isFeatureSupported(WebViewFeature.PROXY_OVERRIDE)) {
                    ProxyController.getInstance().clearProxyOverride(command -> command.run(), () -> {});
                }
            });

            browserDialog.show();
            call.resolve();
        });
    }
}
