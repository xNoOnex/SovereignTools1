import { useState, useEffect } from 'react';
import { SecureStorage } from '../utils/secureStorage';

export function useSecureStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const masterkey = window.__SOVEREIGN_KEY__;
        if (!masterkey) {
          if (isMounted) {
            setStoredValue(initialValue);
            setLoading(false);
          }
          return;
        }

        const item = await SecureStorage.getItem(key, masterkey);
        if (isMounted) {
          // If the Decoy PIN generates a bad AES key, getItem returns null, instantly wiping the UI state.
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

    // Force a data refresh when the LockScreen authenticates a new state
    window.addEventListener('secure_session_update', loadData);

    return () => {
      isMounted = false;
      window.removeEventListener('secure_session_update', loadData);
    };
  }, [key]);

  const setValue = async (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      const masterkey = window.__SOVEREIGN_KEY__;
      if (masterkey) {
        await SecureStorage.setItem(key, valueToStore, masterkey);
      }
    } catch (error) {
      console.error(`[Vault] Encryption error for ${key}:`, error);
    }
  };

  return [storedValue, setValue, loading];
}
