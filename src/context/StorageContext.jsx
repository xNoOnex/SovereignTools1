import React, { createContext, useContext, useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { registerPlugin } from '@capacitor/core';

const StorageIntentBridge = registerPlugin('StorageIntentBridge');
const StorageContext = createContext();

export function StorageProvider({ children }) {
  const [indexedFiles, setIndexedFiles] = useState([]);
  const [permGranted, setPermGranted] = useState(false);

  const runGlobalScan = async () => {
    try {
      try {
        // Trigger the native Android 11+ All Files Access intent
        await StorageIntentBridge.requestAllFilesAccess();
      } catch (e) {
        console.warn("Storage intent skipped or unavailable.");
      }

      const targetFolders = ['Download', 'Documents', 'Pictures', 'DCIM', 'Music', 'Movies'];
      let aggregatedFiles = [];

      for (const folder of targetFolders) {
        try {
          const scan = await Filesystem.readdir({
            path: folder,
            directory: Directory.ExternalStorage
          });

          if (scan && scan.files) {
            const folderFiles = scan.files.map(f => {
              const name = typeof f === 'string' ? f : (f.name || 'unknown');
              const ext = name.split('.').pop().toLowerCase();
              return {
                name: name,
                path: `/storage/emulated/0/${folder}/${name}`,
                ext: ext,
                folder: folder
              };
            });
            aggregatedFiles = [...aggregatedFiles, ...folderFiles];
          }
        } catch (err) {
           // Skip empty/blocked folders silently
        }
      }

      setIndexedFiles(aggregatedFiles);
      if (aggregatedFiles.length > 0) setPermGranted(true);
    } catch (e) {
      console.error("Scanner exception:", e);
    }
  };

  useEffect(() => {
    runGlobalScan();
  }, []);

  return (
    <StorageContext.Provider value={{ indexedFiles, runGlobalScan, permGranted }}>
      {children}
    </StorageContext.Provider>
  );
}

export const useStorage = () => useContext(StorageContext);
