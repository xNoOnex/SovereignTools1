export const SecureStorage = {
  // Derive a strong AES key from the volatile Master PIN
  async deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: enc.encode(salt),
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  },

  // Encrypt data and save to flash memory with a 'sec_' prefix
  async setItem(key, value, masterKey) {
    try {
      const cryptoKey = await this.deriveKey(masterKey, key);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const enc = new TextEncoder();
      const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        enc.encode(JSON.stringify(value))
      );
      
      const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
      const encHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // The 'sec_' prefix allows the Cryptographic Shredder to find and wipe these specific files
      localStorage.setItem('sec_' + key, ivHex + ':' + encHex);
    } catch (e) {
      console.error('[Vault] Encryption failed', e);
    }
  },

  // Read from flash memory and decrypt back to plaintext
  async getItem(key, masterKey) {
    try {
      const raw = localStorage.getItem('sec_' + key);
      if (!raw) return null;
      
      const [ivHex, encHex] = raw.split(':');
      const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const encData = new Uint8Array(encHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      
      const cryptoKey = await this.deriveKey(masterKey, key);
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        encData
      );
      
      const dec = new TextDecoder();
      return JSON.parse(dec.decode(decrypted));
    } catch (e) {
      // If decryption fails (e.g., Decoy PIN is used), return null to maintain plausible deniability
      return null;
    }
  },

  async removeItem(key) {
    localStorage.removeItem('sec_' + key);
  }
};
