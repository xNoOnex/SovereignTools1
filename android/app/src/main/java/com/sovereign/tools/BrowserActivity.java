package com.sovereign.tools;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;

public class BrowserActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        WebView webView = new WebView(this);
        setContentView(webView);

        // Enable full JavaScript execution and local DOM storage
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        // The Engine Interceptor (Where the Ad Blocker will live)
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                // Phase 2: We will inject the EasyList ad-server blocks right here
                return super.shouldInterceptRequest(view, request);
            }
        });

        String url = getIntent().getStringExtra("url");
        if (url != null) {
            webView.loadUrl(url);
        }
    }
}
