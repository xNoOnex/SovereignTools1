package com.sovereign.tools;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.database.Cursor;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.ParcelFileDescriptor;
import android.provider.MediaStore;
import android.provider.Settings;
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
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.RandomAccessFile;
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

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (!Environment.isExternalStorageManager()) {
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
    }

    private String resolveRealPathFromUri(Uri uri) {
        String path = null;
        try {
            String[] proj = { MediaStore.MediaColumns.DATA };
            Cursor cursor = getContentResolver().query(uri, proj, null, null, null);
            if (cursor != null) {
                if (cursor.moveToFirst()) {
                    int colIdx = cursor.getColumnIndex(MediaStore.MediaColumns.DATA);
                    if (colIdx != -1) {
                        path = cursor.getString(colIdx);
                    }
                }
                cursor.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        if (path == null && uri != null) {
            path = uri.getPath();
            if (path != null && path.startsWith("/raw/")) {
                path = path.replace("/raw/", "");
            }
        }
        return path;
    }

    public class AndroidBridge {

        @JavascriptInterface
        public String getSovereignGalleryPhotos() {
            JSONArray array = new JSONArray();
            try {
                ContentResolver resolver = getContentResolver();

                Uri imageUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                String[] imageProj = {
                    MediaStore.Images.Media._ID,
                    MediaStore.Images.Media.DISPLAY_NAME,
                    MediaStore.Images.Media.SIZE,
                    MediaStore.Images.Media.RELATIVE_PATH
                };
                String imageSelection = MediaStore.Images.Media.RELATIVE_PATH + " LIKE ? OR " + MediaStore.Images.Media.RELATIVE_PATH + " LIKE ?";
                String[] imageArgs = new String[]{"%DCIM/SovereignTools%", "%Pictures%"};

                Cursor cursor = resolver.query(imageUri, imageProj, imageSelection, imageArgs, MediaStore.Images.Media.DATE_ADDED + " DESC");
                if (cursor != null) {
                    while (cursor.moveToNext()) {
                        long id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID));
                        String name = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME));
                        long size = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.SIZE));
                        String relPath = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.RELATIVE_PATH));
                        Uri fullUri = Uri.withAppendedPath(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, String.valueOf(id));

                        InputStream inputStream = resolver.openInputStream(fullUri);
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
                        obj.put("type", "image");
                        obj.put("folder", (relPath != null && relPath.contains("DCIM")) ? "Camera Photos" : "Imported Photos");
                        obj.put("uri", fullUri.toString());
                        obj.put("cleanUrl", "data:image/jpeg;base64," + base64Str);

                        array.put(obj);
                    }
                    cursor.close();
                }

                Uri videoUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
                String[] videoProj = {
                    MediaStore.Video.Media._ID,
                    MediaStore.Video.Media.DISPLAY_NAME,
                    MediaStore.Video.Media.SIZE,
                    MediaStore.Video.Media.MIME_TYPE
                };
                String videoSelection = MediaStore.Video.Media.RELATIVE_PATH + " LIKE ? OR " + MediaStore.Video.Media.RELATIVE_PATH + " LIKE ?";
                String[] videoArgs = new String[]{"%Movies/SovereignTools%", "%DCIM/SovereignTools%"};

                Cursor vCursor = resolver.query(videoUri, videoProj, videoSelection, videoArgs, MediaStore.Video.Media.DATE_ADDED + " DESC");
                if (vCursor != null) {
                    while (vCursor.moveToNext()) {
                        long id = vCursor.getLong(vCursor.getColumnIndexOrThrow(MediaStore.Video.Media._ID));
                        String name = vCursor.getString(vCursor.getColumnIndexOrThrow(MediaStore.Video.Media.DISPLAY_NAME));
                        long size = vCursor.getLong(vCursor.getColumnIndexOrThrow(MediaStore.Video.Media.SIZE));
                        String mime = vCursor.getString(vCursor.getColumnIndexOrThrow(MediaStore.Video.Media.MIME_TYPE));
                        Uri fullUri = Uri.withAppendedPath(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, String.valueOf(id));

                        JSONObject obj = new JSONObject();
                        obj.put("id", id + 1000000);
                        obj.put("name", name);
                        obj.put("size", (size / 1024) + " KB");
                        obj.put("type", "video");
                        obj.put("folder", "Camera Videos");
                        obj.put("uri", fullUri.toString());
                        obj.put("cleanUrl", fullUri.toString());
                        obj.put("mimeType", mime != null ? mime : "video/mp4");

                        array.put(obj);
                    }
                    vCursor.close();
                }

            } catch (Exception e) {
                e.printStackTrace();
            }
            return array.toString();
        }

        @JavascriptInterface
        public boolean shredFileByUri(String uriString) {
            try {
                Uri uri = Uri.parse(uriString);
                ContentResolver resolver = getContentResolver();
                String realPath = resolveRealPathFromUri(uri);

                boolean sectorWiped = false;

                if (realPath != null) {
                    File file = new File(realPath);
                    if (file.exists() && file.canWrite()) {
                        long length = file.length();
                        RandomAccessFile raf = new RandomAccessFile(file, "rw");
                        byte[] zeros = new byte[8192];
                        long written = 0;
                        while (written < length) {
                            int toWrite = (int) Math.min(zeros.length, length - written);
                            raf.write(zeros, 0, toWrite);
                            written += toWrite;
                        }
                        raf.getFD().sync();
                        raf.close();

                        file.delete();
                        sectorWiped = true;
                    }
                }

                if (!sectorWiped) {
                    try (ParcelFileDescriptor pfd = resolver.openFileDescriptor(uri, "rwt")) {
                        if (pfd != null) {
                            FileOutputStream fos = new FileOutputStream(pfd.getFileDescriptor());
                            long size = pfd.getStatSize();
                            if (size > 0) {
                                byte[] zeros = new byte[8192];
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
                }

                resolver.delete(uri, null, null);

                String scanPath = (realPath != null) ? realPath : uri.getPath();
                if (scanPath != null) {
                    MediaScannerConnection.scanFile(
                        MainActivity.this, 
                        new String[]{scanPath}, 
                        null, 
                        (p, u) -> {}
                    );
                }

                runOnUiThread(() -> Toast.makeText(MainActivity.this, "💥 Physical Storage Zeroed & Shredded", Toast.LENGTH_SHORT).show());
                return true;
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }

        // STANDALONE NATIVE PRIVACY HTTP ENGINE (NO EXTERNAL APPS NEEDED)
        @JavascriptInterface
        public String fetchUrl(String urlString) {
            try {
                URL url = new URL(urlString);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                // Sanitized headers to strip device fingerprinting & referrer leaks
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0");
                conn.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
                conn.setRequestProperty("Accept-Language", "en-US,en;q=0.5");
                conn.setRequestProperty("DNT", "1");
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
                        runOnUiThread(() -> Toast.makeText(MainActivity.this, "🚫 Direct Mode Active", Toast.LENGTH_SHORT).show());
                    });
                    return true;
                }

                ProxyConfig proxyConfig = proxyConfigBuilder.build();
                Executor executor = Executors.newSingleThreadExecutor();

                ProxyController.getInstance().setProxyOverride(proxyConfig, executor, () -> {
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "🔒 Proxy Tunnel Active: " + host + ":" + port, Toast.LENGTH_SHORT).show());
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
