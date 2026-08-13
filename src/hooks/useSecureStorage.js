import { useState, useEffect } from 'react';
import { SecureStorage } from '../utils/secureStorage';

export function useSecureStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        // Automatically grab the master key from RAM
        const masterKey = window.__SOVEREIGN_KEY__ || 'SovereignMasterKeyDefault';
        const item = await SecureStorage.getItem(key, masterKey);
        
        if (isMounted) {
          setStoredValue(item !== null ? item : initialValue);
          setLoading(false);
        }
      } catch (error) {
        console.error(`[Vault] Decryption error for ${key}:`, error);
        if (isMounted) {
          setStoredValue(initialValue);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false; // Cleanup to prevent memory leaks if component unmounts early
    };
  }, [key, initialValue]);

  const setValue = async (value) => {
    try {
      // Allow React function updates just like standard useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Update UI instantly
      setStoredValue(valueToStore);
      
      // Encrypt and write to flash memory in the background
      const masterKey = window.__SOVEREIGN_KEY__ || 'SovereignMasterKeyDefault';
      await SecureStorage.setItem(key, valueToStore, masterKey);
    } catch (error) {
      console.error(`[Vault] Encryption error for ${key}:`, error);
    }
  };

  return [storedValue, setValue, loading];
}
