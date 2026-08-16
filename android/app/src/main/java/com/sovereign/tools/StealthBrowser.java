package com.sovereign.tools;

import android.webkit.WebResourceRequest;
import android.webkit.WebView;


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
import android.widget.Toast;

import androidx.webkit.ProxyConfig;
import androidx.webkit.ProxyController;
import androidx.webkit.WebViewFeature;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "StealthBrowser")
public class StealthBrowser extends Plugin {
    private Dialog browserDialog;

    @PluginMethod
    public void openNative(PluginCall call) {
        String url = call.getString("url");
        Boolean autoNuke = call.getBoolean("autoNuke", true);
        
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
                    String proxyUrl = proxyHost;
                    if (!proxyUrl.startsWith("http") && !proxyUrl.startsWith("socks")) {
                        proxyUrl = "socks://" + proxyUrl;
                    }

                    ProxyConfig strictProxy = new ProxyConfig.Builder()
                            .addProxyRule(proxyUrl + ":" + proxyPort)
                            .build();

                    ProxyController.getInstance().setProxyOverride(strictProxy, command -> command.run(), () -> {});
                }
            } else {
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
            closeBtn.setText("❌ CLOSE");
            closeBtn.setTextColor(Color.parseColor("#f43f5e"));
            closeBtn.setBackgroundColor(Color.TRANSPARENT);
            closeBtn.setOnClickListener(v -> browserDialog.dismiss());
            topBar.addView(closeBtn);

            // RIPPER BUTTON
            Button ripBtn = new Button(getActivity());
            ripBtn.setText("📥 RIP");
            ripBtn.setTextColor(Color.parseColor("#10b981"));
            ripBtn.setBackgroundColor(Color.TRANSPARENT);
            ripBtn.setOnClickListener(v -> {
                WebView targetView = (WebView) mainLayout.getChildAt(1);
                if (targetView != null) {
                    targetView.evaluateJavascript(
                        "(function() { var v = document.querySelector('video'); return v ? (v.src || v.currentSrc) : ''; })();",
                        value -> {
                            String cleanVal = value != null ? value.replace("\"", "").trim() : "";
                            if (!cleanVal.isEmpty() && !cleanVal.equals("null")) {
                                JSObject ret = new JSObject();
                                ret.put("url", cleanVal);
                                notifyListeners("onMediaDetected", ret);
                            } else {
                                getActivity().runOnUiThread(() -> {
                                    Toast.makeText(getActivity(), "No video stream detected.", Toast.LENGTH_SHORT).show();
                                });
                            }
                        }
                    );
                }
            });
            topBar.addView(ripBtn);

            TextView urlText = new TextView(getActivity());
            urlText.setText((proxyPort > 0 ? "🔒 [PROXY] " : "") + url);
            urlText.setTextColor(Color.parseColor("#22d3ee"));
            urlText.setPadding(20, 0, 0, 0);
            urlText.setSingleLine(true);
            topBar.addView(urlText);

            WebView webView = new WebView(getActivity());
            webView.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT, 1.0f));
            
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setDatabaseEnabled(true);

            webView.setWebChromeClient(new android.webkit.WebChromeClient());
            webView.setWebViewClient(new WebViewClient() {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            String url = request.getUrl().toString();
            // Block external intent schemes from crashing the WebView
            if (url.startsWith("intent://") || url.startsWith("market://") || url.startsWith("whatsapp://")) {
                return true; // We handled it (by doing nothing)
            }
            return false; // Let the WebView load standard http/https
        }
    
                @Override
                public void onReceivedSslError(WebView view, android.webkit.SslErrorHandler handler, android.net.http.SslError error) {
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
                
                if (WebViewFeature.isFeatureSupported(WebViewFeature.PROXY_OVERRIDE)) {
                    ProxyController.getInstance().clearProxyOverride(command -> command.run(), () -> {});
                }
            });

            browserDialog.show();
            call.resolve();
        });
    }
}
