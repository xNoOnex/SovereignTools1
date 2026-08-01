package com.sovereign.tools;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.app.ActivityCompat;
import androidx.webkit.ProxyConfig;
import androidx.webkit.ProxyController;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;

import java.io.OutputStream;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

public class MainActivity extends BridgeActivity {
    private ValueCallback<Uri[]> filePathCallback;
    private final static int FILECHOOSER_RESULTCODE = 1001;
    private final static int PERMISSION_REQUEST_CODE = 2002;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestAndroidPermissions();

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            webView.getSettings().setAllowFileAccess(true);
            webView.getSettings().setAllowContentAccess(true);
            webView.getSettings().setJavaScriptEnabled(true);
            
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
    }

    private void requestAndroidPermissions() {
        String[] permissions = {
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
        };
        ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
    }

    public class AndroidBridge {
        
        @JavascriptInterface
        public boolean setNetworkProxy(String proxyType, String host, int port) {
            if (!WebViewFeature.isFeatureSupported(WebViewFeature.PROXY_OVERRIDE)) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "⚠️ Proxy override not supported on this WebKit version", Toast.LENGTH_SHORT).show());
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
                        runOnUiThread(() -> Toast.makeText(MainActivity.this, "🚫 Proxy Cleared (Direct Connection)", Toast.LENGTH_SHORT).show());
                    });
                    return true;
                }

                ProxyConfig proxyConfig = proxyConfigBuilder.build();
                Executor executor = Executors.newSingleThreadExecutor();

                ProxyController.getInstance().setProxyOverride(proxyConfig, executor, () -> {
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "🧅 Proxy Active: " + host + ":" + port, Toast.LENGTH_SHORT).show());
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
                // Safe Java base64 header extraction (no regex literals)
                String cleanBase64 = base64Data.contains(",") ? base64Data.split(",")[1] : base64Data;
                byte[] data = Base64.decode(cleanBase64, Base64.DEFAULT);
                
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                
                boolean isVideo = mimeType.startsWith("video");
                values.put(
                    MediaStore.MediaColumns.RELATIVE_PATH, 
                    isVideo ? Environment.DIRECTORY_MOVIES + "/SovereignTools" : Environment.DIRECTORY_DCIM + "/SovereignTools"
                );

                ContentResolver resolver = getContentResolver();
                Uri targetUri = isVideo ? MediaStore.Video.Media.EXTERNAL_CONTENT_URI : MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                Uri uri = resolver.insert(targetUri, values);

                if (uri != null) {
                    OutputStream out = resolver.openOutputStream(uri);
                    if (out != null) {
                        out.write(data);
                        out.flush();
                        out.close();
                        runOnUiThread(() -> Toast.makeText(
                            MainActivity.this, 
                            isVideo ? "🎥 Video Saved to Movies/SovereignTools" : "📸 Photo Saved to DCIM/SovereignTools", 
                            Toast.LENGTH_LONG
                        ).show());
                        return true;
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }

        @JavascriptInterface
        public boolean shredFileByUri(String uriString) {
            try {
                Uri uri = Uri.parse(uriString);
                ContentResolver resolver = getContentResolver();
                int deletedRows = resolver.delete(uri, null, null);
                if (deletedRows > 0) {
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "💥 Physical File Unlinked & Shredded", Toast.LENGTH_SHORT).show());
                    return true;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (filePathCallback == null) return;
            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null) {
                String dataString = data.getDataString();
                if (dataString != null) {
                    results = new Uri[]{Uri.parse(dataString)};
                } else if (data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                }
            }
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        }
    }
}
