package com.sovereign.tools;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattServer;
import android.bluetooth.BluetoothGattServerCallback;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.content.Context;
import android.os.Build;
import android.os.ParcelUuid;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.UUID;

@CapacitorPlugin(
    name = "SovereignGatt",
    permissions = {
        @Permission(strings = {Manifest.permission.BLUETOOTH_ADVERTISE}, alias = "advertise"),
        @Permission(strings = {Manifest.permission.BLUETOOTH_CONNECT}, alias = "connect")
    }
)
public class SovereignGattPlugin extends Plugin {

    private BluetoothManager bluetoothManager;
    private BluetoothGattServer gattServer;
    private BluetoothLeAdvertiser advertiser;
    
    private static final UUID SERVICE_UUID = UUID.fromString("0000ffe0-0000-1000-8000-00805f9b34fb");
    private static final UUID CHAR_UUID = UUID.fromString("0000ffe1-0000-1000-8000-00805f9b34fb");

    @PluginMethod
    public void startServer(PluginCall call) {
        // Force the OS to grant us broadcasting rights on modern Android
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (getPermissionState("advertise") != PermissionState.GRANTED) {
                requestAllPermissions(call, "permissionCallback");
                return;
            }
        }
        executeStartServer(call);
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (getPermissionState("advertise") == PermissionState.GRANTED) {
                executeStartServer(call);
            } else {
                call.reject("OS DENIED: BLUETOOTH_ADVERTISE runtime permission missing.");
            }
        } else {
            executeStartServer(call);
        }
    }

    @SuppressLint("MissingPermission")
    private void executeStartServer(PluginCall call) {
        try {
            bluetoothManager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
            BluetoothAdapter adapter = bluetoothManager.getAdapter();

            if (adapter == null) {
                call.reject("HARDWARE FATAL: No Bluetooth adapter found on motherboard.");
                return;
            }
            
            if (!adapter.isMultipleAdvertisementSupported()) {
                call.reject("HARDWARE RESTRICTED: Device chipset physically blocks Peripheral Mode (Broadcasting).");
                return;
            }

            advertiser = adapter.getBluetoothLeAdvertiser();
            if (advertiser == null) {
                 call.reject("HARDWARE RESTRICTED: Bluetooth LE Advertiser module is null.");
                 return;
            }

            gattServer = bluetoothManager.openGattServer(getContext(), gattServerCallback);
            if (gattServer == null) {
                 call.reject("OS RESTRICTED: Kernel failed to open GATT Server.");
                 return;
            }

            BluetoothGattCharacteristic characteristic = new BluetoothGattCharacteristic(
                    CHAR_UUID,
                    BluetoothGattCharacteristic.PROPERTY_WRITE | BluetoothGattCharacteristic.PROPERTY_READ,
                    BluetoothGattCharacteristic.PERMISSION_WRITE | BluetoothGattCharacteristic.PERMISSION_READ
            );
            
            BluetoothGattService service = new BluetoothGattService(SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY);
            service.addCharacteristic(characteristic);
            gattServer.addService(service);

            AdvertiseSettings settings = new AdvertiseSettings.Builder()
                    .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                    .setConnectable(true)
                    .build();

            AdvertiseData data = new AdvertiseData.Builder()
                    .setIncludeDeviceName(false)
                    .addServiceUuid(new ParcelUuid(SERVICE_UUID))
                    .build();

            advertiser.startAdvertising(settings, data, advertiseCallback);
            call.resolve();

        } catch (Exception e) {
            call.reject("SYSTEM CRASH: " + e.getMessage());
        }
    }

    @SuppressLint("MissingPermission")
    @PluginMethod
    public void stopServer(PluginCall call) {
        if (advertiser != null) advertiser.stopAdvertising(advertiseCallback);
        if (gattServer != null) {
            gattServer.clearServices();
            gattServer.close();
        }
        call.resolve();
    }

    private final AdvertiseCallback advertiseCallback = new AdvertiseCallback() {
        @Override
        public void onStartSuccess(AdvertiseSettings settingsInEffect) {
            super.onStartSuccess(settingsInEffect);
        }
    };

    private final BluetoothGattServerCallback gattServerCallback = new BluetoothGattServerCallback() {
        @Override
        public void onCharacteristicWriteRequest(BluetoothDevice device, int requestId, BluetoothGattCharacteristic characteristic, boolean preparedWrite, boolean responseNeeded, int offset, byte[] value) {
            super.onCharacteristicWriteRequest(device, requestId, characteristic, preparedWrite, responseNeeded, offset, value);
            
            if (CHAR_UUID.equals(characteristic.getUuid())) {
                String payload = new String(value);
                JSObject ret = new JSObject();
                ret.put("data", payload);
                notifyListeners("onSwarmPayload", ret);
                
                if (responseNeeded) {
                    gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value);
                }
            }
        }
    };
}
