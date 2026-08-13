package com.sovereign.tools;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;

public class BrowserActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        WebView webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        
        // --- SOVEREIGN HARDENING PROTOCOLS ---
        
        // 1. Force Strict HTTPS (Block mixed content)
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        
        // 2. Disable Location Tracking at the engine level
        settings.setGeolocationEnabled(false);
        
        // 3. Cookie Isolation (Block 3rd-party trackers)
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true); // Required for basic site function (login tokens)
        cookieManager.setAcceptThirdPartyCookies(webView, false);
        
        // 4. Hardware Firewall (Auto-deny all site requests for Camera/Mic/GPS)
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, false, false);
            }
            
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                request.deny(); 
            }
        });

        // 5. Network Interceptor (Ready for Phase 2 Ad Blocker)
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                // Future EasyList Ad-Block logic goes here
                return super.shouldInterceptRequest(view, request);
            }
        });

        String url = getIntent().getStringExtra("url");
        if (url != null) {
            webView.loadUrl(url);
        }
    }
}
