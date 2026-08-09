import { BleClient } from '@capacitor-community/bluetooth-le';
import { registerPlugin } from '@capacitor/core';

const SovereignGatt = registerPlugin('SovereignGatt');

class BleMeshService {
    constructor() {
        this.isActive = false;
        this.SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
        this.CHAR_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
        this.activeConnections = new Set();
    }

    async deployScout(logCallback) {
        try {
            await BleClient.initialize({ androidNeverForLocation: true });
            this.isActive = true;
            logCallback("BLE SCOUT DEPLOYED. RADIO INITIALIZED.");

            try {
                await SovereignGatt.startServer();
                logCallback("GATT SERVER ONLINE. BROADCASTING BEACON.");
                
                SovereignGatt.addListener('onSwarmPayload', (event) => {
                    logCallback("INCOMING BLE PAYLOAD DETECTED!");
                    this.processIncomingGossip(event.data, logCallback);
                });
            } catch (nativeErr) {
                logCallback("GATT ERROR: " + (nativeErr.message || "Unknown native failure."));
            }

            await BleClient.requestLEScan(
                { services: [this.SERVICE_UUID] },
                (result) => {
                    this.executeDataSwap(result.device.deviceId, logCallback);
                }
            );
            
            logCallback("HYBRID SCOUT ACTIVE. WAITING FOR PEERS.");
        } catch (error) {
            logCallback("CRITICAL: BLE RADIO FAILURE. " + error.message);
            this.isActive = false;
        }
    }

    async executeDataSwap(deviceId, logCallback) {
        // Prevent spamming the same device if we are already connected to it
        if (this.activeConnections.has(deviceId)) return; 
        this.activeConnections.add(deviceId);
        
        logCallback(`TARGET LOCKED: [${deviceId}]. ESTABLISHING UPLINK...`);
        
        try {
            await BleClient.connect(deviceId);
            
            // Request max MTU bandwidth (up to 512 bytes on modern Android)
            try { await BleClient.requestMtu(deviceId, 512); } catch (e) {}

            // Package the local Swarm Ledgers
            const ledgers = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('swarm_ledger_')) {
                    ledgers[key] = localStorage.getItem(key);
                }
            }
            const payloadString = JSON.stringify({ type: 'SWARM_SYNC', data: ledgers });
            
            // Convert to byte stream
            const encoder = new TextEncoder();
            const data = encoder.encode(payloadString);
            const dataView = new DataView(data.buffer);
            
            // Fire the payload directly into the peer's GATT Server
            await BleClient.write(deviceId, this.SERVICE_UUID, this.CHAR_UUID, dataView);
            logCallback(`PAYLOAD DELIVERED TO [${deviceId}].`);
            
            // Instantly sever connection to save power
            await BleClient.disconnect(deviceId);
        } catch (err) {
            logCallback(`UPLINK FAILED WITH [${deviceId}]: ` + err.message);
        }
        
        // 15-second cooldown before we allow a reconnect to the exact same device
        setTimeout(() => {
            this.activeConnections.delete(deviceId);
        }, 15000);
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
                if (updated > 0) {
                    logCallback(`${updated} LOCAL VAULTS UPDATED VIA BLUETOOTH.`);
                    // Force the UI to refresh if you are currently looking at the chat
                    window.dispatchEvent(new Event('storage'));
                } else {
                    logCallback("INCOMING PAYLOAD IDENTICAL. NO UPDATES.");
                }
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
