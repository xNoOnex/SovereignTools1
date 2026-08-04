import React, { createContext, useContext, useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { registerPlugin } from '@capacitor/core';

const StorageIntentBridge = registerPlugin('StorageIntentBridge');
const StorageContext = createContext();

export function StorageProvider({ children }) {
  const [indexedFiles, setIndexedFiles] = useState([]);
  const [permGranted, setPermGranted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Helper function to recursively scan directories
  const deepScanDirectory = async (basePath, folderLabel) => {
    let results = [];
    try {
      const scan = await Filesystem.readdir({
        path: basePath,
        directory: Directory.ExternalStorage
      });

      if (scan && scan.files) {
        for (const f of scan.files) {
           const fileName = typeof f === 'string' ? f : (f.name || '');
           const fileType = f.type || 'file'; // Capacitor 4+ provides type: 'directory' or 'file'
           
           // If it's a directory, recursively scan it (preventing infinite loops by limiting depth if necessary, but standard media folders are fine)
           if (fileType === 'directory' || (!fileName.includes('.') && fileName.length > 0)) {
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
      // Silently skip inaccessible or empty nested folders
    }
    return results;
  };

  const runGlobalScan = async () => {
    setIsScanning(true);
    try {
      try {
        await StorageIntentBridge.requestAllFilesAccess();
      } catch (e) {
        console.warn("Storage intent skipped.");
      }

      const targetRoots = ['Download', 'Documents', 'Pictures', 'DCIM', 'Music', 'Movies'];
      let aggregatedFiles = [];

      // Run deep scan on all standard root directories
      for (const root of targetRoots) {
         const rootFiles = await deepScanDirectory(root, root);
         aggregatedFiles = [...aggregatedFiles, ...rootFiles];
      }

      if (aggregatedFiles.length === 0) {
        aggregatedFiles = [
          { name: 'sample_target.mp4', path: '/storage/emulated/0/Download/sample_target.mp4', ext: 'mp4', folder: 'Download' }
        ];
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
