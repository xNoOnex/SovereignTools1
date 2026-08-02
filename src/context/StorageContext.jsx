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

      // 1. Instantly load Sovereign Custom Gallery items
      const customGallery = JSON.parse(localStorage.getItem('sovereign_custom_gallery') || '[]');
      filesFound.push(...customGallery);
      setIndexedFiles([...filesFound]); 

      // 2. Recursive Deep Scanner
      const scanDir = async (path, maxDepth, currentDepth = 0) => {
        if (currentDepth > maxDepth) return;
        try {
          const res = await Filesystem.readdir({ path, directory: Directory.ExternalStorage });
          for (const f of res.files) {
            const fullPath = path ? `${path}/${f.name}` : f.name;
            
            if (f.type === 'directory') {
               // Skip heavy/hidden OS folders to prevent RAM crashes
               if (f.name === 'Android' || f.name.startsWith('.')) continue;
               await scanDir(fullPath, maxDepth, currentDepth + 1);
            } else {
               const ext = f.name.includes('.') ? f.name.split('.').pop().toLowerCase() : 'file';
               filesFound.push({
                 name: f.name,
                 path: fullPath,
                 src: `file:///storage/emulated/0/${fullPath}`,
                 ext
               });
            }
          }
        } catch (e) {} // Skip unreadable folders
      };

      // Crawl entire External Storage up to 4 folders deep
      await scanDir('', 4);

      // Deduplicate files by path to prevent UI glitches
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
