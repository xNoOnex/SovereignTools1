import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { registerPlugin } from '@capacitor/core';

const StorageIntentBridge = registerPlugin('StorageIntentBridge');
const StorageContext = createContext();

const SKIP_DIRS = new Set([
  'android', '.thumbnails', '.trash', '.git', 'node_modules', 'cache', 'code_cache'
]);

export function StorageProvider({ children }) {
  const [indexedFiles, setIndexedFiles] = useState([]);
  const [permGranted, setPermGranted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scanLockRef = useRef(false);
  const permCheckedRef = useRef(false);

  const deepScanDirectory = async (basePath, folderLabel, depth = 0) => {
    if (depth > 4) return [];
    const results = [];
    try {
      const scan = await Filesystem.readdir({
        path: basePath,
        directory: Directory.ExternalStorage
      });
      if (scan && scan.files) {
        for (const f of scan.files) {
          const fileName = typeof f === 'string' ? f : (f.name || '');
          if (!fileName || fileName.startsWith('.')) continue;

          const lowerName = fileName.toLowerCase();
          if (SKIP_DIRS.has(lowerName)) continue;

          const fileType = f.type || (!fileName.includes('.') ? 'directory' : 'file');

          if (fileType === 'directory') {
            const nested = await deepScanDirectory(
              `${basePath}/${fileName}`,
              folderLabel || fileName,
              depth + 1
            );
            for (let i = 0; i < nested.length; i++) {
              results.push(nested[i]);
            }
          } else {
            const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
            results.push({
              name: fileName,
              path: `/storage/emulated/0/${basePath}/${fileName}`,
              relativePath: `${basePath}/${fileName}`,
              directory: 'EXTERNAL',
              ext,
              folder: folderLabel || basePath.split('/')[0]
            });
          }
        }
      }
    } catch (e) {
      // Skip inaccessible folders silently
    }
    return results;
  };

  const scanInternalAesVault = async () => {
    const vaultResults = [];
    try {
      const res = await Filesystem.readdir({
        path: '',
        directory: Directory.Data
      });
      if (res && res.files) {
        for (const f of res.files) {
          const fileName = typeof f === 'string' ? f : (f.name || '');
          if (!fileName) continue;
          const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
          if (['aes', 'enc', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'aac', 'mp3'].includes(ext)) {
            vaultResults.push({
              name: fileName,
              path: fileName,
              relativePath: fileName,
              directory: 'DATA',
              ext,
              folder: 'AES_VAULT'
            });
          }
        }
      }
    } catch (e) {
      // Skip if internal vault dir not yet initialized
    }
    return vaultResults;
  };

  const runGlobalScan = useCallback(async () => {
    if (scanLockRef.current) return;
    scanLockRef.current = true;
    setIsScanning(true);

    try {
      if (!permCheckedRef.current) {
        permCheckedRef.current = true;
        try {
          await StorageIntentBridge.requestAllFilesAccess();
        } catch (e) {}
      }

      const aggregatedFiles = [];

      // 1. Scan Private Internal AES Vault (Directory.Data)
      const internalFiles = await scanInternalAesVault();
      for (let i = 0; i < internalFiles.length; i++) {
        aggregatedFiles.push(internalFiles[i]);
      }

      // 2. Scan Public External Storage Roots
      const targetRoots = [
        'Download', 'Documents', 'Pictures', 'DCIM',
        'Music', 'Movies', 'Podcasts', 'Audiobooks',
        'Ringtones', 'Notifications', 'Telegram', 'WhatsApp'
      ];

      for (const root of targetRoots) {
        const rootFiles = await deepScanDirectory(root, root, 0);
        for (let i = 0; i < rootFiles.length; i++) {
          aggregatedFiles.push(rootFiles[i]);
        }
      }

      setIndexedFiles(aggregatedFiles);
      if (aggregatedFiles.length > 0) setPermGranted(true);
    } catch (e) {
      console.error('Scanner exception:', e);
    } finally {
      setIsScanning(false);
      scanLockRef.current = false;
    }
  }, []);

  useEffect(() => {
    runGlobalScan();
  }, [runGlobalScan]);

  return (
    <StorageContext.Provider value={{ indexedFiles, runGlobalScan, permGranted, isScanning }}>
      {children}
    </StorageContext.Provider>
  );
}

export const useStorage = () => useContext(StorageContext);
