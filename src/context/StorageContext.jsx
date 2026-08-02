import React, { createContext, useContext, useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';

const StorageContext = createContext();

export function StorageProvider({ children }) {
  const [indexedFiles, setIndexedFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const runGlobalScan = async () => {
    setIsScanning(true);
    try {
      let filesFound = [];

      // 1. Load custom gallery items saved from Sovereign Camera
      const customGallery = JSON.parse(localStorage.getItem('sovereign_custom_gallery') || '[]');
      filesFound.push(...customGallery);

      // 2. RE-ENABLE FULL GLOBAL STORAGE RECURSIVE SCAN FOR SHREDDER
      const targetDirs = [
        Directory.ExternalStorage,
        Directory.Documents,
        Directory.Pictures,
        Directory.Movies,
        Directory.Music,
        Directory.Data
      ];

      for (const d of targetDirs) {
        try {
          const result = await Filesystem.readdir({ path: '', directory: d });
          for (const file of result.files) {
            const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'file';
            filesFound.push({
              name: file.name,
              path: file.name,
              src: `file:///storage/emulated/0/${file.name}`,
              ext
            });
          }
        } catch (e) {}
      }

      // Deduplicate by path
      const uniqueFiles = Array.from(new Map(filesFound.map(item => [item.path, item])).values());
      setIndexedFiles(uniqueFiles);
    } catch (e) {}
    setIsScanning(false);
  };

  useEffect(() => {
    runGlobalScan();
  }, []);

  const removeFileFromState = (path) => {
    setIndexedFiles(prev => prev.filter(f => f.path !== path));
    const customGallery = JSON.parse(localStorage.getItem('sovereign_custom_gallery') || '[]');
    const updated = customGallery.filter(f => f.path !== path);
    localStorage.setItem('sovereign_custom_gallery', JSON.stringify(updated));
  };

  return (
    <StorageContext.Provider value={{ indexedFiles, isScanning, runGlobalScan, removeFileFromState }}>
      {children}
    </StorageContext.Provider>
  );
}

export const useStorage = () => useContext(StorageContext);
