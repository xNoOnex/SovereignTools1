import React, { createContext, useContext, useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const StorageContext = createContext();

export function StorageProvider({ children }) {
  const [indexedFiles, setIndexedFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const runGlobalScan = async () => {
    setIsScanning(true);
    try {
      let filesFound = [];

      // 1. Load custom gallery items (Already base64/safe data URLs)
      const customGallery = JSON.parse(localStorage.getItem('sovereign_custom_gallery') || '[]');
      filesFound.push(...customGallery);

      // 2. Recursive Deep Scanner
      const scanDir = async (path, maxDepth, currentDepth = 0) => {
        if (currentDepth > maxDepth) return;
        try {
          const res = await Filesystem.readdir({ path, directory: Directory.ExternalStorage });
          for (const f of res.files) {
            const fullPath = path ? `${path}/${f.name}` : f.name;
            
            if (f.type === 'directory') {
               // Skip heavy/hidden OS folders to prevent crashes
               if (f.name === 'Android' || f.name.startsWith('.')) continue;
               await scanDir(fullPath, maxDepth, currentDepth + 1);
            } else {
               const ext = f.name.includes('.') ? f.name.split('.').pop().toLowerCase() : 'file';
               
               // FIX: Convert raw file path to secure Capacitor WebView URL
               const rawPath = `file:///storage/emulated/0/${fullPath}`;
               const safeSrc = Capacitor.convertFileSrc(rawPath);

               filesFound.push({
                 name: f.name,
                 path: fullPath,
                 src: safeSrc,
                 ext
               });
            }
          }
        } catch (e) {}
      };

      await scanDir('', 4);

      // Deduplicate files by path
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
