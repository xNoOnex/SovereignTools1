package com.sovereign.tools;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;

public class MeshRelayService extends Service {
    private static final String CHANNEL_ID = "MeshRelayChannel";
    private ServerSocket serverSocket;
    private boolean isRunning = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Sovereign Mesh Node Active")
                .setContentText("Relaying background TCP packets on Port 8080.")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();

        startForeground(1, notification);
        startTcpServer();

        return START_STICKY;
    }

    private void startTcpServer() {
        if (isRunning) return;
        isRunning = true;
        new Thread(() -> {
            try {
                serverSocket = new ServerSocket(8080);
                while (isRunning) {
                    // Accepts incoming connections in the background
                    Socket client = serverSocket.accept();
                    // In a production P2P mesh, routing logic handles the client streams here
                    client.close(); 
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }).start();
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        if (serverSocket != null) {
            try { serverSocket.close(); } catch (IOException e) { e.printStackTrace(); }
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "Mesh Node Relay", NotificationManager.IMPORTANCE_LOW);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }
}
