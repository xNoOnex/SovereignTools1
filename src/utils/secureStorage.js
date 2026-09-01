export const SecureStorage = {
  // Retrieve or create a persistent, cryptographically random salt for PBKDF2
  async getSalt() {
    let salt = localStorage.getItem('sovereign_vault_salt');
    if (!salt) {
      const saltBuffer = window.crypto.getRandomValues(new Uint8Array(16));
      salt = Array.from(saltBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem('sovereign_vault_salt', salt);
    }
    return salt;
  },

  // One-way cryptographic hash for zero-knowledge PIN verification
  async hashPin(pin) {
    if (!pin) return null;
    const salt = await this.getSalt();
    const enc = new TextEncoder();
    const data = enc.encode(salt + pin);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Derive AES-256-GCM key from PIN using PBKDF2 (100,000 rounds)
  async deriveKey(masterkey) {
    if (!masterkey) return null;
    const salt = await this.getSalt();
    const enc = new TextEncoder();
    const saltUint8 = new Uint8Array(salt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(String(masterkey)),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltUint8,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  },

  // Encrypt data to flash storage with AES-GCM and unique 12-byte IV
  async setItem(key, value, masterkey) {
    try {
      if (!masterkey) return;
      const cryptokey = await this.deriveKey(masterkey);
      if (!cryptokey) return;

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const enc = new TextEncoder();
      const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        cryptokey,
        enc.encode(JSON.stringify(value))
      );

      const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
      const encHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      localStorage.setItem('sec_' + key, ivHex + ':' + encHex);
    } catch (e) {
      console.error('[Vault] Encryption failed', e);
    }
  },

  // Read and decrypt payload back to object
  async getItem(key, masterkey) {
    try {
      if (!masterkey) return null;
      const raw = localStorage.getItem('sec_' + key);
      if (!raw) return null;

      const [ivHex, encHex] = raw.split(':');
      if (!ivHex || !encHex) return null;

      const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const encData = new Uint8Array(encHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      
      const cryptokey = await this.deriveKey(masterkey);
      if (!cryptokey) return null;

      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        cryptokey,
        encData
      );

      const dec = new TextDecoder();
      return JSON.parse(dec.decode(decrypted));
    } catch (e) {
      // Returns null on failed decryption (e.g. Decoy PIN) to preserve plausible deniability
      return null;
    }
  },

  async removeItem(key) {
    localStorage.removeItem('sec_' + key);
  }
};
