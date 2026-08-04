import React, { createContext, useContext, useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { registerPlugin } from '@capacitor/core';

const StorageIntentBridge = registerPlugin('StorageIntentBridge');
const StorageContext = createContext();

export function StorageProvider({ children }) {
  const [indexedFiles, setIndexedFiles] = useState([]);
  const [permGranted, setPermGranted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const deepScanDirectory = async (basePath, folderLabel) => {
    let results = [];
    try {
      const scan = await Filesystem.readdir({ path: basePath, directory: Directory.ExternalStorage });
      if (scan && scan.files) {
        for (const f of scan.files) {
           const fileName = typeof f === 'string' ? f : (f.name || '');
           const fileType = f.type || 'file'; 
           
           if (fileType === 'directory' || (!fileName.includes('.') && fileName.length > 0)) {
               // Prevent scanning Android system folders to save massive CPU time
               if (fileName.toLowerCase() === 'android' || fileName.toLowerCase() === '.thumbnails') continue;
               const nestedResults = await deepScanDirectory(`${basePath}/${fileName}`, fileName);
               results = [...results, ...nestedResults];
           } else {
               const ext = fileName.split('.').pop().toLowerCase();
               results.push({
                   name: fileName,
                   path: `/storage/emulated/0/${basePath}/${fileName}`,
                   ext: ext,
                   folder: folderLabel || basePath.split('/')[0]
               });
           }
        }
      }
    } catch (e) {
      // Skip inaccessible
    }
    return results;
  };

  const runGlobalScan = async () => {
    setIsScanning(true);
    try {
      try { await StorageIntentBridge.requestAllFilesAccess(); } catch (e) {}

      // Expanded targets to capture virtually all audio, media, and docs on Android
      const targetRoots = ['Download', 'Documents', 'Pictures', 'DCIM', 'Music', 'Movies', 'Podcasts', 'Audiobooks', 'Ringtones', 'Notifications', 'Telegram', 'WhatsApp'];
      let aggregatedFiles = [];

      for (const root of targetRoots) {
         const rootFiles = await deepScanDirectory(root, root);
         aggregatedFiles = [...aggregatedFiles, ...rootFiles];
      }

      setIndexedFiles(aggregatedFiles);
      if (aggregatedFiles.length > 0) setPermGranted(true);
    } catch (e) {
      console.error("Scanner exception:", e);
    }
    setIsScanning(false);
  };

  useEffect(() => {
    runGlobalScan();
  }, []);

  return (
    <StorageContext.Provider value={{ indexedFiles, runGlobalScan, permGranted, isScanning }}>
      {children}
    </StorageContext.Provider>
  );
}

export const useStorage = () => useContext(StorageContext);
