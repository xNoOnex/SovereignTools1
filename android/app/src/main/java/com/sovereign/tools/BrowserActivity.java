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
import android.webkit.WebStorage;
import androidx.webkit.ProxyConfig;
import androidx.webkit.ProxyController;
import java.util.concurrent.Executor;

public class BrowserActivity extends Activity {
    private WebView webView;
    private boolean autoNuke = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        webView = new WebView(this);
        setContentView(webView);

        autoNuke = getIntent().getBooleanExtra("autoNuke", true);
        String proxyHost = getIntent().getStringExtra("proxyHost");
        int proxyPort = getIntent().getIntExtra("proxyPort", 0);

        // -- PROXY ROUTING ENGINE --
        if (proxyHost != null && !proxyHost.isEmpty() && proxyPort > 0) {
            if (androidx.webkit.WebViewFeature.isFeatureSupported(androidx.webkit.WebViewFeature.PROXY_OVERRIDE)) {
                ProxyConfig proxyConfig = new ProxyConfig.Builder()
                        .addProxyRule(proxyHost + ":" + proxyPort)
                        .addDirect()
                        .build();
                ProxyController.getInstance().setProxyOverride(proxyConfig, new Executor() {
                    @Override
                    public void execute(Runnable command) { command.run(); }
                }, () -> {});
            }
        } else {
             if (androidx.webkit.WebViewFeature.isFeatureSupported(androidx.webkit.WebViewFeature.PROXY_OVERRIDE)) {
                 ProxyController.getInstance().clearProxyOverride(new Executor() {
                    @Override
                    public void execute(Runnable command) { command.run(); }
                }, () -> {});
             }
        }

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setGeolocationEnabled(false);
        
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(!autoNuke); // If Nuking, reject initial cookies if possible
        cookieManager.setAcceptThirdPartyCookies(webView, false);
        
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, false, false);
            }
            @Override
            public void onPermissionRequest(final PermissionRequest request) { request.deny(); }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return super.shouldInterceptRequest(view, request);
            }
        });

        String url = getIntent().getStringExtra("url");
        if (url != null) webView.loadUrl(url);
    }

    @Override
    protected void onDestroy() {
        // -- AUTO-NUKE SELF DESTRUCT --
        if (autoNuke && webView != null) {
            WebStorage.getInstance().deleteAllData();
            CookieManager.getInstance().removeAllCookies(null);
            CookieManager.getInstance().flush();
            webView.clearCache(true);
            webView.clearHistory();
            webView.destroy();
        }
        super.onDestroy();
    }
}
