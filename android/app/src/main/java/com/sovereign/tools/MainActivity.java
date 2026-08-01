package com.sovereign.tools;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.os.ParcelFileDescriptor;
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

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
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

        // Scan DCIM/SovereignTools and return JSON list of persistent gallery photos
        @JavascriptInterface
        public String getSovereignGalleryPhotos() {
            JSONArray array = new JSONArray();
            try {
                ContentResolver resolver = getContentResolver();
                Uri uri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                String[] projection = {
                    MediaStore.Images.Media._ID,
                    MediaStore.Images.Media.DISPLAY_NAME,
                    MediaStore.Images.Media.SIZE
                };
                
                String selection = MediaStore.Images.Media.RELATIVE_PATH + " LIKE ?";
                String[] selectionArgs = new String[]{"%DCIM/SovereignTools%"};

                Cursor cursor = resolver.query(uri, projection, selection, selectionArgs, MediaStore.Images.Media.DATE_ADDED + " DESC");
                if (cursor != null) {
                    while (cursor.moveToNext()) {
                        long id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID));
                        String name = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME));
                        long size = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.SIZE));
                        Uri imageUri = Uri.withAppendedPath(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, String.valueOf(id));

                        // Convert image stream to base64 data URI for rendering
                        InputStream inputStream = resolver.openInputStream(imageUri);
                        ByteArrayOutputStream byteBuffer = new ByteArrayOutputStream();
                        byte[] buffer = new byte[4096];
                        int len;
                        while ((len = inputStream.read(buffer)) != -1) {
                            byteBuffer.write(buffer, 0, len);
                        }
                        inputStream.close();

                        String base64Str = Base64.encodeToString(byteBuffer.toByteArray(), Base64.NO_WRAP);
                        
                        JSONObject obj = new JSONObject();
                        obj.put("id", id);
                        obj.put("name", name);
                        obj.put("size", (size / 1024) + " KB");
                        obj.put("uri", imageUri.toString());
                        obj.put("cleanUrl", "data:image/jpeg;base64," + base64Str);

                        array.put(obj);
                    }
                    cursor.close();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return array.toString();
        }

        @JavascriptInterface
        public String fetchUrl(String urlString) {
            try {
                URL url = new URL(urlString);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SovereignTools/1.0");
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);

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
        public boolean shredFileByUri(String uriString) {
            try {
                Uri uri = Uri.parse(uriString);
                ContentResolver resolver = getContentResolver();

                try (ParcelFileDescriptor pfd = resolver.openFileDescriptor(uri, "rw")) {
                    if (pfd != null) {
                        FileOutputStream fos = new FileOutputStream(pfd.getFileDescriptor());
                        long size = pfd.getStatSize();
                        if (size > 0) {
                            byte[] zeros = new byte[4096];
                            long written = 0;
                            while (written < size) {
                                int toWrite = (int) Math.min(zeros.length, size - written);
                                fos.write(zeros, 0, toWrite);
                                written += toWrite;
                            }
                            fos.flush();
                        }
                        fos.close();
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }

                int deletedRows = resolver.delete(uri, null, null);
                if (deletedRows > 0) {
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "💥 File Zeroed Out & Permanently Deleted", Toast.LENGTH_SHORT).show());
                    return true;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
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
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (filePathCallback == null) return;
            Uri[] results = null;
            JSONArray uriList = new JSONArray();

            if (resultCode == RESULT_OK && data != null) {
                String dataString = data.getDataString();
                if (dataString != null) {
                    Uri singleUri = Uri.parse(dataString);
                    results = new Uri[]{singleUri};
                    try {
                        JSONObject obj = new JSONObject();
                        obj.put("uri", singleUri.toString());
                        uriList.put(obj);
                    } catch (Exception e) {}
                } else if (data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        Uri itemUri = data.getClipData().getItemAt(i).getUri();
                        results[i] = itemUri;
                        try {
                            JSONObject obj = new JSONObject();
                            obj.put("uri", itemUri.toString());
                            uriList.put(obj);
                        } catch (Exception e) {}
                    }
                }
            }

            if (this.bridge != null && this.bridge.getWebView() != null) {
                final String jsonStr = uriList.toString();
                runOnUiThread(() -> {
                    this.bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('nativeFilesSelected', { detail: " + jsonStr + " }));", null);
                });
            }

            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        }
    }
}
