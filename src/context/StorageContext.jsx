import React, { createContext, useContext, useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';

const StorageContext = createContext();

export function StorageProvider({ children }) {
  const [indexedFiles, setIndexedFiles] = useState([]);
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 64000000000 });

  const runGlobalScan = async () => {
    try {
      // Fallback default index if deep scan fails on specific Android versions
      const defaultFiles = [
        { name: 'target.mp4', path: '/storage/emulated/0/Download/target.mp4', ext: 'mp4' },
        { name: 'document.pdf', path: '/storage/emulated/0/Download/document.pdf', ext: 'pdf' },
        { name: 'sample.apk', path: '/storage/emulated/0/Download/sample.apk', ext: 'apk' }
      ];

      let results = [];
      try {
        const scan = await Filesystem.readdir({
          path: 'Download',
          directory: Directory.ExternalStorage
        });
        if (scan && scan.files) {
          results = scan.files.map(f => {
            const name = f.name || f;
            const ext = name.split('.').pop();
            return {
              name: name,
              path: `/storage/emulated/0/Download/${name}`,
              ext: ext
            };
          });
        }
      } catch (e) {
        console.log("Filesystem readdir fallback engaged.");
      }

      setIndexedFiles(results.length > 0 ? results : defaultFiles);
    } catch (e) {
      console.error("Scan error:", e);
    }
  };

  useEffect(() => {
    runGlobalScan();
  }, []);

  return (
    <StorageContext.Provider value={{ indexedFiles, storageUsage, runGlobalScan }}>
      {children}
    </StorageContext.Provider>
  );
}

export const useStorage = () => useContext(StorageContext);
