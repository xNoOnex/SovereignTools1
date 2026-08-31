package com.sovereign.tools;

import android.app.Dialog;
import android.app.AlertDialog;
import android.graphics.Color;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.ViewGroup;
import android.view.Window;
import android.view.inputmethod.EditorInfo;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.PopupMenu;
import android.widget.Toast;
import android.text.InputType;

import androidx.webkit.ProxyConfig;
import androidx.webkit.ProxyController;
import androidx.webkit.WebViewFeature;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StealthBrowser")
public class StealthBrowser extends Plugin {
    private Dialog browserDialog;
    private WebView webView;
    private EditText urlInput;

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
            if (browserDialog != null && browserDialog.isShowing()) browserDialog.dismiss();

            // --- PROXY LOGIC ---
            if (proxyHost != null && !proxyHost.isEmpty() && proxyPort != null && proxyPort > 0) {
                if (WebViewFeature.isFeatureSupported(WebViewFeature.PROXY_OVERRIDE)) {
                    String proxyUrl = proxyHost;
                    if (!proxyUrl.startsWith("http") && !proxyUrl.startsWith("socks")) proxyUrl = "socks://" + proxyUrl;
                    ProxyConfig strictProxy = new ProxyConfig.Builder().addProxyRule(proxyUrl + ":" + proxyPort).build();
                    ProxyController.getInstance().setProxyOverride(strictProxy, command -> command.run(), () -> {});
                }
            } else {
                if (WebViewFeature.isFeatureSupported(WebViewFeature.PROXY_OVERRIDE)) {
                    ProxyController.getInstance().clearProxyOverride(command -> command.run(), () -> {});
                }
            }

            // --- NATIVE UI SETUP ---
            browserDialog = new Dialog(getActivity(), android.R.style.Theme_NoTitleBar_Fullscreen);
            browserDialog.requestWindowFeature(Window.FEATURE_NO_TITLE);

            LinearLayout mainLayout = new LinearLayout(getActivity());
            mainLayout.setOrientation(LinearLayout.VERTICAL);
            mainLayout.setBackgroundColor(Color.BLACK);

            // TOP NAVIGATION BAR
            LinearLayout topBar = new LinearLayout(getActivity());
            topBar.setOrientation(LinearLayout.HORIZONTAL);
            topBar.setBackgroundColor(Color.parseColor("#18181b"));
            topBar.setGravity(Gravity.CENTER_VERTICAL);
            int heightPx = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 55, getActivity().getResources().getDisplayMetrics());
            topBar.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, heightPx));

            // TABS BUTTON (Returns to React Dashboard)
            Button tabsBtn = new Button(getActivity());
            tabsBtn.setText("⧉");
            tabsBtn.setTextSize(20);
            tabsBtn.setTextColor(Color.parseColor("#22d3ee"));
            tabsBtn.setBackgroundColor(Color.TRANSPARENT);
            tabsBtn.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.MATCH_PARENT));
            tabsBtn.setOnClickListener(v -> browserDialog.dismiss());

            // URL INPUT BAR
            urlInput = new EditText(getActivity());
            LinearLayout.LayoutParams urlParams = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
            urlParams.setMargins(10, 0, 10, 0);
            urlInput.setLayoutParams(urlParams);
            urlInput.setText(url);
            urlInput.setTextColor(Color.WHITE);
            urlInput.setBackgroundColor(Color.parseColor("#27272a"));
            urlInput.setPadding(30, 20, 30, 20);
            urlInput.setSingleLine(true);
            urlInput.setImeOptions(EditorInfo.IME_ACTION_GO);
            urlInput.setInputType(InputType.TYPE_TEXT_VARIATION_URI);

            // 3-DOT MENU BUTTON
            Button menuBtn = new Button(getActivity());
            menuBtn.setText("⋮");
            menuBtn.setTextSize(24);
            menuBtn.setTextColor(Color.WHITE);
            menuBtn.setBackgroundColor(Color.TRANSPARENT);
            menuBtn.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.MATCH_PARENT));

            topBar.addView(tabsBtn);
            topBar.addView(urlInput);
            topBar.addView(menuBtn);

            // WEBVIEW ENGINE
            webView = new WebView(getActivity());
            webView.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT, 1.0f));
            
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setDatabaseEnabled(true);

            webView.setWebChromeClient(new WebChromeClient());
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    if(!urlInput.isFocused()) urlInput.setText(url);
                    JSObject ret = new JSObject();
                    ret.put("url", url);
                    notifyListeners("onUrlSync", ret);
                }
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                    String reqUrl = request.getUrl().toString();
                    if (reqUrl.startsWith("intent://") || reqUrl.startsWith("market://")) return true; 
                    return false; 
                }
                @Override
                public void onReceivedSslError(WebView view, android.webkit.SslErrorHandler handler, android.net.http.SslError error) {
                    handler.proceed();
                }
            });

            // HARDWARE BACK BUTTON HIJACK
            browserDialog.setOnKeyListener((dialog, keyCode, event) -> {
                if (keyCode == KeyEvent.KEYCODE_BACK && event.getAction() == KeyEvent.ACTION_UP) {
                    if (webView.canGoBack()) {
                        webView.goBack();
                    } else {
                        browserDialog.dismiss();
                    }
                    return true;
                }
                return false;
            });

            urlInput.setOnEditorActionListener((v, actionId, event) -> {
                if (actionId == EditorInfo.IME_ACTION_GO || (event != null && event.getKeyCode() == KeyEvent.KEYCODE_ENTER)) {
                    String newUrl = urlInput.getText().toString().trim();
                    if (!newUrl.startsWith("http")) newUrl = "https://" + newUrl;
                    webView.loadUrl(newUrl);
                    urlInput.clearFocus();
                    return true;
                }
                return false;
            });

            // NATIVE 3-DOT MENU
            menuBtn.setOnClickListener(v -> {
                PopupMenu popup = new PopupMenu(getActivity(), menuBtn);
                popup.getMenu().add(0, 1, 0, "🎯 Scan & Rip Media");
                popup.getMenu().add(0, 2, 0, "★ Bookmark Site");

                popup.setOnMenuItemClickListener(item -> {
                    switch (item.getItemId()) {
                        case 1:
                            scanAndRipMedia();
                            return true;
                        case 2:
                            JSObject ret = new JSObject();
                            ret.put("url", webView.getUrl());
                            notifyListeners("onBookmark", ret);
                            Toast.makeText(getActivity(), "Site Bookmarked!", Toast.LENGTH_SHORT).show();
                            return true;
                    }
                    return false;
                });
                popup.show();
            });

            mainLayout.addView(topBar);
            mainLayout.addView(webView);
            browserDialog.setContentView(mainLayout);

            browserDialog.setOnDismissListener(d -> {
                if (autoNuke != null && autoNuke) {
                    webView.clearCache(true);
                    webView.clearHistory();
                    webView.clearFormData();
                    CookieManager.getInstance().removeAllCookies(null);
                    CookieManager.getInstance().flush();
                }
                webView.destroy();
                call.resolve();
            });

            webView.loadUrl(url);
            browserDialog.show();
        });
    }

    // NATIVE HTML SCRAPER
    private void scanAndRipMedia() {
        String script = "(function() { " +
            "var urls = []; " +
            "var regex = /(https?:\\/\\/[^\"\\'\\s]+\\.(?:mp4|webm|m3u8|mp3|wav|jpg|jpeg|png|gif))/gi; " +
            "var matches = document.documentElement.innerHTML.match(regex); " +
            "if (matches) { urls = urls.concat(matches); } " +
            "var vids = document.querySelectorAll('video'); " +
            "for(var i=0; i<vids.length; i++) { if(vids[i].src) urls.push(vids[i].src); } " +
            "var auds = document.querySelectorAll('audio'); " +
            "for(var i=0; i<auds.length; i++) { if(auds[i].src) urls.push(auds[i].src); } " +
            "var imgs = document.querySelectorAll('img'); " +
            "for(var i=0; i<imgs.length; i++) { if(imgs[i].src) urls.push(imgs[i].src); } " +
            "return [...new Set(urls)].join(','); " +
        "})();";

        webView.evaluateJavascript(script, value -> {
            String currentUrl = webView.getUrl();
            boolean isYouTube = currentUrl != null && (currentUrl.contains("youtube.com") || currentUrl.contains("youtu.be"));

            if (value == null || value.equals("null") || value.replace("\"", "").trim().isEmpty()) {
                if (isYouTube) {
                    sendToRipper(currentUrl);
                } else {
                    Toast.makeText(getActivity(), "No media payloads found on this page.", Toast.LENGTH_SHORT).show();
                }
                return;
            }

            String cleanVals = value.replace("\"", "").trim();
            String[] mediaList = cleanVals.split(",");

            if (isYouTube) {
                String[] newMediaList = new String[mediaList.length + 1];
                newMediaList[0] = currentUrl;
                System.arraycopy(mediaList, 0, newMediaList, 1, mediaList.length);
                mediaList = newMediaList;
            }

            final String[] finalMediaList = mediaList;
            String[] displayList = new String[finalMediaList.length];
            
            for(int i=0; i<finalMediaList.length; i++) {
                if (isYouTube && i == 0) {
                    displayList[i] = "🔴 Main YouTube Video Stream";
                } else {
                    String[] parts = finalMediaList[i].split("/");
                    String filename = parts[parts.length - 1];
                    if (filename.length() > 35) filename = filename.substring(0, 35) + "...";
                    displayList[i] = filename;
                }
            }

            // FIXED: Standard default Builder invocation
            AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());
            builder.setTitle("🎯 Select Payload to Rip");
            builder.setItems(displayList, (dialog, which) -> {
                sendToRipper(finalMediaList[which]);
            });
            builder.setNegativeButton("Cancel", null);
            builder.show();
        });
    }

    private void sendToRipper(String url) {
        JSObject ret = new JSObject();
        ret.put("url", url);
        notifyListeners("onMediaDetected", ret);
        Toast.makeText(getActivity(), "Extraction Started in Background...", Toast.LENGTH_SHORT).show();
    }
}
