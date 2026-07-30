import { BleClient } from '@capacitor-community/bluetooth-le';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

// Initialize and Scan Bluetooth LE Nodes
export const scanBluetoothMesh = async (onDeviceFound, onError) => {
  try {
    await BleClient.initialize();
    
    // Start scanning for nearby Bluetooth LE nodes
    await BleClient.requestLEScan({}, (result) => {
      if (onDeviceFound) {
        onDeviceFound({
          name: result.localName || 'Unknown Mesh Node',
          id: result.device.deviceId,
          rssi: result.rssi
        });
      }
    });

    // Auto-stop scan after 10 seconds to save battery
    setTimeout(async () => {
      await BleClient.stopLEScan();
    }, 10000);

  } catch (err) {
    if (onError) onError(err.message || 'Bluetooth scan failed');
  }
};

// Capture Stream / Camera Frame
export const captureLocalStream = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera
    });
    return image.webPath;
  } catch (err) {
    console.error('Camera access error:', err);
    return null;
  }
};
