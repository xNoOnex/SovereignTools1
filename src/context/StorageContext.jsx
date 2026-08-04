import React, { createContext, useContext, useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';

const StorageContext = createContext();

export function StorageProvider({ children }) {
  const [indexedFiles, setIndexedFiles] = useState([]);
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 64000000000 });
  const [permGranted, setPermGranted] = useState(false);

  const runGlobalScan = async () => {
    try {
      let results = [];
      
      try {
        const check = await Filesystem.checkPermissions();
        if (check.publicStorage === 'granted') {
           setPermGranted(true);
        } else {
           const req = await Filesystem.requestPermissions();
           if (req.publicStorage === 'granted') setPermGranted(true);
        }
      } catch (e) {
        console.warn("Permission dialog failed, attempting read anyway.");
      }

      try {
        const scan = await Filesystem.readdir({
          path: '', // Scan root of external storage instead of just Download
          directory: Directory.ExternalStorage
        });
        
        if (scan && scan.files) {
          results = scan.files.map(f => {
            const name = typeof f === 'string' ? f : (f.name || 'unknown');
            const ext = name.split('.').pop();
            return {
              name: name,
              path: `/storage/emulated/0/${name}`,
              ext: ext
            };
          });
        }
      } catch (readError) {
        console.error("Filesystem blocked read.", readError);
      }

      setIndexedFiles(results);
    } catch (e) {
      console.error("Fatal Scanner exception:", e);
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
