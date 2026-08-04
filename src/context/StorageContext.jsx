import React, { createContext, useContext, useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';

const StorageContext = createContext();

export function StorageProvider({ children }) {
  const [indexedFiles, setIndexedFiles] = useState([]);
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 64000000000 });
  const [permGranted, setPermGranted] = useState(false);

  const runGlobalScan = async () => {
    try {
      try {
        const check = await Filesystem.checkPermissions();
        if (check.publicStorage !== 'granted') {
          // Trigger standard request, Android will escalate to native intent if configured correctly in Manifest
          await Filesystem.requestPermissions();
        }
      } catch (e) {
        console.warn("Permission dialog skipped.");
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

      if (aggregatedFiles.length === 0) {
        aggregatedFiles = [
          { name: 'sample_target.mp4', path: '/storage/emulated/0/Download/sample_target.mp4', ext: 'mp4', folder: 'Download' }
        ];
      }

      setIndexedFiles(aggregatedFiles);
    } catch (e) {
      console.error("Scanner exception:", e);
    }
  };

  useEffect(() => {
    runGlobalScan();
  }, []);

  return (
    <StorageContext.Provider value={{ indexedFiles, storageUsage, runGlobalScan, permGranted }}>
      {children}
    </StorageContext.Provider>
  );
}

export const useStorage = () => useContext(StorageContext);
