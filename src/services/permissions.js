import { Camera } from '@capacitor/camera';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { Geolocation } from '@capacitor/geolocation';

export const checkAndRequestPermissions = async () => {
  const status = {
    camera: 'UNKNOWN',
    bluetooth: 'UNKNOWN',
    location: 'UNKNOWN'
  };

  // 1. Request Camera Permission
  try {
    const camRes = await Camera.requestPermissions();
    status.camera = camRes.camera === 'granted' ? 'GRANTED' : 'DENIED';
  } catch (e) {
    status.camera = 'DENIED / NOT SUPPORTED';
  }

  // 2. Request Bluetooth Permission
  try {
    await BleClient.initialize();
    status.bluetooth = 'GRANTED';
  } catch (e) {
    status.bluetooth = 'DENIED / DISABLED';
  }

  // 3. Request Location Permission (Required for BLE scan on Android)
  try {
    const locRes = await Geolocation.requestPermissions();
    status.location = locRes.location === 'granted' ? 'GRANTED' : 'DENIED';
  } catch (e) {
    status.location = 'DENIED / NOT SUPPORTED';
  }

  return status;
};
