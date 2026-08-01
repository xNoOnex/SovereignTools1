package com.sovereign.tools;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Color;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.HorizontalScrollView;
import android.widget.Toast;
import androidx.core.app.ActivityCompat;
import androidx.webkit.ProxyConfig;
import androidx.webkit.ProxyController;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;

public class MainActivity extends BridgeActivity {
    private ValueCallback<Uri[]> filePathCallback;
    private final static int FILECHOOSER_RESULTCODE = 1001;
    private final static int PERMISSION_REQUEST_CODE = 2002;

    private FrameLayout nativeBrowserContainer;
    private FrameLayout webViewHolder;
    private LinearLayout tabStripLayout;
    private EditText nativeUrlInput;

    private List<WebView> tabList = new ArrayList<>();
    private int currentTabIndex = -1;
    private boolean isFullscreenMode = false;

    private int dpToPx(int dp) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, getResources().getDisplayMetrics());
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        checkAndRequestPermissions();

        if (WebViewFeature.isFeatureSupported(WebViewFeature.PROXY_OVERRIDE)) {
            try {
                ProxyController.getInstance().clearProxyOverride(Executors.newSingleThreadExecutor(), () -> {});
            } catch (Exception ignored) {}
        }

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            webView.getSettings().setAllowFileAccess(true);
            webView.getSettings().setAllowContentAccess(true);
            webView.getSettings().setJavaScriptEnabled(true);
            webView.getSettings().setAllowFileAccessFromFileURLs(true);
            webView.getSettings().setAllowUniversalAccessFromFileURLs(true);

            webView.addJavascriptInterface(new AndroidBridge(), "AndroidNative");

            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(() -> request.grant(request.getResources()));
                }

                @Override
                public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                    if (MainActivity.this.filePathCallback != null) {
                        MainActivity.this.filePathCallback.onReceiveValue(null);
                    }
                    MainActivity.this.filePathCallback = filePathCallback;

                    Intent intent = fileChooserParams.createIntent();
                    try {
                        startActivityForResult(intent, FILECHOOSER_RESULTCODE);
                    } catch (Exception e) {
                        MainActivity.this.filePathCallback = null;
                        return false;
                    }
                    return true;
                }
            });
        }

        initBrowserOverlay();
    }

    private void initBrowserOverlay() {
        runOnUiThread(() -> {
            ViewGroup rootView = findViewById(android.R.id.content);

            nativeBrowserContainer = new FrameLayout(this);
            nativeBrowserContainer.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            ));
            nativeBrowserContainer.setBackgroundColor(Color.parseColor("#09090b"));
            nativeBrowserContainer.setVisibility(View.GONE);

            LinearLayout mainLayout = new LinearLayout(this);
            mainLayout.setOrientation(LinearLayout.VERTICAL);
            mainLayout.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            ));

            LinearLayout topBar = new LinearLayout(this);
            topBar.setOrientation(LinearLayout.HORIZONTAL);
            topBar.setGravity(Gravity.CENTER_VERTICAL);
            topBar.setPadding(dpToPx(8), dpToPx(36), dpToPx(8), dpToPx(4));
            topBar.setBackgroundColor(Color.parseColor("#18181b"));

            Button btnExit = new Button(this);
            btnExit.setText("✕");
            btnExit.setTextSize(12);
            btnExit.setTextColor(Color.WHITE);
            btnExit.setBackgroundColor(Color.parseColor("#27272a"));
            LinearLayout.LayoutParams btnSmall = new LinearLayout.LayoutParams(dpToPx(36), dpToPx(36));
            btnSmall.setMargins(0, 0, dpToPx(3), 0);
            btnExit.setLayoutParams(btnSmall);
            btnExit.setOnClickListener(v -> closeNativeBrowser());

            Button btnHome = new Button(this);
            btnHome.setText("🏠");
            btnHome.setTextSize(12);
            btnHome.setTextColor(Color.WHITE);
            btnHome.setBackgroundColor(Color.parseColor("#27272a"));
            btnHome.setLayoutParams(btnSmall);
            btnHome.setOnClickListener(v -> {
                if (currentTabIndex >= 0 && currentTabIndex < tabList.size()) {
                    tabList.get(currentTabIndex).loadUrl("https://duckduckgo.com");
                }
            });

            Button btnBack = new Button(this);
            btnBack.setText("‹");
            btnBack.setTextSize(14);
            btnBack.setTextColor(Color.WHITE);
            btnBack.setBackgroundColor(Color.parseColor("#27272a"));
            btnBack.setLayoutParams(btnSmall);
            btnBack.setOnClickListener(v -> {
                if (currentTabIndex >= 0 && currentTabIndex < tabList.size() && tabList.get(currentTabIndex).canGoBack()) {
                    tabList.get(currentTabIndex).goBack();
                }
            });

            Button btnForward = new Button(this);
            btnForward.setText("›");
            btnForward.setTextSize(14);
            btnForward.setTextColor(Color.WHITE);
            btnForward.setBackgroundColor(Color.parseColor("#27272a"));
            btnForward.setLayoutParams(btnSmall);
            btnForward.setOnClickListener(v -> {
                if (currentTabIndex >= 0 && currentTabIndex < tabList.size() && tabList.get(currentTabIndex).canGoForward()) {
                    tabList.get(currentTabIndex).goForward();
                }
            });

            nativeUrlInput = new EditText(this);
            nativeUrlInput.setText("https://duckduckgo.com");
            nativeUrlInput.setTextSize(11);
            nativeUrlInput.setTextColor(Color.WHITE);
            nativeUrlInput.setHint("Search or URL...");
            nativeUrlInput.setHintTextColor(Color.GRAY);
            nativeUrlInput.setSingleLine(true);
            nativeUrlInput.setBackgroundColor(Color.parseColor("#27272a"));
            nativeUrlInput.setPadding(dpToPx(8), dpToPx(4), dpToPx(8), dpToPx(4));

            LinearLayout.LayoutParams urlParams = new LinearLayout.LayoutParams(0, dpToPx(36), 1.0f);
            urlParams.setMargins(dpToPx(3), 0, dpToPx(3), 0);
            nativeUrlInput.setLayoutParams(urlParams);

            Button btnGo = new Button(this);
            btnGo.setText("Go");
            btnGo.setTextSize(10);
            btnGo.setTextColor(Color.BLACK);
            btnGo.setBackgroundColor(Color.parseColor("#06b6d4"));
            LinearLayout.LayoutParams btnGoParams = new LinearLayout.LayoutParams(dpToPx(42), dpToPx(36));
            btnGo.setLayoutParams(btnGoParams);
            btnGo.setOnClickListener(v -> {
                String input = nativeUrlInput.getText().toString().trim();
                if (!input.startsWith("http://") && !input.startsWith("https://")) {
                    if (input.contains(".") && !input.contains(" ")) {
                        input = "https://" + input;
                    } else {
                        input = "https://duckduckgo.com/?q=" + Uri.encode(input);
                    }
                }
                nativeUrlInput.setText(input);
                if (currentTabIndex >= 0 && currentTabIndex < tabList.size()) {
                    tabList.get(currentTabIndex).loadUrl(input);
                }
            });

            Button btnFullscreen = new Button(this);
            btnFullscreen.setText("⛶");
            btnFullscreen.setTextSize(12);
            btnFullscreen.setTextColor(Color.WHITE);
            btnFullscreen.setBackgroundColor(Color.parseColor("#27272a"));
            LinearLayout.LayoutParams btnFsParams = new LinearLayout.LayoutParams(dpToPx(36), dpToPx(36));
            btnFsParams.setMargins(dpToPx(3), 0, 0, 0);
            btnFullscreen.setLayoutParams(btnFsParams);
            btnFullscreen.setOnClickListener(v -> toggleFullscreenMode());

            topBar.addView(btnExit);
            topBar.addView(btnHome);
            topBar.addView(btnBack);
            topBar.addView(btnForward);
            topBar.addView(nativeUrlInput);
            topBar.addView(btnGo);
            topBar.addView(btnFullscreen);

            LinearLayout tabControlBar = new LinearLayout(this);
            tabControlBar.setOrientation(LinearLayout.HORIZONTAL);
            tabControlBar.setGravity(Gravity.CENTER_VERTICAL);
            tabControlBar.setBackgroundColor(Color.parseColor("#09090b"));
            tabControlBar.setPadding(dpToPx(8), dpToPx(2), dpToPx(8), dpToPx(4));

            Button btnNewTab = new Button(this);
            btnNewTab.setText("+ Tab");
            btnNewTab.setTextSize(10);
            btnNewTab.setTextColor(Color.CYAN);
            btnNewTab.setBackgroundColor(Color.parseColor("#18181b"));
            btnNewTab.setLayoutParams(new LinearLayout.LayoutParams(dpToPx(60), dpToPx(28)));
            btnNewTab.setOnClickListener(v -> createNewTab("https://duckduckgo.com"));

            HorizontalScrollView tabScrollView = new HorizontalScrollView(this);
            tabScrollView.setLayoutParams(new LinearLayout.LayoutParams(0, dpToPx(28), 1.0f));
            tabScrollView.setHorizontalScrollBarEnabled(false);

            tabStripLayout = new LinearLayout(this);
            tabStripLayout.setOrientation(LinearLayout.HORIZONTAL);
            tabScrollView.addView(tabStripLayout);

            tabControlBar.addView(btnNewTab);
            tabControlBar.addView(tabScrollView);

            webViewHolder = new FrameLayout(this);
            webViewHolder.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            ));

            mainLayout.addView(topBar);
            mainLayout.addView(tabControlBar);
            mainLayout.addView(webViewHolder);

            nativeBrowserContainer.addView(mainLayout);
            rootView.addView(nativeBrowserContainer);

            createNewTab("https://duckduckgo.com");
        });
    }

    private void toggleFullscreenMode() {
        isFullscreenMode = !isFullscreenMode;
        if (isFullscreenMode) {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            );
        } else {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
        }
    }

    private void createNewTab(String url) {
        WebView wv = new WebView(this);
        wv.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        wv.getSettings().setJavaScriptEnabled(true);
        wv.getSettings().setDomStorageEnabled(true);
        wv.getSettings().setUserAgentString("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

        wv.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String finishedUrl) {
                super.onPageFinished(view, finishedUrl);
                if (tabList.indexOf(view) == currentTabIndex && nativeUrlInput != null) {
                    nativeUrlInput.setText(finishedUrl);
                }
                renderTabStrip();
            }
        });

        tabList.add(wv);
        webViewHolder.addView(wv);
        switchToTab(tabList.size() - 1);
        wv.loadUrl(url);
    }

    private void switchToTab(int index) {
        if (index < 0 || index >= tabList.size()) return;
        currentTabIndex = index;
        for (int i = 0; i < tabList.size(); i++) {
            tabList.get(i).setVisibility(i == index ? View.VISIBLE : View.GONE);
        }
        if (nativeUrlInput != null) {
            String url = tabList.get(index).getUrl();
            nativeUrlInput.setText(url != null ? url : "https://duckduckgo.com");
        }
        renderTabStrip();
    }

    private void closeTab(int index) {
        if (tabList.size() <= 1) return;
        WebView wv = tabList.remove(index);
        webViewHolder.removeView(wv);
        wv.destroy();

        if (currentTabIndex >= tabList.size()) {
            currentTabIndex = tabList.size() - 1;
        }
        switchToTab(currentTabIndex);
    }

    private void renderTabStrip() {
        if (tabStripLayout == null) return;
        tabStripLayout.removeAllViews();

        for (int i = 0; i < tabList.size(); i++) {
            final int tabIdx = i;
            WebView wv = tabList.get(i);

            LinearLayout tabItem = new LinearLayout(this);
            tabItem.setOrientation(LinearLayout.HORIZONTAL);
            tabItem.setGravity(Gravity.CENTER_VERTICAL);
            tabItem.setPadding(dpToPx(8), 0, dpToPx(4), 0);
            
            boolean isActive = (i == currentTabIndex);
            tabItem.setBackgroundColor(Color.parseColor(isActive ? "#27272a" : "#18181b"));

            LinearLayout.LayoutParams itemParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            );
            itemParams.setMargins(0, 0, dpToPx(4), 0);
            tabItem.setLayoutParams(itemParams);

            Button btnTitle = new Button(this);
            String title = wv.getTitle();
            btnTitle.setText((title != null && !title.isEmpty()) ? title : "Tab " + (i + 1));
            btnTitle.setTextSize(9);
            btnTitle.setTextColor(isActive ? Color.CYAN : Color.GRAY);
            btnTitle.setBackgroundColor(Color.TRANSPARENT);
            btnTitle.setOnClickListener(v -> switchToTab(tabIdx));

            Button btnClose = new Button(this);
            btnClose.setText("✕");
            btnClose.setTextSize(8);
            btnClose.setTextColor(Color.RED);
            btnClose.setBackgroundColor(Color.TRANSPARENT);
            btnClose.setOnClickListener(v -> closeTab(tabIdx));

            tabItem.addView(btnTitle);
            if (tabList.size() > 1) {
                tabItem.addView(btnClose);
            }
            tabStripLayout.addView(tabItem);
        }
    }

    public void openNativeBrowser(String url) {
        runOnUiThread(() -> {
            if (nativeBrowserContainer != null) {
                nativeBrowserContainer.setVisibility(View.VISIBLE);
                if (tabList.isEmpty()) {
                    createNewTab((url != null && !url.isEmpty()) ? url : "https://duckduckgo.com");
                }
            }
        });
    }

    public void closeNativeBrowser() {
        runOnUiThread(() -> {
            if (nativeBrowserContainer != null) {
                nativeBrowserContainer.setVisibility(View.GONE);
            }
        });
    }

    private void checkAndRequestPermissions() {
        String[] permissions = {
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
        };
        ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && !Environment.isExternalStorageManager()) {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION);
                intent.setData(Uri.parse("package:" + getPackageName()));
                startActivity(intent);
            } catch (Exception e) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION);
                startActivity(intent);
            }
        }
    }

    public class AndroidBridge {
        @JavascriptInterface
        public void launchNativeBrowser(String url) {
            openNativeBrowser((url != null && !url.isEmpty()) ? url : "https://duckduckgo.com");
        }

        @JavascriptInterface
        public void exitNativeBrowser() {
            closeNativeBrowser();
        }

        @JavascriptInterface
        public String getAllDeviceFiles() {
            JSONArray array = new JSONArray();
            try {
                ContentResolver resolver = getContentResolver();
                Cursor cursor = resolver.query(MediaStore.Files.getContentUri("external"), new String[]{MediaStore.Files.FileColumns._ID, MediaStore.Files.FileColumns.DISPLAY_NAME, MediaStore.Files.FileColumns.SIZE, MediaStore.Files.FileColumns.DATA, MediaStore.Files.FileColumns.MIME_TYPE}, MediaStore.Files.FileColumns.SIZE + " > 0", null, MediaStore.Files.FileColumns.DATE_MODIFIED + " DESC");
                if (cursor != null) {
                    int count = 0;
                    while (cursor.moveToNext() && count < 400) {
                        long id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID));
                        String name = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.DISPLAY_NAME));
                        long size = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.SIZE));
                        String dataPath = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.DATA));
                        String mime = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MIME_TYPE));
                        if (dataPath != null && !dataPath.contains("/Android/data") && !dataPath.contains("/Android/obb")) {
                            JSONObject obj = new JSONObject();
                            obj.put("id", id);
                            obj.put("name", name != null ? name : "File_" + id);
                            obj.put("size", (size / (1024 * 1024) > 0) ? (size / (1024 * 1024)) + " MB" : (size / 1024) + " KB");
                            obj.put("absolutePath", dataPath);
                            obj.put("mimeType", mime != null ? mime : "application/octet-stream");
                            array.put(obj);
                            count++;
                        }
                    }
                    cursor.close();
                }
            } catch (Exception e) { e.printStackTrace(); }
            return array.toString();
        }

        @JavascriptInterface
        public String getSovereignGalleryPhotos() {
            JSONArray array = new JSONArray();
            try {
                ContentResolver resolver = getContentResolver();
                Cursor cursor = resolver.query(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, new String[]{ MediaStore.Images.Media._ID, MediaStore.Images.Media.DISPLAY_NAME, MediaStore.Images.Media.SIZE, MediaStore.Images.Media.DATA, MediaStore.Images.Media.RELATIVE_PATH }, null, null, MediaStore.Images.Media.DATE_ADDED + " DESC");
                if (cursor != null) {
                    int count = 0;
                    while (cursor.moveToNext() && count < 300) {
                        long id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID));
                        String name = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME));
                        long size = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.SIZE));
                        String dataPath = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA));
                        String relPath = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.RELATIVE_PATH));
                        Uri contentUri = Uri.withAppendedPath(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, String.valueOf(id));
                        if (dataPath != null) {
                            JSONObject obj = new JSONObject();
                            obj.put("id", id);
                            obj.put("name", name != null ? name : "Img_" + id);
                            obj.put("size", (size / 1024) + " KB");
                            obj.put("type", "image");
                            obj.put("absolutePath", dataPath);
                            obj.put("folder", relPath != null && relPath.contains("Screenshots") ? "Screenshots" : "Camera");
                            obj.put("cleanUrl", contentUri.toString());
                            array.put(obj);
                            count++;
                        }
                    }
                    cursor.close();
                }
                
                Cursor vCursor = resolver.query(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, new String[]{ MediaStore.Video.Media._ID, MediaStore.Video.Media.DISPLAY_NAME, MediaStore.Video.Media.SIZE, MediaStore.Video.Media.DATA, MediaStore.Video.Media.RELATIVE_PATH, MediaStore.Video.Media.MIME_TYPE }, null, null, MediaStore.Video.Media.DATE_ADDED + " DESC");
                if (vCursor != null) {
                    int vCount = 0;
                    while (vCursor.moveToNext() && vCount < 100) {
                        long id = vCursor.getLong(vCursor.getColumnIndexOrThrow(MediaStore.Video.Media._ID));
                        String name = vCursor.getString(vCursor.getColumnIndexOrThrow(MediaStore.Video.Media.DISPLAY_NAME));
                        long size = vCursor.getLong(vCursor.getColumnIndexOrThrow(MediaStore.Video.Media.SIZE));
                        String dataPath = vCursor.getString(vCursor.getColumnIndexOrThrow(MediaStore.Video.Media.DATA));
                        String relPath = vCursor.getString(vCursor.getColumnIndexOrThrow(MediaStore.Video.Media.RELATIVE_PATH));
                        String mime = vCursor.getString(vCursor.getColumnIndexOrThrow(MediaStore.Video.Media.MIME_TYPE));
                        Uri contentUri = Uri.withAppendedPath(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, String.valueOf(id));
                        if (dataPath != null) {
                            JSONObject obj = new JSONObject();
                            obj.put("id", id + 10000000);
                            obj.put("name", name != null ? name : "Vid_" + id);
                            obj.put("size", (size / (1024 * 1024) > 0) ? (size / (1024 * 1024)) + " MB" : (size / 1024) + " KB");
                            obj.put("type", "video");
                            obj.put("absolutePath", dataPath);
                            obj.put("folder", relPath != null && relPath.contains("SovereignTools") ? "Sovereign Videos" : "Videos");
                            obj.put("cleanUrl", contentUri.toString());
                            obj.put("mimeType", mime != null ? mime : "video/mp4");
                            array.put(obj);
                            vCount++;
                        }
                    }
                    vCursor.close();
                }
            } catch (Exception e) { e.printStackTrace(); }
            return array.toString();
        }

        @JavascriptInterface
        public boolean shredFileByAbsolutePath(String absolutePath) {
            try {
                File file = new File(absolutePath);
                if (file.exists()) {
                    long length = file.length();
                    if (length > 0) {
                        RandomAccessFile raf = new RandomAccessFile(file, "rw");
                        raf.write(new byte[8192]);
                        raf.close();
                    }
                    boolean deleted = file.delete();
                    getContentResolver().delete(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, MediaStore.Images.Media.DATA + "=?", new String[]{absolutePath});
                    return deleted;
                }
            } catch (Exception e) { e.printStackTrace(); }
            return false;
        }

        @JavascriptInterface
        public boolean shredFileByUri(String uriString) {
            try {
                Uri uri = Uri.parse(uriString);
                getContentResolver().delete(uri, null, null);
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Deleted", Toast.LENGTH_SHORT).show());
                return true;
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }

        @JavascriptInterface
        public String fetchUrl(String urlString) {
            try {
                URL url = new URL(urlString);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0");
                conn.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);

                BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder content = new StringBuilder();
                String inputLine;
                while ((inputLine = in.readLine()) != null) {
                    content.append(inputLine).append("\n");
                }
                in.close();
                conn.disconnect();
                return content.toString();
            } catch (Exception e) {
                return "ERROR: " + e.getMessage();
            }
        }

        @JavascriptInterface
        public boolean setNetworkProxy(String proxyType, String host, int port) {
            if (!WebViewFeature.isFeatureSupported(WebViewFeature.PROXY_OVERRIDE)) {
                return false;
            }

            try {
                ProxyConfig.Builder proxyConfigBuilder = new ProxyConfig.Builder();
                if ("tor".equalsIgnoreCase(proxyType) || "socks".equalsIgnoreCase(proxyType)) {
                    proxyConfigBuilder.addProxyRule("socks://" + host + ":" + port);
                } else if ("http".equalsIgnoreCase(proxyType)) {
                    proxyConfigBuilder.addProxyRule("http://" + host + ":" + port);
                } else {
                    ProxyController.getInstance().clearProxyOverride(Executors.newSingleThreadExecutor(), () -> {
                        runOnUiThread(() -> Toast.makeText(MainActivity.this, "Direct connection active", Toast.LENGTH_SHORT).show());
                    });
                    return true;
                }

                ProxyConfig proxyConfig = proxyConfigBuilder.build();
                ProxyController.getInstance().setProxyOverride(proxyConfig, Executors.newSingleThreadExecutor(), () -> {
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "Proxy active: " + host + ":" + port, Toast.LENGTH_SHORT).show());
                });
                return true;
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }

        @JavascriptInterface
        public boolean saveToGallery(String base64Data, String filename, String mimeType) {
            try {
                byte[] data = Base64.decode(base64Data.contains(",") ? base64Data.split(",")[1] : base64Data, Base64.DEFAULT);
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DCIM + "/SovereignTools");
                Uri uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                if (uri != null) {
                    OutputStream out = getContentResolver().openOutputStream(uri);
                    if (out != null) {
                        out.write(data);
                        out.close();
                        return true;
                    }
                }
            } catch (Exception e) { e.printStackTrace(); }
            return false;
        }
    }
}
