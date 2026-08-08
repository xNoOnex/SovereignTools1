import { BleClient } from '@capacitor-community/bluetooth-le';
import { registerPlugin } from '@capacitor/core';

// Bridge to our custom native Java GATT Server
const SovereignGatt = registerPlugin('SovereignGatt');

class BleMeshService {
    constructor() {
        this.isActive = false;
        this.SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
    }

    async deployScout(logCallback) {
        try {
            await BleClient.initialize({ androidNeverForLocation: true });
            this.isActive = true;
            logCallback("BLE SCOUT DEPLOYED. RADIO INITIALIZED.");

            // 1. Ignite the Native Java GATT Server (We are now broadcasting!)
            try {
                await SovereignGatt.startServer();
                logCallback("GATT SERVER ONLINE. BROADCASTING BEACON.");
                
                // Listen for incoming native payloads
                SovereignGatt.addListener('onSwarmPayload', (event) => {
                    logCallback("INCOMING BLE PAYLOAD DETECTED!");
                    this.processIncomingGossip(event.data, logCallback);
                });
            } catch (nativeErr) {
                logCallback("GATT SERVER FAILED: Hardware restricted or permission denied.");
            }

            // 2. Start Scanning (We are also listening!)
            await BleClient.requestLEScan(
                { services: [this.SERVICE_UUID] },
                (result) => {
                    logCallback(`PEER DETECTED: [${result.device.deviceId}]`);
                    // In a full implementation, we would connect and write our payload here
                }
            );
            
            logCallback("HYBRID SCOUT ACTIVE. WAITING FOR PEERS.");
        } catch (error) {
            logCallback("CRITICAL: BLE RADIO FAILURE. " + error.message);
            this.isActive = false;
        }
    }

    processIncomingGossip(payloadString, logCallback) {
        try {
            const payload = JSON.parse(payloadString);
            if (payload.type === 'SWARM_SYNC') {
                let updated = 0;
                Object.keys(payload.data).forEach(key => {
                    const localData = localStorage.getItem(key);
                    const incomingData = payload.data[key];
                    if (!localData || incomingData.length > localData.length) {
                        localStorage.setItem(key, incomingData);
                        updated++;
                    }
                });
                logCallback(`${updated} LOCAL VAULTS UPDATED VIA BLUETOOTH.`);
            }
        } catch (e) {
            logCallback("IGNORED MALFORMED BLUETOOTH PACKET.");
        }
    }

    async killScout(logCallback) {
        if (!this.isActive) return;
        try {
            await BleClient.stopLEScan();
            await SovereignGatt.stopServer().catch(()=>console.log("No GATT to stop"));
            SovereignGatt.removeAllListeners();
            this.isActive = false;
            logCallback("BLE SCOUT TERMINATED. RADIO DARK.");
        } catch (error) {
            logCallback("ERROR KILLING SCOUT: " + error.message);
        }
    }
}

export const BleScout = new BleMeshService();
