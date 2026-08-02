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

      // 1. Load Sovereign Custom Gallery items
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
               if (f.name === 'Android' || f.name.startsWith('.')) continue;
               await scanDir(fullPath, maxDepth, currentDepth + 1);
            } else {
               const ext = f.name.includes('.') ? f.name.split('.').pop().toLowerCase() : 'file';
               const safeSrc = Capacitor.convertFileSrc(`file:///storage/emulated/0/${fullPath}`);
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

      // FIX: Scan explicit public directories to bypass Android Scoped Storage root blocking
      const safeRoots = ['DCIM', 'Pictures', 'Movies', 'Music', 'Download', 'Documents', 'Ringtones', 'Podcasts', 'Audiobooks'];
      
      for (const root of safeRoots) {
         await scanDir(root, 4);
      }

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
